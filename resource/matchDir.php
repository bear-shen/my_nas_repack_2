<?php
// doujin name -> 作品合集 author author
$fromRoot      = 'F:\\newdown\\erohun';
$toRoot        = 'F:\\newdown\\erohun_proc';
$targetDirInfo = [];
foreach (scandir($toRoot) as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    $targetDirInfo[$dir] = [];
    $meta                = explode(' ', $dir);
    if ($meta[0] !== '作品合集') continue;
    array_shift($meta);
    if (!sizeof($meta)) continue;
    foreach ($meta as $sub) {
        if (mb_strlen($sub) < 3) continue;
        $targetDirInfo[$dir][] = $sub;
    }
}
//print_r($targetDirInfo);
foreach (scandir($fromRoot) as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    /*if (isset($targetDirInfo[$dir])) {
        moveTo($dir, $dir);
    }*/
    $meta = explode(' ', $dir);
    if ($meta[0] !== '作品合集') continue;
    array_shift($meta);
    if (!sizeof($meta)) continue;
    foreach ($targetDirInfo as $targetDirName => $targetMetaLs) {
        foreach ($targetMetaLs as $targetMeta) {
            foreach ($meta as $curMeta) {
                if ($curMeta == $targetMeta) {
                    moveTo($dir, $targetDirName);
                }
            }
        }
    }

}

function moveTo($from, $to) {
    global $fromRoot;
    global $toRoot;
    $fromPath = $fromRoot . '\\' . $from;
    $toPath   = $toRoot . '\\' . $to;
    if (!file_exists($toPath)) mkdir($toPath, 0777, true);
    foreach (scandir($fromPath) as $dir) {
        if ($dir === '.' || $dir === '..') continue;
        if (file_exists($toPath . '\\' . $dir)) continue;
        $cmd = "move \"$fromPath\\$dir\" \"$toPath\\$dir\"";
        var_dump($cmd);
//        continue;
        exec($cmd);
    }
//    exec("del \"$fromPath\"");
}