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
require_once $root . '/dbConf.php';

$rootId      = $argv[1];
$uid         = $argv[2];
$tmpFilePath = $argv[3];

if (!file_exists($tmpFilePath)) exit($tmpFilePath . ' not found');
$content = file_get_contents($tmpFilePath);

$rootNode = ORMPG::table('node')->where('id', $rootId)->first();
if (empty($rootNode)) exit('root node not found');

$user = ORMPG::table('"user"')->where('id', $uid)->first();
if (empty($user)) exit('user not found');


echo 'start process xml data', "\r\n";
//simplexml处理会报错，转用正则
$sArr = [];
preg_match_all('/<Item>[\s\S]+?<\/Item>/im', $content, $sArr);
$contentLs = [];
foreach ($sArr[0] as $s) {
    $metaArr = [];
    preg_match_all('/<Field Name="([^"]*?)">([^<]*?)<\/Field>/im', $s, $metaArr, PREG_SET_ORDER);
    $metaMap = [];
    foreach ($metaArr as $meta) {
        $metaMap[$meta[1]] = $meta[2];
    }
    $contentLs[] = $metaMap;
}
file_put_contents(__DIR__ . '/MCLibrary.json', json_encode($contentLs, JSON_UNESCAPED_UNICODE));
echo 'save cache to MCLibrary.json, size: ', sizeof($contentLs), "\r\n";
//
$sp = '\\';
foreach ($contentLs as $i => $row) {
    if (!($i % 100)) echo 'checking: ', $i, '/', sizeof($contentLs), "\r\n";
    if (empty($row['Filename'])) continue;
    if ($row['Media Type'] !== 'Audio') continue;
    //导入的内容限制在当前文件夹内
    $row['Filename'] = html_entity_decode($row['Filename']);
    $rootDirTitle    = $sp . $rootNode['title'] . $sp;
    $rootTitleOffset = stripos($row['Filename'], $rootDirTitle);
    if ($rootTitleOffset === false) continue;
    $path    = mb_substr($row['Filename'], $rootTitleOffset + mb_strlen($rootDirTitle));
    $pathArr = explode($sp, $path);
    //
    $node = null;
    $pid  = $rootNode['id'];
    foreach ($pathArr as $subTitle) {
        $ifExs = ORMPG::table('node')->where('id_parent', $node?$node['id']:$pid)->where('title', $subTitle)->first();
        if (empty($ifExs)) {
            echo $path, "\tnot found", "\r\n";
            continue 2;
        }
        $node = $ifExs;
    }
    if (empty($node)) continue;
    $targetMeta = extractMeta($row);
    $ifRate     = ORMPG::table('rate')
                       ->where('id_user', $uid)
                       ->where('id_node', $node['id'])
                       ->first();
    if ($ifRate) {
        ORMPG::table('rate')->where('id', $ifRate['id'])->update(['rate' => $targetMeta['rate'] * 2]);
    } else {
        ORMPG::table('rate')->insert([
            'id_user' => $uid,
            'id_node' => $node['id'],
            'rate'    => $targetMeta['rate'] * 2,
        ]);
    }
    ORMPG::table('node')->where('id', $node['id'])->update(['description' => $targetMeta['desc']]);
    //exit();
}

@unlink($tmpFilePath);

exit();

function extractMeta($rowMeta) {
    $res        = [
        'rate' => 0,
        'desc' => [],
    ];
    $descRowDef = [
        "Album"           => "",
        "Artist"          => "",
        "Album Artist"    => "",
        //        "Name"            => "",
        "Composer"        => "",
        "Grouping"        => "",
        "Genre"           => "",
        "Date (readable)" => "",
        //        "Duration"        => "",
        //        "Bitrate"         => "",
        //        "Track #"         => "",
        //        "Disc #"          => "",
        //        "Sample Rate"     => "",
        //        "Channels"        => "",
        //        "Bit Depth"       => "",
        //        "Copyright"       => "",
    ];
    if (isset($rowMeta['Rating'])) $res['rate'] = intval($rowMeta['Rating']);
    $rowMeta = array_intersect_key($rowMeta, $descRowDef);
    foreach ($rowMeta as $k => $v) {
        $res['desc'][] = $k . ': ' . $v;
    }
    $res['desc'] = implode("\r\n", $res['desc']);
    return $res;
}

function titleFilter($title) {
    return mb_ereg_replace('[\\\/:*?"<>|#\r\n\t\s]+', ' ', $title);
}

