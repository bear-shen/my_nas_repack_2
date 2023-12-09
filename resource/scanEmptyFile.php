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

$dirRoot = $argv[1];
$fLs     = GenFunc::scanDirPlus($dirRoot);
echo 'get file size: ', sizeof($fLs), "\r\n";
foreach ($fLs as $file) {
    if (!is_file($file)) continue;
    $size = filesize($file);
    if (!empty($size)) continue;
    echo 'empty file: ', $file, "\r\n";
}




