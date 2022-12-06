<?php
// doujin name -> 作品合集 author author
$fromRoot      = 'F:\\newdown\\erohun\\orph';
$toRoot        = 'F:\\newdown\\erohun_proc';
$targetDirInfo = [];
foreach (scandir($toRoot) as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    $targetDirInfo[$dir] = [];
    $metas               = explode(' ', $dir);
    if ($metas[0] !== '作品合集') continue;
    array_shift($metas);
    $lastName      = array_pop($metas);
    $ifEngLastName = preg_match('/^[a-z\.\-\+\*]+?$/i', $lastName);
    $names         = [];
//    var_dump($ifEngLastName);
    if ($ifEngLastName) {
        $metas[] = $lastName;
    } else {
        $names[] = $lastName;
    }
    if (sizeof($metas) > 0) $names[] = implode(' ', $metas);
//    var_dump($meta, sizeof($meta), $names);
    echo "{$dir}:\t\t" . '|' . $names[0] . '|' . "\t" . (isset($names[1]) ? '|' . $names[1] . '|' : '') . "\r\n";
//    if ($dir === '作品合集 salt peanuts') exit();
    $targetDirInfo[$dir] = array_filter($names);
}
foreach (scandir($fromRoot) as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    if (is_file($fromRoot . '\\' . $dir)) continue;
    //
    $metas  = [];
    $match1 = [];
    preg_match('/\[(.+?)\((.+?)\)\]/i', $dir, $match1);
    if (sizeof($match1)) {
        $metas[0] = trim($match1[1]);
        $metas[1] = trim($match1[2]);
    } else {
        $match2 = [];
        preg_match('/\[(.+?)\]/i', $dir, $match2);
        if (sizeof($match2)) {
            $metas[0] = trim($match2[1]);
        } else {
            echo $dir . " matched nothing;\r\n";
            continue;
        }
    }
    echo $dir, "\tmatches\t", implode(',', $metas), "\r\n";
    foreach ($targetDirInfo as $targetName => $targetInfo) {
        foreach ($targetInfo as $key) {
            foreach ($metas as $meta) {
//                var_dump($targetDirInfo,$metas);
                if (strtolower($meta) === strtolower($key)) {
                    echo '###', $dir, "\tsend to\t", $targetName, "\r\n";
                    moveTo($dir, $targetName);
                }
            }
        }
    }
}


exit();
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