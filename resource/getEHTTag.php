<?php

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
require_once 'dbConf.php';

$confFile = __DIR__ . '/../server/config.toml';
if (!file_exists($confFile)) exit('conf file not found');
$rootMatch = [];
preg_match('/\broot\s*=\s*[\'"](.+?)[\'"]/i', file_get_contents($confFile), $rootMatch);
if (empty($rootMatch)) exit('root path not defined');
$rootPath = $rootMatch[1];

Cookies::parseFromStr(file_get_contents(__DIR__ . '/getEHTTag.cookie.txt'));

$rootId = $argv[1];
$ifExs  = ORMPG::table('node')->where('id', $rootId)->first();
if (empty($ifExs)) exit('root not found');

//$sourceNodeId = $argv[1];
$baseRoot = $rootPath . '/' . $ifExs['node_path'];
@unlink(__FILE__ . '.log');
//
$fileLs = GenFunc::scanDirPlus($baseRoot);
$count=0;
foreach ($fileLs as $filePath) {
    if (!is_dir($filePath)) continue;
    $articleDirName = basename($filePath);
    //
    $articleTagFile = $filePath . '/_tags.json';
    if (file_exists($articleTagFile)) continue;
    //检测是标准格式的文件名
    $ifValid = null;
    $tTitle  = preg_replace('/^[\(\)a-z0-9.\-]+\s/i', '', $articleDirName);
    if (empty($tTitle)) continue;
    preg_match('/^(\[|\().+?(\]|\)).+?/i', $tTitle, $ifValid);
    if (empty($ifValid)) {
        file_put_contents(
            __FILE__ . '.log',
//                implode('', ['', $tTitle, "\r\n"]),
            implode("\t", ['error:', $filePath, $tTitle,]) . "\r\n",
            FILE_APPEND);
        continue;
    }
    $tKeywords = preg_replace(
        "/[\s=\.\-\^'\/,\\:*?\"|<>\[\]\(\)\{\}【】（）\{\}]+/im",
        ' ',
        $tTitle
    );
    $tagLs     = getEHTTag($tKeywords);
    file_put_contents($articleTagFile, json_encode($tagLs));
    $count += 1;
//    if ($count > 3000) break;
    sleep(mt_rand(10, 15));
}
exit();

function getEHTTag($searchKeywords) {

//var_dump($title);
//var_dump(file_get_contents(__DIR__ . '/getEHTTag.cookie.txt'));
//exit();

//var_dump(Cookies::$list);
//exit();
    $href = 'https://exhentai.org/?' . http_build_query([
            'f_search'  => $searchKeywords,
            'advsearch' => '1',
            'f_sfu'     => 'on',
            'f_sft'     => 'on',
        ]);
    echo $href, "\r\n";
    $content = curl([
        'url'    => $href,
        'header' => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Sec-Ch-Ua: "Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
            'accept-encoding: gzip',
            'Sec-Ch-Ua-Mobile: ?0',
            'Sec-Ch-Ua-Platform: "Windows"',
            'Sec-Fetch-Dest: document',
            'Sec-Fetch-Mode: navigate',
            'Sec-Fetch-Site: none',
            'Sec-Fetch-User: ?1',
            'Upgrade-Insecure-Requests: 1',
        ],
        'option' => [
            CURLOPT_ENCODING => 'gzip',
            //            CURLOPT_PROXY     => '127.0.0.1',
            //            CURLOPT_PROXYPORT => 7890,
        ],
    ]);
//var_dump($content);
//exit();
    if (empty($content['content'])) return;
    file_put_contents(__DIR__ . '/getEHTTag.content.dev.html', $content['content']);
//exit();
    $content = $content['content'];
//var_dump($content);
//$curNode = ORM::table('node')->where('id', 8527)->first();
//$content = file_get_contents(__DIR__ . '/getEHTTag.smp.html');
    $tableLs = [];
    preg_match_all('/<table(?!<table)([\s\S]+?)<\/table>/im', $content, $tableLs, PREG_SET_ORDER);
//var_dump($tableLs);
    $tagSet = [];
    foreach ($tableLs as $table) {
        $tagLss = [];
        preg_match_all('/<div class="(?:gtl|gt|gtw)"[^>]+?title="(.+?)">[\s\S]+?<\/div>/im', $table[0], $tagLss, PREG_SET_ORDER);
//    var_dump($tagLss);
        foreach ($tagLss as $tag) {
            $tagSet[] = str_replace([
                '+',
            ], [
                ' ',
            ], urldecode($tag[1]));
        }
    }
//var_dump($tagSet);
//exit();
    $tagSet = array_keys(array_flip($tagSet));
    $tagLs  = [];
    foreach ($tagSet as $tag) {
        $tagLs[] = explode(':', $tag, 2);
    }
    return $tagLs;
//var_dump($tagLs);
//exit();
//var_dump($matchRes);
}









