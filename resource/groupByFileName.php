<?php
$root  = $argv[1];
$dirLs = scandir($root);
//
// ignore: Various よろず
//
$nmCount = [];
foreach ($dirLs as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    if (is_file($root . '\\' . $dir)) continue;
    //
    $groupName  = '';
    $authorName = '';
    //
    $groupRes = [];
    preg_match('/[^\[]*?\[(.+?)]/i', $dir, $groupRes);
    if (!sizeof($groupRes)) continue;
    $groupName = trim($groupRes[1]);
    $authorRes = [];
    preg_match('/\((.+?)\)/i', $groupRes[1], $authorRes);
    $authorName = sizeof($authorRes) ? trim($authorRes[1]) : '';
//    var_dump("$groupName\t$authorName\t$dir");
    $target = strlen($authorName) ? $authorName : $groupName;
    if (empty($nmCount[$target])) $nmCount[$target] = 0;
    $nmCount[$target] += 1;
}
foreach ($dirLs as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    if (is_file($root . '\\' . $dir)) continue;
    //
    $groupName  = '';
    $authorName = '';
    //
    $groupRes = [];
    preg_match('/[^\[]*?\[(.+?)]/i', $dir, $groupRes);
    if (!sizeof($groupRes)) continue;
    $groupName = trim($groupRes[1]);
    $authorRes = [];
    preg_match('/\((.+?)\)/i', $groupRes[1], $authorRes);
    $authorName = sizeof($authorRes) ? trim($authorRes[1]) : '';
//    var_dump("$groupName\t$authorName\t$dir");
    $target = strlen($authorName) ? $authorName : $groupName;
    if ($nmCount[$target] > 1) {
        moveTo($dir, '作品合集 ' . $target);
    }
}

function moveTo($from, $to) {
    global $root;
    $fromPath = $root . '\\' . $from;
    $toDir    = $root . '\\' . $to;
    $toPath   = $root . '\\' . $to . '\\' . $from;
//    var_dump("mv $fromPath to $toPath");
//    var_dump("mv to $toPath");
    if (!file_exists($toDir)) mkdir($toDir, 0777, true);
    while (file_exists($toPath)) $toPath .= '_';
    $cmd = "move \"$fromPath\" \"$toPath\"";
    var_dump($cmd);
    //    return;
    exec($cmd);
}