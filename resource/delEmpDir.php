<?php
$root = 'F:\\newdown\\erohun';
foreach (scandir($root) as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    $dirPath = $root . '\\' . $dir;
    if (!file_exists($dirPath)) continue;
    if (!is_dir($dirPath)) continue;
    $count = 0;
    foreach (scandir($dirPath) as $sub) {
        if ($sub === '.' || $sub === '..') continue;
//        var_dump($sub);
        $count += 1;
//        break;
    }
//    print_r([$dirPath, $count]);
    if (!$count) {
        $cmd = "rmdir \"$dirPath\"";
        var_dump($cmd);
//        var_dump(['==============================================================',$cmd, $count]);
//        continue;
        var_dump(exec($cmd));
    }
}
