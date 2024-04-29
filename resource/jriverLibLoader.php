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
$dbConf     = [
    'host'    => '127.0.0.1:3306',
    'db'      => 'toshokan',
    'name'    => 'root',
    'pass'    => 'root',
    'charset' => 'utf8mb4',
];
$localPath  = 'G:\\db_music\\';
$targetPath = 'db_music';
//
$targetPathArr = explode('/', trim($targetPath, '/'));
$pid           = 0;
foreach ($targetPathArr as $dirName) {
    $ifExs = ORM::table('node')->where('id_parent', $pid)->where('title', $dirName)->first();
    if (empty($ifExs)) {
        echo $dirName, "\tnot found";
        exit();
    }
    $pid = $ifExs['id'];
}
$contentLs = file_get_contents(__DIR__ . '/MC Library.json');
$contentLs = json_decode($contentLs, true);
foreach ($contentLs as $row) {
    if (empty($row['Filename'])) continue;
    if (stripos($row['Filename'], $localPath) !== 0) continue;
    $path    = mb_substr($row['Filename'], mb_strlen($localPath));
    $pathArr = explode('/', trim($path, '/'));
    $nodeId  = $pid;
    foreach ($pathArr as $dirName) {
        $ifExs = ORM::table('node')->where('id_parent', $nodeId)->where('title', $dirName)->first();
        if (empty($ifExs)) {
            echo $path, "\tnot found";
            exit();
        }
        $nodeId = $ifExs['id'];
    }
    $targetMeta = extractMeta($row);

    var_dump($path);
    exit();
}
function extractMeta($rowMeta) {
    $res        = [
        'rate' => 0,
        'desc' => [],
    ];
    $descRowDef = [
        "Album"           => "",
        "Artist"          => "",
        "Album Artist"    => "",
        "Name"            => "",
        "Composer"        => "",
        "Grouping"        => "",
        "Genre"           => "",
        "Date (readable)" => "",
        "Duration"        => "",
        "Bitrate"         => "",
        "Track #"         => "",
        "Disc #"          => "",
        "Sample Rate"     => "",
        "Channels"        => "",
        "Bit Depth"       => "",
        "Copyright"       => "",
    ];
    if (isset($rowMeta['Rating'])) $res['rate'] = intval($rowMeta['Rating']);
    $rowMeta = array_intersect_key($rowMeta, $descRowDef);
    foreach ($rowMeta as $k => $v) {
        $res['desc'][] = $k . ': ' . $v;
    }
    return $res;
}

function titleFilter($title) {
    return mb_ereg_replace('[\\\/:*?"<>|#\r\n\t\s]+', ' ', $title);
}
