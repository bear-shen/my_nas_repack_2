<?php
$sourceRoot = 'R:\db_eros\hun';
$targetRoot = $argv[1];
$dirLs      = scandir($sourceRoot);
foreach ($dirLs as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    $targetPath = $targetRoot . '\\' . $dir;
    if (file_exists($targetPath)) continue;
    mkdir($targetPath, 0777, true);
}