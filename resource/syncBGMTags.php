<?php
//@notice data from https://github.com/bangumi/Archive/releases
//thanks

//error_reporting(E_ERROR);
//class GenFunc::
$root = __DIR__;
//require_once $root . '/lib_php/bootloader.php';
require_once $root . '/lib_php/GenFunc.php';
//class Cache::
require_once $root . '/lib_php/Cache.php';
//inner
//require_once 'Cookies.php';
require_once $root . '/lib_php/Lib.php';
require_once $root . '/lib_php/ORMPG.php';
require_once $root . '/lib_php/DBPG.php';
require_once $root . '/dbConf.php';

$orgBgmConfUrl   = 'https://github.com/bangumi/Archive/raw/refs/heads/master/aux/latest.json';
$downloadZipPath = __DIR__ . '/bgm.zip';
$zipExtractPath  = __DIR__ . '/bgm';
$matchTarget     = [
    ['file' => $zipExtractPath . '/subject.jsonlines', 'cache_name' => 'bgm_subject', 'tag_group' => 'parody'],
    ['file' => $zipExtractPath . '/character.jsonlines', 'cache_name' => 'bgm_character', 'tag_group' => 'character'],
];
//
$useDownload = true;
$useExtract  = true;
$useParse    = true;
$useSync     = true;

//
if ($useDownload) {
    echo '$useDownload = true', "\r\n";
    echo 'start get url', "\r\n";
    $bgmConfReq = curl([
        'url'    => $orgBgmConfUrl,
        'option' => [
            CURLOPT_FOLLOWLOCATION => true,
        ]
    ]);
    sleep(1);
    if (empty($bgmConfReq['content'])) exit('curl exec failed, exit');
    $bgmData = json_decode($bgmConfReq['content'], true);
    $zipUrl  = $bgmData['browser_download_url'];
    echo 'download from: ', $zipUrl, "\r\n";
    $downloadResult = curlFile([
        'url'    => $zipUrl,
        'path'   => $downloadZipPath,
        'option' => [
            CURLOPT_FOLLOWLOCATION => true,
        ],
    ]);
    sleep(1);
    if (!$downloadResult) exit('db download failed, exit');
    if (!file_exists($downloadZipPath) || !filesize($downloadZipPath)) exit('db download failed, exit');
    echo 'download success', "\r\n";
}
//
if ($useExtract) {
    echo '$useExtract = true', "\r\n";
    $execCmd = printf(
        'unzip -o %s -d %s',
        $downloadZipPath, $zipExtractPath
    );
    exec($execCmd);
    if (!file_exists($zipExtractPath)) exit('db extract failed, exit');
    $jsonLs = scandir($zipExtractPath);
    if (sizeof($jsonLs) < 3) exit('db extract success but no data');
}
//
if ($useParse) {
    echo '$useParse = true', "\r\n";
    foreach ($matchTarget as $target) {
        $target += [
            'file'       => '',
            'cache_name' => '',
            'tag_group'  => '',
        ];
        //
        $content = file_get_contents($target['file']);
        $arr     = explode("\n", $content);
        $col     = [];
        ORMPG::execute(printf('truncate table %s', $target['cache_name']));
        foreach ($arr as $i => $row) {
            if (!($i % 100)) echo 'loading: ', $i, '/', sizeof($arr), "\r\n";

            $row = trim($row);
            if (empty($row)) continue;
            $row = json_decode($row, true);
            if (empty($row)) continue;
            //            echo $row['name'], "\r\n";
            $col[] = $row;
            $ifExs = ORMPG::table($target['cache_name'])->where('id', $row['id'])->first(['id']);
            if ($ifExs) ORMPG::table($target['cache_name'])->where('id', $row['id'])->delete();
            $tRow = [];
            foreach ($row as $k => $v) {
                switch (gettype($v)) {
                    default:
                        $tRow[$k] = $v;
                        break;
                    case 'array':
                        $tRow[$k] = json_encode($v, JSON_UNESCAPED_UNICODE);
                        break;
                    case 'boolean':
                        $tRow[$k] = $v ? 1 : 0;
                        break;
                }
            }
            ORMPG::table($target['cache_name'])->insert($tRow);
        }
        file_put_contents(
            $zipExtractPath . '/' . $target['cache_name'] . '.json',
            json_encode($col, JSON_UNESCAPED_UNICODE)
        );
    }
}
//
if ($useSync) {
    echo '$useSync = true', "\r\n";
    foreach ($matchTarget as $target) {
        $target += [
            'file'       => '',
            'cache_name' => '',
            'tag_group'  => '',
        ];
        $group  = ORMPG::table('tag_group')->where('title', $target['tag_group'])->first();
        if (empty($group)) continue;
        echo 'matching group: ', $target['tag_group'], "\r\n";
        $tagLs = ORMPG::table('tag')->where('id_group', $group['id'])->
        whereNull('id_bgm')->
        select();
        foreach ($tagLs as $i => $tag) {
            if (!($i % 100)) echo 'matching: ', $i, '/', sizeof($tagLs), "\r\n";
//            echo $tag['title'], "\r\n";
            switch ($group['title']) {
                default:
                    break;
                case 'parody':
                    $ifSuccess = syncParody($tag);
                    break;
                case 'character':
                    $ifSuccess = syncCharacter($tag);
                    break;
            }
        }

    }
}

exit();


function syncParody($tag) {
    $alt = json_decode($tag['alt'], true) ?? [];
    if (sizeof($alt) > 1) return;
    $curAlt = strtolower($alt[0]);
    //CREATE INDEX if not EXISTS "bgm_subject_index" ON "bgm_subject" USING pgroonga ("infobox","name","name_cn","summary");
    $ls = ORMPG::table('bgm_subject')->
    where('infobox', 'ilike', '%' . $tag['title'] . '%')->
    orWhere('name', 'ilike', '%' . $tag['title'] . '%')->
    orWhere('name_cn', 'ilike', '%' . $tag['title'] . '%')->
    orWhere('summary', 'ilike', '%' . $tag['title'] . '%')->
    select();
    foreach ($ls as $row) {
        $infobox = $row['infobox'];
        $ttArr   = [];
        $altArr  = matchArr($infobox, '别名');
        if ($altArr) foreach ($altArr as $alt) $ttArr[] = $alt;
        $altCN = matchStr($infobox, '中文名');
        if ($altCN) $ttArr[] = $altCN;
        $ttName = $row['name'];
        if ($ttName) $ttArr[] = $ttName;
        $ttNameCN = $row['name_cn'];
        if ($ttNameCN) $ttArr[] = $ttNameCN;
        //
        $ttArr = array_keys(array_flip($ttArr));
        $hit   = false;
        foreach ($ttArr as $val) {
            if (strtolower($val) != $curAlt) continue;
            $hit = true;
        }
        if (!$hit) continue;
        //    var_dump($newAltLs);
        ORMPG::table('tag')->where('id', $tag['id'])->update([
            'alt'    => json_encode($ttArr, JSON_UNESCAPED_UNICODE),
            'id_bgm' => $row['id'],
        ]);
        return true;
    }
}

function syncParody_sim($tag) {
    $alt = json_decode($tag['alt'], true) ?? [];
    if (sizeof($alt) > 1) return;
    $curAlt = strtolower($alt[0]);
    //CREATE INDEX if not EXISTS "bgm_subject_index" ON "bgm_subject" USING pgroonga ("infobox","name","name_cn","summary");
    $ls = ORMPG::table('bgm_subject')->
    whereRaw('infobox &@* ?', [$tag['title']])->
    select();
    foreach ($ls as $row) {
        $infobox = $row['infobox'];
        $ttArr   = [$tag['title']];
        $altArr  = matchArr($infobox, '别名');
        if ($altArr) foreach ($altArr as $alt) $ttArr[] = $alt;
        $altCN = matchStr($infobox, '中文名');
        if ($altCN) $ttArr[] = $altCN;
        $ttName = $row['name'];
        if ($ttName) $ttArr[] = $ttName;
        $ttNameCN = $row['name_cn'];
        if ($ttNameCN) $ttArr[] = $ttNameCN;
        //
        $ttArr = array_keys(array_flip($ttArr));
        //    var_dump($newAltLs);
        ORMPG::table('tag')->where('id', $tag['id'])->update([
            'alt'    => json_encode($ttArr, JSON_UNESCAPED_UNICODE),
            'id_bgm' => $row['id'],
        ]);
        return true;
    }
}

function syncCharacter($tag) {
    $alt = json_decode($tag['alt'], true) ?? [];
    if (sizeof($alt) > 1) return;
    $curAlt = strtolower($alt[0]);
    //CREATE INDEX if not EXISTS "bgm_character_index" ON "bgm_character" USING pgroonga ("infobox","name");
    $ls = ORMPG::table('bgm_character')->
    where('infobox', 'ilike', '%' . $tag['title'] . '%')->
    orWhere('name', 'ilike', '%' . $tag['title'] . '%')->
    select();
    foreach ($ls as $row) {
        $infobox = $row['infobox'];
        $ttArr   = [];
        $altArr  = matchArr($infobox, '别名');
        if ($altArr) foreach ($altArr as $alt) {
            $altArr = explode('|', $alt);
            if (empty($altArr[1])) continue;
            $ttArr[] = $altArr[1];
        }
        $altCN = matchStr($infobox, '简体中文名');
        if ($altCN) $ttArr[] = $altCN;
        $ttName = $row['name'];
        if ($ttName) $ttArr[] = $ttName;
        //
        $ttArr = array_keys(array_flip($ttArr));
        $hit   = false;
        foreach ($ttArr as $val) {
            if (strtolower($val) != $curAlt) continue;
            $hit = true;
        }
        if (!$hit) continue;
        //    var_dump($newAltLs);
        ORMPG::table('tag')->where('id', $tag['id'])->update([
            'alt'    => json_encode($ttArr, JSON_UNESCAPED_UNICODE),
            'id_bgm' => $row['id'],
        ]);
        return true;
    }
}


function syncCharacter_sim($tag) {
    $alt = json_decode($tag['alt'], true) ?? [];
    if (sizeof($alt) > 1) return;
    $curAlt = strtolower($alt[0]);
    //CREATE INDEX if not EXISTS "bgm_character_index" ON "bgm_character" USING pgroonga ("infobox","name");
    $ls = ORMPG::table('bgm_character')->
    whereRaw('infobox &@* ?', [$tag['title']])->
    select();
    foreach ($ls as $row) {
        $infobox = $row['infobox'];
        $ttArr   = [$tag['title']];
        $altArr  = matchArr($infobox, '别名');
        if ($altArr) foreach ($altArr as $alt) {
            $altArr = explode('|', $alt);
            if (empty($altArr[1])) continue;
            $ttArr[] = $altArr[1];
        }
        $altCN = matchStr($infobox, '简体中文名');
        if ($altCN) $ttArr[] = $altCN;
        $ttName = $row['name'];
        if ($ttName) $ttArr[] = $ttName;
        //
        $ttArr = array_keys(array_flip($ttArr));
        //    var_dump($newAltLs);
        ORMPG::table('tag')->where('id', $tag['id'])->update([
            'alt'    => json_encode($ttArr, JSON_UNESCAPED_UNICODE),
            'id_bgm' => $row['id'],
        ]);
        return true;
    }
}


function matchArr($str, $key = '') {
    preg_match("/\|{$key}=\{[^}]+?}[\r\n]+/im", $str, $ifMatch);
    if (empty($ifMatch)) return [];
    $sub = explode("\r\n", trim($ifMatch[0]));
    array_shift($sub);
    array_pop($sub);
    $sub = array_values($sub);
    $arr = [];
    foreach ($sub as $str) {
        $arr[] = trim($str, '[]');
    }
    return $arr;
}

function matchStr($str, $key = '') {
    preg_match("/\|{$key}=(.+?)[\r\n]+/im", $str, $ifMatch);
//    var_dump($str);
    if (empty($ifMatch)) return null;
//    var_dump($ifMatch);
//    var_dump($ifMatch[1]);
    return trim($ifMatch[1]);
}

//ALTER TABLE "public"."tag"
//  ADD COLUMN "id_bgm" int8;
