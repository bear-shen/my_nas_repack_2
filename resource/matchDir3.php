<?php
// doujin name -> 作品合集 author author\doujin name
$fromRoot      = 'F:\\newdown\\erohun\\orph';
$toRoot        = 'F:\\newdown\\erohun_proc';
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
//'.match(/.*\((.+?)\)/i)
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
        $metas[] = trim($lastName);
    } else {
        $names[] = trim(strtolower($lastName));
    }
    if (sizeof($metas) > 0) $names[] = trim(implode(' ', $metas));
    foreach (scandir("$toRoot\\$dir") as $sub) {
        if ($dir === '.' || $dir === '..') continue;
        if (!is_dir("$toRoot\\$dir\\$sub")) continue;
        $subMetas = parseDirName($sub);
        foreach ($subMetas as $subMeta) {
            $names[] = trim(strtolower($subMeta));
        }
    }
    $names = array_keys(array_flip($names));
//    var_dump($meta, sizeof($meta), $names);
    echo "{$dir}:\t\t" . '|' . implode("| , |", $names) . '|' . "\r\n";
//    if ($dir === '作品合集 salt peanuts') exit();
    $targetDirInfo[$dir] = array_filter($names);
}
//exit();
foreach (scandir($fromRoot) as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    if (is_file($fromRoot . '\\' . $dir)) continue;
    //
    $metas = parseDirName($dir);
//    echo $dir, "\tmatches\t", implode(',', $metas), "\r\n";
    foreach ($metas as $meta) {
        foreach ($targetDirInfo as $targetName => $targetInfo) {
            foreach ($targetInfo as $key) {
                if (in_array($key, $ignore) !== false) continue;
                if (in_array($meta, $ignore) !== false) continue;
//                var_dump($targetDirInfo,$metas);
                if (strtolower($meta) === strtolower($key)) {
                    echo 'click 1 to confirm: ', $meta, '=', $key, "\t", $dir, "\tsend to\t", $targetName, "\r\n";
//                    $ifIn = fgets(STDIN);
//                    var_dump(intval(trim($ifIn)));
//                    if (intval(trim($ifIn)) === 1) {
                    moveTo($dir, $targetName);
//                    }
                }
            }
        }
    }
}


exit();

function parseDirName($dirName) {
    $metas  = [];
    $match1 = [];
    preg_match('/\[([^\]]+?)\(([^\]]+?)\)/i', $dirName, $match1);
    if (sizeof($match1)) {
        $metas[0] = strtolower(trim($match1[1]));
        $metas[1] = strtolower(trim($match1[2]));
    } else {
        $match2 = [];
        preg_match('/\[([^\]]+?)\]/i', $dirName, $match2);
        if (sizeof($match2)) {
            $metas[0] = strtolower(trim($match2[1]));
        } else {
//            echo $dirName . " matched nothing;\r\n";
        }
    }
    return $metas;
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