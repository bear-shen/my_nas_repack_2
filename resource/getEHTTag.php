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
require_once $root . '/lib_php/ORM.php';
require_once $root . '/lib_php/DB.php';


//var_dump(
//    gzinflate(substr(file_get_contents(__DIR__ . '/getEHTTag.content.gz.2.txt'), 10, -8))
//);
//exit();
global $dbConf;
$dbConf = [
    'host'    => '127.0.0.1:3306',
    'db'      => 'toshokan',
    'name'    => 'root',
    'pass'    => 'root',
    'charset' => 'utf8mb4',
];


$sourceNodeId = $argv[1];

$curNode = ORM::table('node')->where('id', $sourceNodeId)->first();
if (!$curNode) return;
$title = $curNode['title'];
$title = preg_replace(
    "/[\.\-\^'\/,\r\n\t\\:*?\"|<>\[\]\(\)\{\}]+/im",
    ' ',
    $title
);
$title = explode(' ', $title);
$title = array_filter($title, function ($sub) {
    return mb_strlen($sub) > 1;
});
$title = implode(' ', $title);
//var_dump($title);
//var_dump(file_get_contents(__DIR__ . '/getEHTTag.cookie.txt'));
//exit();
Cookies::parseFromStr(file_get_contents(__DIR__ . '/getEHTTag.cookie.txt'));
//var_dump(Cookies::$list);
//exit();
$href = 'https://exhentai.org/?' . http_build_query([
        'f_search'  => $title,
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
        'Sec-Ch-Ua-Mobile: ?0',
        'Sec-Ch-Ua-Platform: "Windows"',
        'Sec-Fetch-Dest: document',
        'Sec-Fetch-Mode: navigate',
        'Sec-Fetch-Site: none',
        'Sec-Fetch-User: ?1',
        'Upgrade-Insecure-Requests: 1',
    ],
    'option' => [
        CURLOPT_ENCODING  => 'gzip',
        CURLOPT_PROXY     => '172.22.112.1',
        CURLOPT_PROXYPORT => 7890,
    ],
]);
//var_dump($content);
//exit();
if (empty($content['content'])) return;
//file_put_contents(__DIR__ . '/getEHTTag.content.gz.txt', print_r($content, true));
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
        $tagSet[] = $tag[1];
    }
}
//var_dump($tagSet);
//exit();
$tagSet = array_keys(array_flip($tagSet));
$tagLs  = [];
foreach ($tagSet as $tag) {
    $tagLs[] = explode(':', $tag, 2);
}
//var_dump($tagLs);
//exit();
$tagIdLs = [];
foreach ($tagLs as $tagInfo) {
    list($tagGroup, $tagName) = $tagInfo;
    $ifGroupExs = ORM::table('tag_group')->where('title', $tagGroup)->first();
    if (empty($ifGroupExs)) {
        $ifGroupExs = [
            'id_node'     => 0,
            'title'       => $tagGroup,
            'description' => $tagGroup,
            'sort'        => 0,
            'status'      => 1,
        ];
        ORM::table('tag_group')->insert($ifGroupExs);
        $ifGroupExs['id'] = ORM::lastInsertId();
    }
    $ifTagExs = ORM::table('tag')->
    where('title', $tagName)->
    orWhereRaw('find_in_set(?,alt)', [$tagName])->
    first();
//    exit();
    if (empty($ifTagExs)) {
        $ifTagExs = [
            'id_group'    => $ifGroupExs['id'],
            'title'       => $tagName,
            'alt'         => $tagName,
            'description' => $tagName,
            'status'      => 1,
            'index_tag'   => '',
        ];
        ORM::table('tag')->insert($ifTagExs);
        $ifTagExs['id'] = ORM::lastInsertId();
    }
//    var_dump('=============');
//    var_dump($tagName);
//    var_dump($ifTagExs['title']);
    $tagIdLs[] = (string)intval($ifTagExs['id']);
}
//exit();
if (!empty($curNode['tag_id_list'])) {
    $preTagLs = explode(',', $curNode['tag_id_list']);
    foreach ($preTagLs as $tagId) {
        if (empty($tagId)) continue;
        $tagIdLs[] = (string)intval($tagId);
    }
}
//print_r($tagIdLs);
//exit();
$tagIdLs = array_keys(array_flip($tagIdLs));
ORM::table('node')->where('id', $curNode['id'])->update([
    'tag_id_list' => implode(',', $tagIdLs)
]);
ORM::table('queue')->insert([
    'type'    => 'file/rebuildIndex',
    'payload' => json_encode([
        'id' => $curNode['id'],
    ]),
    'status'  => 1,
]);
sleep(mt_rand(3, 7));
//var_dump($matchRes);








