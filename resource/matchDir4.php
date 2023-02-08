<?php
// doujin name -> 合集 author (mk)
$fromRoot      = 'F:\\newdown\\erohun\\orph';
$toRoot        = 'F:\\newdown\\erohun';
$targetDirInfo = [];
$ignore        = [
    'chinese',
    'fanbox',
    'pixiv',
    'various',
    'よろず',
    'dmm.com',
    'fantia',
    '中国翻訳',
];
//exit();
foreach (scandir($fromRoot) as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    if (is_file($fromRoot . '\\' . $dir)) continue;
    //
    $metas = parseDirName($dir);
    echo $dir, "\tmatches\t", implode(',', $metas), "\r\n";
    if (empty($metas[0])) continue;
    $targetPath = $toRoot . '\\合集 ' . $metas[0];
    if (!file_exists($targetPath)) mkdir($targetPath, 0777, true);
    moveTo($dir, '合集 ' . $metas[0]);
}


exit();

function parseDirName($dirName) {
    $match1 = [];
    preg_match('/.*\((.+?)\)/i', $dirName, $match1);
    if (sizeof($match1)) {
        return [$match1[1]];
    }
    return [];
}

function moveTo($from, $to) {
    global $fromRoot;
    global $toRoot;
    $fromPath = $fromRoot . '\\' . $from;
    $toPath   = $toRoot . '\\' . $to;
    $cmd      = "move \"$fromPath\" \"$toPath\"";
    var_dump($cmd);
//        continue;
    exec($cmd);
//    exec("del \"$fromPath\"");
}