<?php
//require_once 'lib_php/bootloader.php';
//require_once 'lib_php/GenFunc.php';

$content = file_get_contents(__DIR__ . '/MC Library.xml');
//$use_errors = libxml_use_internal_errors(true);
//$content = simplexml_load_string($content, null,
//    LIBXML_NOENT | LIBXML_PARSEHUGE | LIBXML_DTDVALID | LIBXML_BIGLINES | LIBXML_PEDANTIC
//);
//$content = json_decode(json_encode($content, JSON_UNESCAPED_UNICODE), true);
//var_dump($content);
//var_dump(libxml_get_errors());

//simplexml处理会报错，转用正则
$sArr = [];
preg_match_all('/<Item>[\s\S]+?<\/Item>/im', $content, $sArr);
//var_dump($sArr[0]);
$resArr = [];
foreach ($sArr[0] as $s) {
    $metaArr = [];
    preg_match_all('/<Field Name="([^"]*?)">([^<]*?)<\/Field>/im', $s, $metaArr, PREG_SET_ORDER);
//    var_dump($metaArr);
    $metaMap = [];
    foreach ($metaArr as $meta) {
        $metaMap[$meta[1]] = $meta[2];
    }
    $resArr[] = $metaMap;
//    var_dump($metaMap);
//    exit();
}
file_put_contents(__DIR__ . '/MC Library.json', json_encode($resArr, JSON_UNESCAPED_UNICODE));
//var_dump($sArr);




