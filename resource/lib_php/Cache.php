<?php

class Cache {
    public static $file   = 'cache.json';
    public static $loaded = false;
    public static $data   = [
    ];

    public static function get($key) {
        if (!self::$loaded) self::load();
        if (empty(self::$data[$key])) return null;
        if (!self::checkValid($key)) return null;
        return self::$data[$key]['value'];
    }

    public static function set($key, $value, $expire = 1800) {
        if (!self::$loaded) self::load();
        self::$data[$key] = [
            'value'     => $value,
            'expire_at' => time() + $expire,
        ];
        self::save();
    }

    public static function checkValid($key) {
        if (self::$data[$key]['expire_at'] > time()) {
            return true;
        } else {
            unset(self::$data[$key]);
            return false;
        }
    }

    public static function load() {
        if (self::$file == 'cache.json')
            self::$file = __DIR__ . '/' . self::$file;
        $data         = file_exists(self::$file) ?
            (file_get_contents(self::$file) ?: '[]') : '[]';
        $data         = json_decode($data, true);
        self::$data   = $data;
        self::$loaded = true;
    }

    public static function save() {
        if (self::$file == 'cache.json')
            self::$file = __DIR__ . '/' . self::$file;
        file_put_contents(self::$file, json_encode(self::$data, JSON_UNESCAPED_UNICODE));
    }
}