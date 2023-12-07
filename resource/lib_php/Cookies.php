<?php

class Cookie {
    public $name   = '';
    public $value  = '';
    public $domain = '';
    public $path   = '';

    public function __construct($name, $value = '', $domain = '', $path = '/') {
        $this->name   = $name;
        $this->value  = $value;
        $this->domain = $domain;
        $this->path   = $path;
    }
}

//全静态化，省的创建实例了
class Cookies {
    /** @var $list Cookie[] */
    public static $list = [];

    /**
     * @param $name string
     * @param $value string
     * @param $url string
     * @param $domain string
     * @param $path string
     * @return void
     */
    public static function set($name, $value, $url = '', $domain = '', $path = '/') {
        $urlInfo = parse_url($url) + [
                'scheme'   => '',
                'host'     => '',
                'port'     => '',
                'user'     => '',
                'pass'     => '',
                'path'     => '',
                'query'    => '',
                'fragment' => '',
            ];
        //user:password@host:port
        if (empty($domain)) {
            $domain = $urlInfo['host'] /*. (!empty($urlInfo['port']) ? (':' . $urlInfo['port']) : '')*/
            ;
        }
        $cookie       = new Cookie($name, $value, $domain, $path);
        self::$list[] = $cookie;
    }

    /**
     * @param $cookie Cookie
     */
    public static function setCookie($cookie) {
        self::$list[] = $cookie;
    }

    /**
     * @param $string string
     * @param $url string
     * @return void
     */
    public static function setFromStr($string = '', $url = '') {
        $urlInfo = parse_url($url) + [
                'scheme'   => '',
                'host'     => '',
                'port'     => '',
                'user'     => '',
                'pass'     => '',
                'path'     => '',
                'query'    => '',
                'fragment' => '',
            ];
        //user:password@host:port
        if (empty($domain)) {
            $domain = $urlInfo['host'] /*. (!empty($urlInfo['port']) ? (':' . $urlInfo['port']) : '')*/
            ;
        }
        $confLs        = explode('; ', $string);
        $data          = [
            'name'     => '',
            'value'    => '',
            'domain'   => '',
            'path'     => '',
            'expire'   => 0,
            'maxAge'   => '',
            'secure'   => false,
            'httpOnly' => false,
            'sameSite' => '',
        ];
        $kv            = explode('=', $confLs[0]);
        $data['name']  = $kv[0];
        $data['value'] = $kv[1];
        unset($confLs[0]);
        foreach ($confLs as $conf) {
            $exp = explode('=', $conf);
            switch (strtolower($exp[0])) {
                case 'domain':
                    $data['domain'] = isset($exp[1]) ? $exp[1] : '';
                    break;
                case 'path':
                    $data['path'] = isset($exp[1]) ? $exp[1] : '/';
                    break;
                case 'expires':
                    $data['expire'] = isset($exp[1]) ? $exp[1] : '';
                    break;
                case 'max-age':
                    $data['maxAge'] = isset($exp[1]) ? $exp[1] : '';
                    break;
                case 'secure':
                    $data['secure'] = true;
                    break;
                case 'httponly':
                    $data['httpOnly'] = true;
                    break;
                case 'samesite':
                    $data['sameSite'] = isset($exp[1]) ? $exp[1] : '';
                    break;
            }
        }
        if (empty($data['domain'])) $data['domain'] = $domain;
//        echo "set from str:" . json_encode($data, JSON_UNESCAPED_UNICODE) . "\r\n";
        $cookie       = new Cookie($data['name'], $data['value'], $data['domain'], $data['path']);
        self::$list[] = $cookie;
    }

    /**
     * @param $url string
     * @return Cookie[]
     */
    public static function get($url = '') {
        $urlInfo = parse_url($url) + [
                'scheme'   => '',
                'host'     => '',
                'port'     => '',
                'user'     => '',
                'pass'     => '',
                'path'     => '',
                'query'    => '',
                'fragment' => '',
            ];
        //去掉感觉不规范，但是不去掉的话会有点问题。。。
        if ($urlInfo['port'] == '80' || $urlInfo['port'] == '443') {
            $urlInfo['port'] = '';
        }
        $domain = $urlInfo['host']/* . (!empty($urlInfo['port']) ? (':' . $urlInfo['port']) : '')*/
        ;
        $path   = empty($urlInfo['path']) ? '/' : $urlInfo['path'];

        $targetCookies = [];

        //domain
        $cookieList = array_filter(self::$list, function ($cookie) use ($domain) {
            /** @var $cookie Cookie */
            return self::matchDomain($cookie, $domain);
        });
        $cookieList = array_filter($cookieList, function ($cookie) use ($path) {
            /** @var $cookie Cookie */
            return self::matchPath($cookie, $path);
        });
        $cookieList = array_values($cookieList);
//        echo "get :---------------------------------------\r\n";
//        echo "get :" . print_r($urlInfo, true) . "\r\n";
//        echo "get :" . print_r(self::$list, true) . "\r\n";
//        echo "get :" . print_r($cookieList, true) . "\r\n";
        return $cookieList;
    }

    /**
     * @param string $url
     * @return string
     */
    public static function getStr($url = '') {
        $cookieList = self::get($url);
        $prtCookie  = [];
        foreach ($cookieList as $cookie) {
            /** @var $cookie Cookie */
            if (empty($cookie->value)) continue;
            $prtCookie[$cookie->name] = $cookie->value;
        }
        $cookieStr = [];
        foreach ($prtCookie as $name => $value) {
            $cookieStr[] = $name . '=' . $value;
        }
        return implode('; ', $cookieStr);
    }

    /**
     * @param $cookie Cookie
     * @param $domain string
     * @return boolean
     */
    public static function matchDomain($cookie, $domain) {
        if (empty($cookie->domain)) return true;
        if ($cookie->domain == $domain) return true;
        $domPos = strrpos($domain, $cookie->domain);
//        var_dump(json_encode([$domPos, $domPos + strlen($cookie->domain), strlen($domain), $cookie->domain, $domain]));
        if ($domPos !== false)
            if ($domPos + strlen($cookie->domain) === strlen($domain)) return true;
        return false;
    }


    /**
     * @param $cookie Cookie
     * @param $path string
     * @return boolean
     */
    public static function matchPath($cookie, $path) {
        if (empty($cookie->path)) return true;
        if ($cookie->path === '/') return true;
        if (strpos($path, $cookie->path) === 0) return true;
        return false;
    }

    /**
     * @param $list Cookie[]
     * @return void
     */
    public static function dump($list = []) {
        foreach (empty($list) ? self::$list : $list as $cookie) {
            echo $cookie->domain . "\t" .
                 $cookie->path . "\t" .
                 $cookie->name . "\t" .
                 $cookie->value . "\r\n";
        }
    }

}