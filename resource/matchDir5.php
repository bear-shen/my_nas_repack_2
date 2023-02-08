<?php
// doujin name -> 合集 author (mk)
$fromRoot = 'F:\\newdown\\erohun';
foreach (scandir($fromRoot) as $parent) {
    if ($parent === '.' || $parent === '..') continue;
    if (is_file($fromRoot . '\\' . $parent)) continue;
    $parentPath = $fromRoot . '\\' . $parent;
    $subCount   = 0;
    foreach (scandir($parentPath) as $sub) {
        if ($sub === '.' || $sub === '..') continue;
        $subCount += 1;
    }
    if ($subCount < 2) {
        foreach (scandir($parentPath) as $sub) {
            if ($sub === '.' || $sub === '..') continue;
            $subPath = $parentPath . '\\' . $sub;
            $cmd     = "move \"$subPath\" \"$fromRoot\"";
            var_dump($cmd);
            exec($cmd);
        }
        $cmd = "rmdir \"$parentPath\"";
        var_dump($cmd);
        exec($cmd);
    }
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