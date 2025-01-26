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
        'Accept-Encoding: deflate, br',
        'Accept-Language: zh-CN,zh;q=0.9',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.124 Safari/537.36 Edg/102.0.1245.41',
        'Upgrade-Insecure-Requests: 1',
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
        'Upgrade-Insecure-Requests: 1',
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
