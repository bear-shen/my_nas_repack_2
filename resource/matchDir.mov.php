<?php
require_once 'lib_php/bootloader.php';
require_once 'lib_php/GenFunc.php';
//临时数据输出目录
$tmpDir = 'E:\\newdown_tmp\\';

$expArr = [];
$tls    = scandir($tmpDir);
foreach ($tls as $fl) {
    if ($fl == '.' || $fl == '..') continue;
    $groupPath = $tmpDir . $fl;
    $subLs     = scandir($groupPath);
    foreach ($subLs as $sub) {
        if ($sub == '.' || $sub == '..') continue;
        $expArr[] = [$fl, $sub];
    }
}
$extTxt = '';
foreach ($expArr as $arr) {
    $extTxt .= implode("\t", $arr) . "\r\n";
}
file_put_contents(__FILE__ . '.exp.csv', $extTxt);















