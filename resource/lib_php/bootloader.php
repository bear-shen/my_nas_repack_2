<?php
//基础配置
mb_internal_encoding('UTF-8');
mb_regex_encoding('UTF-8');
//启动时加载的一些基础函数

//----------------------------------
// 错误处理部分
//----------------------------------

function errHandler($errno, $errstr, $errfile, $errline) {
    //
    $tracePrint = dumpTraceArr(debug_backtrace());
    $result     = [
        'code' => 100,
        'msg'  => $errstr,
        'data' => [
            'code'  => $errno,
            'msg'   => $errstr,
            'file'  => $errfile,
            'line'  => $errline,
            'trace' => $tracePrint,
        ],
    ];
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * @see https://www.php.net/manual/en/function.debug-backtrace.php
 * @see http://www.blogdaren.com/post-2535.html
 * php7 中使用 \Throwable
 * 之前是 \Exception
 * @param Throwable|Exception $ex
 */
function exceptionHandler($ex) {
    //trace
    $tracePrint = dumpTraceArr($ex->getTrace());
    //print
    $file = $ex->getFile();

    $result = [
        'code' => 101,
        'msg'  => $ex->getMessage(),
        'data' => [
            'code'  => $ex->getCode(),
            'msg'   => $ex->getMessage(),
            'file'  => $file,
            'line'  => $ex->getLine(),
            'trace' => $tracePrint,
        ],
    ];
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit();
}

function dumpTraceArr($trace) {
    $tracePrint = [];
    foreach ($trace as $row) {
        $i       = $row + [
                'file'     => '',
                'line'     => '',
                'function' => '',
                'class'    => '',
                'object'   => null,
                'type'     => '',
                'args'     => [],
            ];
        $argSize = sizeof($i['args']);
        for ($i1 = 0; $i1 < $argSize; $i1++) {
            $str  = '';
            $type = gettype($i['args'][$i1]);
            switch ($type) {
                case 'boolean':
                    $str = $i['args'][$i1] ? 'TRUE' : 'FALSE';
                    break;
                case 'integer':
                case 'double':
                    $str = (string)$i['args'][$i1];
                    break;
                    break;
                case 'string':
                    $str = '"' . $i['args'][$i1] . '"';
                    break;
                case 'NULL':
                    $str = 'NULL';
                    break;
                case 'array':
                case 'object':
                case 'resource':
                case 'resource (closed)':
                case 'unknown ':
                default:
                    $str = 'res.<' . $type . '>';
                    break;
            }
            $i['args'][$i1] = $str;
        }
        $i['args'] = implode(',', $i['args']);
        if (!empty($i['args'])) $i['args'] = '(' . $i['args'] . ')';
        $j             =
            $i['file'] . ':' .
            $i['line'] . '@' .
            $i['class'] . '' .
            $i['type'] . '' .
            $i['function'] . '' .
            $i['args'];
        $tracePrint [] = $j;
    }
    return $tracePrint;
}

set_error_handler('errHandler');
set_exception_handler('exceptionHandler');

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $header = [];
        foreach ($_SERVER as $key => $val) {
            $pos = stripos($key, 'HTTP_');
            if ($pos !== 0) continue;
            $header[strtolower(substr($key, 5))] = $val;
        }
        return $header;
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