<?php
require_once 'lib_php/bootloader.php';
require_once 'lib_php/GenFunc.php';
//临时数据目录
$sourceDir = 'E:\\newdown\\';
//临时数据输出目录
$tmpDir = 'E:\\newdown_tmp\\';
//原始数据目录
//$targetDir   = 'F:\\hun\\';

$expTxt = file_get_contents(__DIR__ . '/matchDir.exp.txt');
$expArr = explode("\r\n", $expTxt);
foreach ($expArr as $arrStr) {
    if (empty($arrStr)) continue;
    $arr = explode("\t", $arrStr);
    if (empty($arr)) continue;
    list($toDir, $fName) = $arr;
    $fromPath  = $sourceDir . '\\' . $fName;
    $toDirPath = $tmpDir . $toDir;
    if (!file_exists($toDirPath))
        @mkdir($toDirPath, 0777, true);
    $toPath = $toDirPath . '\\' . $fName;
    @rename($fromPath, $toPath);
}














