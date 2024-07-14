<?php
//require_once 'lib_php/bootloader.php';
require_once 'lib_php/GenFunc.php';
//
$sourceDir = $argv[1];
$eofDef    = [
    'jpg'  => [['ff', 'd9'],],
    'jpeg' => [['ff', 'd9'],],
    'png'  => [['60', '82'],],
    'webp' => [['00'],],
];
//var_dump($sourceDir);
//var_dump(__FILE__);
//exit();
$sourceLs = GenFunc::scanDirPlus($sourceDir);
echo "file to scan:", sizeof($sourceLs), "\r\n";
$errEofLs = [];
foreach ($sourceLs as $sourceFile) {
//    var_dump($sourceFile);
    if (!is_file($sourceFile)) continue;
    $pathInfo = pathinfo($sourceFile);
    if (empty($pathInfo['extension'])) continue;
    $ext = $pathInfo['extension'];
    if (empty($eofDef[$ext])) continue;
    $eofLs = $eofDef[$ext];
    //
    $ch    = fopen($sourceFile, 'r');
    $size  = filesize($sourceFile);
    $match = true;
    foreach ($eofLs as $eof) {
        if ($size < sizeof($eof)) {
            $match = false;
            break;
        }
        $eof = array_reverse($eof);
        foreach ($eof as $indR => $char) {
//            var_dump([$indR, $char]);
            fseek($ch, -1 * ($indR + 1), SEEK_END);
            $r = fread($ch, 1);
            if ($char != bin2hex($r)) $match = false;
            break 2;
        }
    }
    if (!$match) {
        fseek($ch, -10, SEEK_END);
        $r = fread($ch, 10);
        $s = 'EOF mismatch:' . $sourceFile . "\t" . bin2hex($r) . "\r\n";
        file_put_contents(__FILE__ . '.txt', $s, FILE_APPEND);
        echo $s;
    }
    fclose($ch);
}
echo "complete\r\n";
//