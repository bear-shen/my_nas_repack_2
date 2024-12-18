<?php
//require_once 'lib_php/bootloader.php';
require_once 'lib_php/GenFunc.php';
//临时数据目录
$sourceDir = 'E:\\newdown\\';
//临时数据输出目录
//$tmpDir = 'E:\\newdown_tmp\\';
//原始数据目录
$targetDir = 'G:\\hun\\';
global $filterWords;
$filterWords = [
    '汉化', '翻译', '漢化', '中国', '翻訳', 'chinese', 'english', '翻訳', '汉化',
    "r18", "r-18", "高解像度", "psd", "补档",
    "えっちビデオ", "どえっち動画", "序章", "胡桃", "どえっち特別版", "無料版！",
    "※r-18注意※", "※微エロ注意※", "同人誌", "r-18", "まとめ1", "※エロ注意※", "まとめ2", "リクエスト", "全体公開", "食べ放題プラン限定", "ちょいエロ", "乳首あり注意", "まとめ", "新春リク", "skeb", "みんなで自己紹介",
    "差分", "雑誌",
    "表情", "セリフ", "再販", 'オリジナル', 'オリジ','よろず',
    'アンソロジ', '同人誌', 'コミッ', 'comic', 'よろず', 'Various', '同人CG集',
    '成年コミック', 'オリジナル', 'ゲームCG', 'Game CG', 'よろず','fantia',
];
$expArr      = [];
$expTxt      = '';
//------------------------------------------
//原始目录
$tMetaLs = [];
//var_dump('here');
$tls     = scandir($targetDir);
//var_dump('here');
foreach ($tls as $fl) {
    if ($fl == '.' || $fl == '..') continue;
    $meta = new groupMeta($targetDir . $fl);
//    var_dump($meta);
    $stls  = scandir($targetDir . $fl);
    $keyLs = [];
    foreach ($stls as $stl) {
        if ($stl == '.' || $stl == '..') continue;
        if (!is_dir($targetDir . $fl . '\\' . $stl)) continue;
        $sMeta = new folderMeta($targetDir . $fl . '\\' . $stl);
        if ($meta->isParody) {
            if ($sMeta->parody) $keyLs[] = $sMeta->parody;
        }
        if ($meta->isAuthor) {
            if ($sMeta->group) $keyLs[] = $sMeta->group;
            if ($sMeta->author) $keyLs[] = $sMeta->author;
        }
    }
    $keyLs       = array_filter($keyLs, function ($val) use ($filterWords) {
        foreach ($filterWords as $key) {
            if (stripos($val, $key) !== false) return false;
        }
        return true;
    });
    $meta->keyLs = array_keys(array_flip($keyLs));
//    break;
    $tMetaLs[] = $meta;
}
//var_dump('here');
file_put_contents(__DIR__ . '/meta.dir.json', json_encode($tMetaLs, JSON_UNESCAPED_UNICODE));
//------------------------------------------
//获取临时数据目录
$fMetaLs = [];
$fls     = scandir($sourceDir);
foreach ($fls as $fl) {
    if ($fl == '.' || $fl == '..') continue;
    $meta = new folderMeta($sourceDir . $fl);
//    if (empty($meta->name))
    $fMetaLs[] = $meta;
//    break;
}
file_put_contents(__DIR__ . '/meta.src.json', json_encode($fMetaLs, JSON_UNESCAPED_UNICODE));
//匹配已经有的目录
foreach ($fMetaLs as $i => $f) {
    $toDir = '';
    //作品
    if (empty($toDir)) {
        foreach ($tMetaLs as $t) {
            if (!$t->isAuthor) continue;
            foreach ($t->keyLs as $key) {
//                if (empty($key)) var_dump($t);
//                if (empty($f->author)) var_dump($f);
//                if (empty($f->group)) var_dump($f);
                if ($f->author && strtolower($f->author) == strtolower($key)) $toDir = '作品合集 ' . $t->name;
                if ($f->group && strtolower($f->group) == strtolower($key)) $toDir = '作品合集 ' . $t->name;
            }
        }
    }
    //主题
    if (empty($toDir)) {
        foreach ($tMetaLs as $t) {
            if (!$t->isParody) continue;
            foreach ($t->keyLs as $key) {
                if ($f->parody && strtolower($f->parody) == strtolower($key)) $toDir = '合集 ' . $t->name;
            }
        }
    }
    if (empty($toDir)) {
        continue;
//        if (!empty($f->author)) $toDir = 'n 作品合集 ' . $f->author;
//        else if (!empty($f->group)) $toDir = 'n 作品合集 ' . $f->group;
//        else $toDir = 'unknown';
    }
//    continue;
    $expArr[] = [$toDir, $f->name];
//    $toDirPath = $tmpDir . $toDir;
//    if (!file_exists($toDirPath))
//        @mkdir($toDirPath, 0777, true);
//    $mvTo = $toDirPath . '\\' . $f->name;
//    @rename($f->path, $mvTo);
    unset($fMetaLs[$i]);
}
//exit();
//对没有匹配的项目创建分组
$fMetaLs        = array_values($fMetaLs);
$authCountMap   = [];
$parodyCountMap = [];
foreach ($fMetaLs as $i => $f) {
    /** @var $f folderMeta */
    $k = $f->author;
    if (!empty($k)) {
        if (empty($authCountMap[$k])) $authCountMap[$k] = 0;
        $authCountMap[$k] += 1;
    }
    $k = $f->group;
    if (!empty($k)) {
        if (empty($authCountMap[$k])) $authCountMap[$k] = 0;
        $authCountMap[$k] += 1;
    }
    $k = $f->parody;
    if (!empty($k)) {
        if (empty($parodyCountMap[$k])) $parodyCountMap[$k] = 0;
        $parodyCountMap[$k] += 1;
    }
}
//创建用户
foreach ($authCountMap as $author => $count) {
    if ($count < 2) continue;
//    $toDirPath = $tmpDir . 'n作品合集 ' . $author;
    $toDir   = 'n作品合集 ' . $author;
    $fMetaLs = array_values($fMetaLs);
    foreach ($fMetaLs as $i => $f) {
        /** @var $f folderMeta */
        if ($f->author == $author) {
            $expArr[] = [$toDir, $f->name];
            /*$mvTo = $toDirPath . '\\' . $f->name;
            if (!file_exists($toDirPath))
                @mkdir($toDirPath, 0777, true);
            @rename($f->path, $mvTo);
//            usleep(100000);//0.1s*/
            unset($fMetaLs[$i]);
        }
        if ($f->group == $author) {
            $expArr[] = [$toDir, $f->name];
            /*$mvTo = $toDirPath . '\\' . $f->name;
            if (!file_exists($toDirPath))
                @mkdir($toDirPath, 0777, true);
            @rename($f->path, $mvTo);
            usleep(100000);//0.1s*/
            unset($fMetaLs[$i]);
        }
    }
}
$extTxt = '';
foreach ($expArr as $arr) {
    $extTxt .= implode("\t", $arr) . "\r\n";
}
file_put_contents(__DIR__ . '/matchDir.exp.txt', $extTxt);
//创建主题
//foreach ($parodyCountMap as $parody => $count) {
//    if ($count < 2) continue;
//    $toDirPath = $tmpDir . 'n合集 ' . $parody;
//    $fMetaLs   = array_values($fMetaLs);
//    foreach ($fMetaLs as $i => $f) {
//        /** @var $f folderMeta */
//        if ($f->parody == $parody) {
//            $mvTo = $toDirPath . '\\' . $f->name;
//            if (!file_exists($toDirPath))
//                @mkdir($toDirPath, 0777, true);
//            @rename($f->path, $mvTo);
//            unset($fMetaLs[$i]);
//            usleep(100000);//0.1s
//        }
//    }
//}

//similar_text()
class groupMeta {
    public $path;
    public $dirPath;
    public $name;
    public $isManga;
    public $isParody;
    public $isAuthor;
    public $keyLs = [];

    public function __construct($fullPath) {
        $this->path    = $fullPath;
        $this->dirPath = dirname($fullPath);
        $baseName      = basename($fullPath);
//        var_dump($baseName);
        if (stripos($baseName, '作品合集') !== false) {
            $this->name     = mb_substr($baseName, 5);
            $this->isAuthor = true;
        } else if (stripos($baseName, '杂志合集') !== false) {
            $this->name    = mb_substr($baseName, 5);
            $this->isManga = true;
        } else if (stripos($baseName, '合集') !== false) {
            $this->name     = mb_substr($baseName, 3);
            $this->isParody = true;
        } else {
            echo implode("\t", [$fullPath]), "\r\n";
        }
    }
}

class folderMeta {
    public $path;
    public $dirPath;
    public $name;
    public $group;
    public $author;
    public $title;
    public $language;
    public $parody;

    public function __construct($fullPath) {
        $this->path    = $fullPath;
        $this->name    = basename($fullPath);
        $this->dirPath = dirname($fullPath);
//        var_dump($fullPath);
        $this->parseAuthor();
        $this->parseTitle();
        $this->parseParody();
//        var_dump($this);
    }

    public function parseParody() {
        $r           = '\)）';
        $l           = '\(（';
        $matchParody = [];
        preg_match("/.*[$l]([^$r$l]+)[$r]*/iu", $this->name, $matchParody);
        if (empty($matchParody)) {
            echo implode("\t", [$this->name]), "\r\n";
            return;
        }
        $probeParody = mb_trim($matchParody[1]);
        if (mb_strlen($probeParody) < 2) return;
        if ($probeParody == $this->author) return;
        $this->parody = $probeParody;
        if (empty($this->parody)) {
            echo implode("\t", [$this->name]), "\r\n";
        }
        if ($this->parody) $this->parody = strtolower($this->parody);
    }

    public function parseTitle() {
        $r          = '\]】\)）';
        $l          = '\[【\(（';
        $matchTitle = [];
        preg_match_all("/[$r]([^$r$l]+)[$l]*/iu", $this->name, $matchTitle);
        $this->title = mb_trim(implode('', $matchTitle[1]));
        if (empty($this->title)) {
            echo implode("\t", [$this->name]), "\r\n";
        }
        if ($this->title) $this->title = strtolower($this->title);
//        echo implode("\t", [mb_trim($matchTitle[1])]), "\r\n";
//        echo implode("\t", [$this->name, $matchTitle[1]]), "\r\n";
    }

    public function parseAuthor() {
        global $filterWords;
        $matchGroup = [];
        preg_match('/[\[【](.+?)[】\]]/iu', $this->name, $matchGroup);
        if (!empty($matchGroup)) {
            $matchGroup  = $matchGroup[1];
            $matchAuthor = [];
            preg_match('/[\(（](.+?)[\)）]/iu', $matchGroup, $matchAuthor);
            if (!empty($matchAuthor)) {
                $revMatchGroup = [];
                preg_match('/(.+?)[\(（]/iu', $matchGroup, $revMatchGroup);
//                $matchName   = trim($matchName[1][0]);
                if (!empty($revMatchGroup) && !empty(mb_trim($revMatchGroup[1]))) {
                    $this->author = $this->useFilter(mb_trim($matchAuthor[1]));
                    $this->group  = $this->useFilter(mb_trim($revMatchGroup[1]));
                } else {
                    $this->author = $this->useFilter(mb_trim($matchAuthor[1]));
                }
            } else {
                $this->author = $this->useFilter(mb_trim($matchGroup));
            }
        }
        if (empty($this->author)) {
            echo implode("\t", [$this->name, $this->group, $this->author]), "\r\n";
        }
        if ($this->author) $this->author = strtolower($this->author);
        if ($this->group) $this->group = strtolower($this->group);
    }

    function useFilter($in) {
        global $filterWords;
        if (in_array($in, $filterWords)) return null;
        return $in;
    }
}

function mb_trim($string, $charlist = null) {
    if (is_null($charlist)) {
        return trim($string);
    } else {
        $charlist = preg_quote($charlist, '/');
        return preg_replace("/(^[$charlist]+)|([$charlist]+$)/u", '', $string);
    }
}
function mb_rtrim($string, $charlist = null) {
    if (is_null($charlist)) {
        return rtrim($string);
    } else {
        $charlist = preg_quote($charlist, '/');
        return preg_replace("/([$charlist]+$)/u", '', $string);
    }
}
function mb_ltrim($string, $charlist = null) {
    if (is_null($charlist)) {
        return ltrim($string);
    } else {
        $charlist = preg_quote($charlist, '/');
        return preg_replace("/(^[$charlist]+)/u", '', $string);
    }
}