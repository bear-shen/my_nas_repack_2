<?php
/*
 * @notice new self 不大确定是否应该写成默认，现在这种做法会导致在默认情况下每次都要新建实例
 * 新建实例毫无疑问可以解决一些问题，但是性能上感觉并不划算
 * */

trait FuncCallable {
    //通过设置 self:$saveSelf = true; ，则 _self 将会被储存为当前的实例，否则每次都会新建
    //这项参数无法直接写在trait中，需要在被调用的类中手工添加
    //private static $saveSelf = false;
    protected static $_self = false;

    public static function __callStatic($name, $arguments) {
        $name = '_' . $name;
        if (!method_exists(static::class, $name)) {
            throw new \Exception("static function {$name} not found");
        }
        $self = false;
        if (isset(static::$saveSelf) && static::$saveSelf) {
            if (!static::$_self) static::$_self = new static;
            $self = static::$_self;
//            var_dump('$load');
        } else {
            $self = new static;
        }
        return $self->$name(...$arguments);
    }

    /*public static function __callStatic($name, $arguments) {
        $name = '_' . $name;
        $self = false;
        if (isset(self::$saveSelf) && self::$saveSelf) {
            if (!self::$_self) self::$_self = new self;
            $self = self::$_self;
//            var_dump('$load');
        } else {
            $self = new self;
        }
        return $self->$name(...$arguments);
    }*/

    public function __call($name, $arguments) {
        $name = '_' . $name;
//        var_dump($this);
//        var_dump($name);
        if (!method_exists($this, $name)) {
            throw new \Exception("function {$name} not found");
        }
        return $this->$name(...$arguments);
    }
}