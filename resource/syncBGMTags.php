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

global $dbConf;
$dbConf = [
    'host' => '127.0.0.1',
    'port' => '5432',
    'db'   => 'toshokan',
    'name' => 'postgres',
    'pass' => '1',
];


$dir    = __DIR__ . '/bgm/';
$fileLs = [
    'bgm_subject'            => $dir . 'subject.jsonlines',
    'bgm_episode'            => $dir . 'episode.jsonlines',
    'bgm_character'          => $dir . 'character.jsonlines',
    'bgm_subject_persons'    => $dir . 'subject-persons.jsonlines',
    'bgm_subject_relations'  => $dir . 'subject-relations.jsonlines',
    'bgm_person'             => $dir . 'person.jsonlines',
    'bgm_subject_characters' => $dir . 'subject-characters.jsonlines',
    'bgm_person_characters'  => $dir . 'person-characters.jsonlines',
];

/*foreach ($fileLs as $dbName => $file) {
    $content = file_get_contents($file);
    $arr     = explode("\n", $content);
    $col     = [];
    foreach ($arr as $row) {
        $row   = trim($row);
        $row   = json_decode($row, true);
        $col[] = $row;
        $ifExs = ORM::table($dbName)->where('id', $row['id'])->first();
        if ($ifExs) ORM::table($dbName)->where('id', $row['id'])->delete();
        ORM::table($dbName)->insert($row);
    }
    file_put_contents($dir . $dbName . '.json', json_encode($col, JSON_UNESCAPED_UNICODE));
}*/


$groupLs = ORMPG::table('tag_group')->select();
foreach ($groupLs as $group) {
    switch ($group['title']) {
        default:
            break;
        case 'parody':
            $tagLs = ORMPG::table('tag')->where('id_group', $group['id'])->
            whereNull('id_bgm')->
            select();
            foreach ($tagLs as $tag) {
                echo $tag['title'], "\r\n";
                $ifSuccess = syncParody($tag);
                if (!$ifSuccess) $ifSuccess = syncParody_sim($tag);
            }
            break;
        case 'character':
            $tagLs = ORMPG::table('tag')->where('id_group', $group['id'])->
            whereNull('id_bgm')->
            select();
            foreach ($tagLs as $tag) {
                echo $tag['title'], "\r\n";
                $ifSuccess = syncCharacter($tag);
                if (!$ifSuccess) $ifSuccess = syncCharacter_sim($tag);
            }
            break;
    }
}

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
