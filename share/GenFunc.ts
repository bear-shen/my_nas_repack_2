class CurlData {
    public path: string;
    public get?: string | FormData | Array<string> | any;
    public post?: string | FormData | Array<string> | any;
    public method?: string;
    public header?: Array<string> | any;
    public async?: boolean;
    public withCredentials?: boolean;
    public success?: (data: string, code?: number) => any;
    public error?: (data: string, code?: number) => any;
    public onUploadProgress?: (e: Event) => any;
    public onProgress?: (e: Event) => any;

    constructor(input: {
        path: string,
        get?: string | FormData | Array<string> | any,
        post?: string | FormData | Array<string> | any,
        method?: string,
        header?: Array<string> | boolean | any,
        async?: boolean,
        withCredentials?: boolean,
        success?: (data: string, code?: number) => any,
        error?: (data: string, code?: number) => any,
        onUploadProgress?: (e: Event) => any,
        onProgress?: (e: Event) => any,
    }) {
        this.path = input.path;
        this.get = input.get ? input.get : false;
        this.post = input.post ? input.post : false;
        this.method = input.method ? input.method : 'get';
        this.header = input.header ? input.header : false;
        this.async = input.async ? input.async : false;
        this.withCredentials = input.withCredentials ? input.withCredentials : false;
        this.success = input.success;
        this.error = input.error;
        this.onUploadProgress = input.onUploadProgress;
        this.onProgress = input.onProgress;
    }
}

const GenFunc = {
    send: function (input: CurlData): XMLHttpRequest | string | boolean {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.withCredentials = !!input.withCredentials;
        // get
        {
            // arr to default
            if (input.get instanceof Array) {
                const newData: { [key: string]: string } = {};
                for (let i1 = 0; i1 < input.get.length; i1++) {
                    newData[input.get[i1].k] = input.get[i1].v;
                }
                input.get = newData;
            }
            // clear
            let pathArr = input.path.split(/#/ig);
            pathArr = pathArr[0].split(/\?/ig);
            if (pathArr.length === 1 || pathArr[pathArr.length - 1].length === 0) {
                input.path += '?';
            }
            // merge
            let i = 0;
            for (const k in input.get) {
                if (!Object.prototype.hasOwnProperty.call(input.get, k)) continue;
                if (i++ !== 0) input.path += '&';
                input.path += `${k}=${input.get[k]}`;
            }
        }
        // post
        {
            if (input.post instanceof Array) {
                // console.info('array');
                const newData = new FormData();
                for (let i1 = 0; i1 < input.post.length; i1++) {
                    newData.append(input.post[i1].k, input.post[i1].v);
                }
                input.post = newData;
            } else if (typeof input.post === 'string') {
            } else if (!(input.post instanceof FormData)) {
                const newData = new FormData();
                let processed = false;
                for (const k in input.post) {
                    if (!Object.prototype.hasOwnProperty.call(input.post, k)) continue;
                    // console.info(k);
                    // console.info(input.post[k]);
                    processed = true;
                    newData.append(k, input.post[k]);
                }
                // console.info(newData);
                if (processed) input.post = newData;
                //
            }
        }
        // method
        {
            if (!input.method) input.method = 'get';
            if (input.post) input.method = 'post';
            input.method = input.method.toLocaleUpperCase();
        }
        // header
        {
            if (input.header instanceof Array) {
                const newData: { [key: string]: string } = {};
                for (let i1 = 0; i1 < input.header.length; i1++) {
                    // setRequestHeader 冒号要拆
                    const headerEqual = input.header[i1].indexOf(':');
                    if (headerEqual === -1) continue;
                    newData[
                        input.header[i1].slice(0, headerEqual).trim()
                    ] = input.header[i1].slice(headerEqual + 1).trim();
                }
                input.header = newData;
            }
        }
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4 /* && xmlhttp.status < 400 */) {
                // console.warn(xmlHttp.responseText);
                if (input.async) {
                    if (xmlHttp.status < 400) {
                        return input.success ? input.success(xmlHttp.responseText, xmlHttp.status) : true;
                    } else {
                        return input.error ? input.error(xmlHttp.responseText, xmlHttp.status) : false;
                    }
                }
            }
        };
        if (input.onUploadProgress) xmlHttp.upload.onprogress = input.onUploadProgress;
        if (input.onProgress) xmlHttp.onprogress = input.onProgress;
        xmlHttp.open(input.method, input.path, !!input.async);
        for (const k in input.header) {
            if (!Object.prototype.hasOwnProperty.call(input.header, k)) continue;
            xmlHttp.setRequestHeader(k, input.header[k]);
        }
        // console.info(input.post);
        if (input.method === 'GET') xmlHttp.send();
        else xmlHttp.send(input.post);
        if (!input.async) return xmlHttp.responseText;
        else return xmlHttp;
    },
    // array////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 1.1 合并任意数量的对象数组
     * 后入的会取代先入的
     * 如果是对象会自动判定
     *
     * @deprecated
     * @see Object.assign(a,b)
     * */
    mergeArray: function (...arg: Array<{ [key: string]: string }>): { [key: string]: string } {
        const newArray: { [key: string]: string } = {};
        for (let ia = 0; ia < arg.length; ia++) {
            for (const key in arg[ia]) {
                if (!Object.prototype.hasOwnProperty.call(arg[ia], key)) continue;
                newArray[key] = arg[ia][key];
            }
        }
        // console.error(newArray);
        return newArray;
    },
    /**
     * 同php方法
     * split本来就可以直接取代了……
     * */
    explode: function (string: string, splitter: string, limit: number): Array<string> {
        return string.split(splitter, limit);
    },
    /**
     * 同php方法
     * */
    implode: function (array: Array<string>, splitter: string): string {
        if (!splitter) {
            splitter = ',';
        }
        let targetString = '';
        for (let ia = 0; ia < array.length; ia++) {
            targetString += array[ia];
            if (ia !== array.length - 1) {
                targetString += splitter;
            }
        }
        return targetString;
    },
    /**
     * 删除数组中的一组数据
     * 感觉可能会有bug，但是总之目前看起来可以用
     * */
    removeVal: function (sourceArr: Array<any>, val: Array<any> | string | any): Array<any> {
        if (typeof val === 'string') {
            val = [val];
        } else if (typeof val !== 'object' || !val.length) {
            return [];
        }
        const arr = sourceArr.slice();
        for (let i1 = 0; i1 < val.length; i1++) {
            for (let i2 = 0; i2 < arr.length; i2++) {
                if (arr[i2] === val[i1]) {
                    arr.splice(i2, 1);
                    --i2;
                    // break;
                }
            }
        }
        return arr;
    },
    /**
     * 输入表，排序对象，是否是数值型排序(T/F)，方向( T 小→大 / F 大→小 )
     * 适用
     * [
     *    {
     *       "a":"a",
     *       "b":"c",
     *    },
     *    {
     *       "a":"a",
     *       "b":"c",
     *    },
     * ]
     * @return array
     * */
    sort2DTable: function (inputTable: Array<any>, sortCol: string, isNum?: boolean, direction?: boolean): Array<any> {
        return inputTable.sort(
            function (a, b) {
                // 数字
                if (isNum) {
                    if (direction) {
                        return a[sortCol] - b[sortCol];
                    } else {
                        return b[sortCol] - a[sortCol];
                    }
                } else {
                    // 字符串比较
                    if (direction) {
                        return a[sortCol].localeCompare(b[sortCol]);
                    } else {
                        return b[sortCol].localeCompare(a[sortCol]);
                    }
                }
            }
        );
    },
    // cookie////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 设定cookie中的指定值
     * */
    setCookie: function (cName: string, value: string, expiredays: number, path?: string): void {
        console.warn('setCookie');
        const exdate = new Date();
        exdate.setDate(exdate.getDate() + expiredays);
        document.cookie = cName + '=' + escape(value) + ';' +
            ((expiredays == null) ? '' : 'expires=' + exdate.toUTCString()) + ';' +
            ((path == null) ? '' : ';path=' + path) + ';'
    },
    /**
     * 获取cookie中的字段
     * */
    getCookie: function (cName: string): string {
        console.info(document.cookie);
        if (document.cookie.length > 0) {
            let cStart = document.cookie.indexOf(cName + '=');
            if (cStart !== -1) {
                cStart = cStart + cName.length + 1;
                let cEnd = document.cookie.indexOf(';', cStart);
                if (cEnd === -1) cEnd = document.cookie.length;
                return unescape(document.cookie.substring(cStart, cEnd))
            }
        }
        return ''
    },
    /**
     * 获取连接中的get请求
     * 空字段之类的没有处理
     * 返回k:v
     * */
    getRequests: function (): { [key: string]: string } {
        const url = location.search; // 获取url中"?"符后的字串
        const theRequest: { [key: string]: string } = {};
        if (url.indexOf('?') !== -1) {
            const str = url.substr(1);
            const strs = str.split('&');
            for (let i = 0; i < strs.length; i++) {
                const pair = strs[i].split('=');
                if (pair.length === 2) {
                    theRequest[pair[0]] = unescape(pair[1]);
                }
            }
        }
        return theRequest;
    },
    mergeRequests: function (object: { [key: string]: string }): string {
        const result: Array<string> = [];
        for (const k in object) {
            // console.warn("========================================");
            // console.warn(k);
            // console.warn(array[k]);
            // console.warn(array[k].__proto__);
            // console.warn(Object.prototype);
            if (!Object.prototype.hasOwnProperty.call(object, k)) continue;
            result.push(k + '=' + object[k]);
        }
        return GenFunc.implode(result, '&');
    },
    // string////////////////////////////////////////////////////////////////////////////////////////
    /**
     * trim方法，使用正则，默认为\s
     * */
    trim: function (string: string, trimChar?: string): string {
        if (!trimChar) trimChar = '\\s';
        const reg = '^[' + trimChar + ']*(.*?)[' + trimChar + ']*$';
        // console.warn(reg);
        return string.replace(new RegExp(reg, 'igm'), '$1');
    },
    prefix: function (num: number, length: number, txt: string): string {
        return (Array(length).join(txt) + num).slice(-length);
    },
    /**
     * @deprecated
     * GBK的gbkurlencode
     * 仅限于GBK页面
     * */
    encodeGBKurl: function (s: string): string | null {
        const img = document.createElement('img');

        // escapeDBC 对多字节字符编码的函数
        function escapeDBC(s: string) {
            if (!s) return '';
            /*if (window.ActiveXObject) {
      // 如果是 ie, 使用 vbscript
              // eslint-disable-next-line no-implied-eval
              execScript('SetLocale "zh-cn"', 'vbscript');
              return s.replace(
                /[\d\D]/g, function ($0) {
                  window.vbsval = '';
                  execScript('window.vbsval=Hex(Asc("' + $0 + '"))', 'vbscript');
                  return '%' + window.vbsval.slice(0, 2) + '%' + window.vbsval.slice(-2);
                }
              );
            }*/
            // 其它浏览器利用浏览器对请求地址自动编码的特性
            img.src = 'nothing.action?separator=' + s;
            return img.src.split('?separator=').pop();
        }

        // 把 多字节字符 与 单字节字符 分开，分别使用 escapeDBC 和 encodeURIComponent 进行编码
        return s.replace(
            /([^\x00-\xff]+)|([\x00-\xff]+)/g, function ($0, $1, $2) {
                return escapeDBC($1) + encodeURIComponent($2 || '');
            }
        );
    },
    getUrlParam: function (name: string): string | null {
        const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'); // 构造一个含有目标参数的正则表达式对象
        const r = window.location.search.substr(1).match(reg); // 匹配目标参数
        if (r != null) return unescape(r[2]);
        return null; // 返回参数值
    },
    /**
     * @see https://www.cnblogs.com/hermitks/p/10979221.html
     * */
    randStr: function (len: number, table?: string): string {
        len = len || 32;
        const chars = table || 'abcdefghijklmnopqrstuvwxyz0123456789';
        /** **默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        const maxPos = chars.length;
        let pwd = '';
        for (let i = 0; i < len; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    },
    kmgt: function (num: number | string, decimal?: number): string {
        if (typeof num !== 'number') num = parseFloat(num);
        if (!decimal) decimal = 0;
        //
        const minus: boolean = num < 0;
        if (minus) {
            decimal = -1 * decimal;
        }
        let refNum: string;
        if (num < 1000) {
            refNum = num.toFixed(decimal);
        } else if (num < 1000 * 1000) {
            refNum = (num / (1000)).toFixed(decimal) + ' K';
        } else if (num < 1000 * 1000 * 1000) {
            refNum = (num / (1000 * 1000)).toFixed(decimal) + ' M';
        } else {
            refNum = (num / (1000 * 1000 * 1000)).toFixed(decimal) + ' G';
        }
        return (minus ? '-' : '') + refNum;
    },
    // other////////////////////////////////////////////////////////////////////////////////////////
    isEmpty: function (object: { [key: string]: any }): boolean {
        for (const k in object) {
            if (!Object.prototype.hasOwnProperty.call(object, k)) continue;
            return true;
        }
        return false;
    },
    copyObject: function <k>(object: k): k {
        return JSON.parse(JSON.stringify(object));
        const target: { [key: string]: any } = {};
        for (const k in object) {
            if (!Object.prototype.hasOwnProperty.call(object, k)) continue;
            target[k] = object[k];
        }
        return target as k;
    },
    toggleClass: function (element: Element, className: string): void {
        const classes = element.className;
        // 没参数
        if (!classes || !classes.trim().length) {
            element.className = className;
            return;
        }
        const classArr = classes.split(' ');
        let exist = false;  // 用变量标识传入的类是否已经存在
        for (let i = 0; i < classArr.length; i++) {
            if (classArr[i] === className) {
                classArr.splice(i, 1); // 类存在，删除之
                exist = true;
            }
        }
        if (!exist) classArr.push(className);
        element.className = Array.prototype.join.call(classArr, ' ');  // 把数组转成字符串并赋值
    },
};
export default GenFunc;
