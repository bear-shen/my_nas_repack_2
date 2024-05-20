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

//var_dump(html_entity_decode('&amp;'));
//exit();

//var_dump(
//    gzinflate(substr(file_get_contents(__DIR__ . '/getEHTTag.content.gz.2.txt'), 10, -8))
//);
//exit();
global $dbConf;
$dbConf     = [
    'charset' => 'utf8mb4',
    //    'host'    => '127.0.0.1:3306',
    'host'    => '172.16.1.100:3306',
    'db'      => 'toshokan2',
    'name'    => 'root',
    'pass'    => 'root',
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
//
$idCacheMap = [];
foreach ($contentLs as $row) {
    if (empty($row['Filename'])) continue;
    if (stripos($row['Filename'], $localPath) !== 0) continue;
    if ($row['Media Type'] !== 'Audio') continue;
    $row['Filename'] = html_entity_decode($row['Filename']);
    $path            = mb_substr($row['Filename'], mb_strlen($localPath));
    $pathArr         = explode('\\', trim($path, '\\'));
    $nodeId          = $pid;
    foreach ($pathArr as $dirName) {
//        var_dump([
//            $nodeId, $dirName,
//        ]);
        $dirKey = $nodeId . "\r\n" . $dirName;
        if (isset($idCacheMap[$dirKey])) {
            $nodeId = $idCacheMap[$dirKey];
            continue;
        }
        $ifExs = ORM::table('node')->where('id_parent', $nodeId)->where('title', $dirName)->first();
        if (empty($ifExs)) {
            echo $path, "\tnot found", "\r\n";
//            exit();
            continue 2;
        }
        $nodeId              = $ifExs['id'];
        $idCacheMap[$dirKey] = $nodeId;
    }
//    continue;
    $targetMeta = extractMeta($row);
    $ifRate     = ORM::table('rate')
                     ->where('id_user', 1)
                     ->where('id_node', $nodeId)
                     ->first();
    if ($ifRate) {
        ORM::table('rate')->where('id', $ifRate['id'])->update(['rate' => $targetMeta['rate'] * 2]);
    } else {
        ORM::table('rate')->insert([
            'id_user' => 1,
            'id_node' => $nodeId,
            'rate'    => $targetMeta['rate'] * 2,
        ]);
    }
    ORM::table('node')->where('id', $nodeId)->update(['description' => $targetMeta['desc']]);
//    var_dump($path);
//    exit();
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
