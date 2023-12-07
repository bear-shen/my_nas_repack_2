<?php

class Storage {
    public static $file  = 'storage.json';
    public static $_data = [];

    public static function load() {
//        if (empty(self::$_data)) {
        //强制每次load都读取
        if (self::$file == 'storage.json')
            self::$file = __DIR__ . '/' . self::$file;
        $path    = self::$file;
        $content = null;
        if (file_exists($path))
            $content = file_get_contents($path);
        if (!empty($content))
            $content = json_decode($content, true);
        //
        self::$_data = !empty($content) ? $content : [];
//        }
//        var_dump(__DIR__ . '/' . self::$file);
//        var_dump(self::$_data);
        return self::$_data;
    }

    public static function get($key) {
        return isset(self::$_data[$key]) ? self::$_data[$key] : null;
    }

    public static function set($key, $value) {
        self::$_data[$key] = $value;
    }

    public static function save() {
        $path    = self::$file;
        file_put_contents($path, json_encode(self::$_data, JSON_UNESCAPED_UNICODE));
    }
}

Storage::load();