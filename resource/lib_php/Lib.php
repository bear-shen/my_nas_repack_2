<?php
require_once 'Cookies.php';
/**
 * @param array $config
 * @return array{url:string,sendCookie:string,raw:string,header:array{string},location:string,setCookie:array{string},content:string}
 */
function curl($config = [], $retry = 5) {
    if (gettype($config) == 'string') {
        $config = ['url' => $config,];
    }
    $genHeader = [
        'Accept-Encoding: deflate',
        'Accept-Language: zh-CN,zh;q=0.9',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.124 Safari/537.36 Edg/102.0.1245.41',
        //        'Content-Type: application/json;charset=UTF-8',
        //        'Content-Type: application/x-www-form-urlencoded',
        'Upgrade-Insecure-Requests: 1',
        //        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Expect: '
    ];
//    $genHeader = [];
    $config += [
        'url'    => '',
        'header' => [],
        'post'   => '',
        'option' => [],
    ];
    $ch     = curl_init($config['url']);
    curl_setopt_array($ch, [
        CURLOPT_FOLLOWLOCATION    => false,
        CURLOPT_RETURNTRANSFER    => 1,
        CURLOPT_SSL_VERIFYPEER    => false,
        CURLOPT_SSL_VERIFYHOST    => 0,
        CURLOPT_DNS_CACHE_TIMEOUT => 300,
        CURLOPT_CONNECTTIMEOUT    => 300,
        CURLOPT_LOW_SPEED_TIME    => 300,
        CURLOPT_TIMEOUT           => 300,
        //        CURLOPT_PROXY             => '127.0.0.1',
        //                CURLOPT_PROXY             => '192.168.112.1',
        //        CURLOPT_PROXYPORT         => 8888,
        //        CURLOPT_HEADEROPT         => CURLHEADER_UNIFIED,
    ]);
    //
    if (!empty($config['option'])) curl_setopt_array($ch, $config['option']);
    /*if (!empty($config['header']))*/
    curl_setopt_array($ch, [CURLOPT_HTTPHEADER => array_merge($config['header'], $genHeader)]);
//    var_dump(array_merge($config['header'], $genHeader));
    if (!empty($config['post'])) curl_setopt_array($ch, [
        CURLOPT_POST       => 1,
        CURLOPT_POSTFIELDS => $config['post'],
    ]);
    $sendCookie = Cookies::getStr($config['url']);
    curl_setopt($ch, CURLOPT_COOKIE, $sendCookie);
    curl_setopt($ch, CURLINFO_HEADER_OUT, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    //没设置就false
    if (!isset($config['option'][CURLOPT_FOLLOWLOCATION]))
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    //
    $res = curl_exec($ch);
//    var_dump($res);
//    exit();
//    file_put_contents('t.html', $res);
    $resArr    = explode("\r\n\r\n", $res);
    $resChkArr = [
        '',
        '',
    ];
    //有的https页面前面会额外带一个HTTP/1.1 200 Connection established
    //单独做个判断
    if (sizeof($resArr) > 2) {
        $headerSpArr = [];
        foreach ($resArr as $txt) {
            if (stripos($txt, 'HTTP/') !== 0) break;
            $headerSpArr[] = $txt;
        }
        $resChkArr[0] = implode("\r\n", $headerSpArr);
        $resChkArr[1] = implode("\r\n\r\n", array_slice($resArr, sizeof($headerSpArr)));
        $resArr       = $resChkArr;
    }

//    var_dump(sizeof($resArr));
    $headerArr = explode("\r\n", $resArr[0]);
    if (curl_errno($ch)) {
        var_dump(curl_errno($ch));
        var_dump(curl_error($ch));
//        var_dump(curl_getinfo($ch));
        if ($retry > 0) {
            sleep(1);
            return curl($config, $retry - 1);
        }
    }
//    file_put_contents('td.html', print_r($resArr, true));
//    exit();
    $headerResp = [];
    $cookieResp = [];
    $location   = '';
    foreach ($headerArr as $item) {
        $kvSp = strpos($item, ': ');
        if (empty($kvSp)) continue;
        $k = substr($item, 0, $kvSp);
        $v = substr($item, $kvSp + 2);
        //
        if (isset($headerResp[$k])) {
            if (!is_array($headerResp[$k])) $headerResp[$k] = [$headerResp[$k]];
            $headerResp[$k][] = $v;
        } else {
            $headerResp[$k] = $v;
        }
        switch (strtolower($k)) {
            case 'set-cookie':
                $cookieResp[] = $v;
                Cookies::setFromStr($v, $config['url']);
                break;
            case 'location':
                $location = $v;
                break;
        }
    }
    if (empty($resArr[1]) && empty($location)) {
//        var_dump($config);
//        var_dump(curl_errno($ch));
//        var_dump(curl_error($ch));
//        var_dump(curl_getinfo($ch));
    }
//        var_dump(curl_errno($ch));
    //var_dump(curl_error($ch));
    //
    //print_r(curl_getinfo($ch));
//    var_dump($resArr);
    $result = [
        'url'        => $config['url'],
        'sendCookie' => $sendCookie,
        'raw'        => $res,
        'header'     => $headerResp,
        'location'   => $location,
        'setCookie'  => $cookieResp,
        'content'    => empty($resArr[1]) ? '' : $resArr[1],
    ];
    curl_close($ch);
    return $result;
}

function curlFile($config = [], $retryCount = 10) {
    if (gettype($config) == 'string') {
        $config = ['url' => $config,];
    }
    $genHeader = [
        'Accept-Encoding: deflate',
        'Accept-Language: zh-CN,zh;q=0.9',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.124 Safari/537.36 Edg/102.0.1245.41',
        //        'Content-Type: application/json;charset=UTF-8',
        //        'Content-Type: application/x-www-form-urlencoded',
        'Upgrade-Insecure-Requests: 1',
        //        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Expect: '
    ];
//    $genHeader = [];
    $config += [
        'url'    => '',
        'header' => [],
        'post'   => '',
        'option' => [],
        'path'   => '',
    ];
    $dir    = dirname($config['path']);
    if (!file_exists($dir)) {
        mkdir($dir, 0666, true);
    }
    $fw = fopen($config['path'], 'w+');
    $ch = curl_init($config['url']);
    curl_setopt_array($ch, [
        CURLOPT_FOLLOWLOCATION    => true,
        CURLOPT_RETURNTRANSFER    => 1,
        CURLOPT_SSL_VERIFYPEER    => false,
        CURLOPT_SSL_VERIFYHOST    => 0,
        CURLOPT_DNS_CACHE_TIMEOUT => 300,
        CURLOPT_CONNECTTIMEOUT    => 300,
        CURLOPT_LOW_SPEED_TIME    => 300,
        CURLOPT_TIMEOUT           => 300,
        //        CURLOPT_PROXY             => '127.0.0.1',
        //        CURLOPT_PROXY             => '192.168.112.1',
        //        CURLOPT_PROXYPORT         => 8888,
        //        CURLOPT_HEADEROPT         => CURLHEADER_UNIFIED,
    ]);
    //
    if (!empty($config['option'])) curl_setopt_array($ch, $config['option']);
    /*if (!empty($config['header']))*/
    curl_setopt_array($ch, [CURLOPT_HTTPHEADER => array_merge($config['header'], $genHeader)]);
//    var_dump(array_merge($config['header'], $genHeader));
    if (!empty($config['post'])) curl_setopt_array($ch, [
        CURLOPT_POST       => 1,
        CURLOPT_POSTFIELDS => $config['post'],
    ]);
    $sendCookie = Cookies::getStr($config['url']);
    curl_setopt($ch, CURLOPT_COOKIE, $sendCookie);
    curl_setopt($ch, CURLINFO_HEADER_OUT, 1);
//    curl_setopt($ch, CURLOPT_HEADER, 1);
    if (!isset($config['option'][CURLOPT_FOLLOWLOCATION]))
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt_array($ch, [
        CURLOPT_FILE => $fw,
    ]);
    //
    $res   = curl_exec($ch);
    $ifErr = curl_errno($ch);
    $err   = null;
    if ($ifErr) $err = curl_error($ch);
    curl_close($ch);
    fclose($fw);
    if ($ifErr && $retryCount > 0) {
        return curlFile($config, $retryCount - 1);
    }
    if ($ifErr) {
//        var_dump($ifErr);
//        var_dump($err);
        return false;
    }
    return true;
}

function parseBody($responseContent) {
    $spPoint = strpos($responseContent, "\r\n\r\n");
    if (!$spPoint) return false;
    $body = substr($responseContent, $spPoint + 4);
    return $body;
}

function parseHeader($responseContent) {
    $spPoint = strpos($responseContent, "\r\n\r\n");
    if (!$spPoint) return false;
    $header    = substr($responseContent, 0, $spPoint);
    $headerArr = explode("\r\n", $header);
    $headerReq = [];
    foreach ($headerArr as $item) {
        $kvSp = strpos($item, ': ');
        if (empty($kvSp)) continue;
        $k = substr($item, 0, $kvSp);
        $v = substr($item, $kvSp + 2);
        switch ($k) {
            default:
                $headerReq[$k] = $v;
                break;
            case 'Set-Cookie':
                if (empty($headerReq[$k])) $headerReq[$k] = [];
                $headerReq[$k][] = $v;
                break;
        }
    }
    return $headerReq;
}

function parseDict($item, $dicts) {
    foreach ($dicts as $dict) {
        if (!isset($item[$dict['name']])) continue;
        foreach ($dict['values'] as $value) {
            if ($value['value'] != $item[$dict['name']]) continue;
            $item[$dict['name']] = $item[$dict['name']] . ' : ' . $value['text'];
        }
    }
    return $item;
}

function restQuery($ch, $cookie, $path, $params = false, $extraQuery = false) {
    $site = 'http://10.134.89.56:9001';
    //
    if (empty($params)) {
        $params = new StdClass();
    } elseif (!is_string($params)) {
        $params = json_encode($params, JSON_UNESCAPED_UNICODE);
    }
    //
    $query = ($extraQuery ?: []) + [
            'rnd'    => mt_rand(0, 100000000) / 100000000,
            '_'      => time() . '000',
            'params' => $params,
        ];
    //var_dump($site . $path . '?' . http_build_query($query));
    $content = GenFunc::curl(
        [
            CURLOPT_URL            => $site . $path . '?' . http_build_query($query),
            CURLOPT_HEADER         => 0,
            CURLINFO_HEADER_OUT    => 0,
            CURLOPT_COOKIE         => $cookie,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_POST           => false,
            //CURLOPT_POSTFIELDS     => '',
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json, text/javascript, */*; q=0.01',
                'Accept-Encoding: gzip, deflate',
                'Accept-Language: zh-CN,zh;q=0.9',
                'Content-Type: application/json',
                'User-Agent: Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36',
                'X-Requested-With: XMLHttpRequest',
                'Referer: http://10.134.89.56:9001/sgpms',
            ],
            'use_ch'               => $ch,
        ]
    );
    return $content;
}


function parseTable($tbodyString) {
    $tableRes   = [];
    $matchTrRes = [];
    preg_match_all('/<tr[\s\S]*?<\/tr>/im', $tbodyString, $matchTrRes);
    for ($i1 = 0; $i1 < sizeof($matchTrRes[0]); $i1++) {
        $matchTdRes = [];
        preg_match_all(
            '/<(?:td|th)[\s\S]*?>([\s\S]*?)<\/(?:td|th)>/im',
            $matchTrRes[0][$i1],
            $matchTdRes);
        $matchTd = [];
        for ($i3 = 0; $i3 < sizeof($matchTdRes[0]); $i3++) {
            $matchTd[] = $matchTdRes[1][$i3];
        }
        $tableRes[] = $matchTd;
    }
    return $tableRes;
}

/**
 * 针对营销现在各种报错的重试方案
 * =\s*(\w+)\(([^\)]+?)\);
 * = mayNotEmpty('$1',3,$2);
 */
function mayNotEmpty($functionName, $retryCount = 3, ...$arguments) {
    $delay = 1000000;
    if (defined('DELAY')) $delay = constant('DELAY');
    if (defined('__DELAY__')) $delay = constant('__DELAY__');
    $fail = false;
    $res  = [];
    try {
        $res = call_user_func_array($functionName, $arguments);
    } catch (\Throwable $ex) {
        $fail = true;
    }
    if (empty($res)) $fail = true;
    if (!$fail) return $res;
    if ($retryCount <= 0) return $res;
    usleep($delay);
    return mayNotEmpty($functionName, $retryCount - 1, ...$arguments);
}