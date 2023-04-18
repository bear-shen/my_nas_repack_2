<?php
require_once 'bootloader.php';
require_once 'GenFunc.php';
$sourceDir = $argv[0];
$targetDir = $argv[1];
$fls       = scandir($sourceDir);
//$meta      = new folderMeta($sourceDir . 'orph');
//exit();
foreach ($fls as $fl) {
    if ($fl == '.' || $fl == '..') continue;
    $meta = new folderMeta($sourceDir . $fl);
//    break;
}

//similar_text()
class groupMeta {
    public $path;
    public $dirPath;
    public $name;
    public $isParody;
    public $isAuthor;

    public function __construct($fullPath) {
        $this->path    = $fullPath;
        $this->dirPath = dirname($fullPath);
//        $this->name    = basename($fullPath);
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
        $this->parody = mb_trim($matchParody[1]);
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
                    $this->author = mb_trim($matchAuthor[1]);
                    $this->group  = mb_trim($revMatchGroup[1]);
                } else {
                    $this->author = mb_trim($matchAuthor[1]);
                }
            } else {
                $this->author = mb_trim($matchGroup);
            }
        }
        if (empty($this->author)) {
            echo implode("\t", [$this->name, $this->group, $this->author]), "\r\n";
        }
        if ($this->author) $this->author = strtolower($this->author);
        if ($this->group) $this->group = strtolower($this->group);
    }
}
