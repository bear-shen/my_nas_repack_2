const fs = require('fs');

//onlyoffice随着配置导入，因此不能写在init
const ifUseOnlyoffice = process.env.onlyoffice_enabled;
const onlyofficeConf  = {
  onlyofficeHost  : '127.0.0.1',
  onlyofficePort  : '56000',
  onlyofficeScheme: 'http',
};
if (ifUseOnlyoffice === 'true') {
  const onlyofficeOrigin = (process.env.onlyoffice_origin ?? 'http://127.0.0.1').replace(/^[\s=/'"]+|[\s=/"']+$/g, '');
  if (onlyofficeOrigin) {
    try {
      const originMeta = new URL(onlyofficeOrigin);
      if (originMeta) {
        if (originMeta.hostname) onlyofficeConf.onlyofficeHost = originMeta.hostname;
        if (originMeta.port) onlyofficeConf.onlyofficePort = originMeta.port;
        if (originMeta.protocol) onlyofficeConf.onlyofficeScheme = originMeta.protocol.replace(':', '');
      }
    } catch (e) {
      console.error(e);
    }
  }
}

const originConf = {
  originHost  : '127.0.0.1',
  originPort  : '80',
  originScheme: 'http',
};
const nasOrigin  = (process.env.nas_origin ?? 'http://127.0.0.1').replace(/^[\s=/'"]+|[\s=/"']+$/g, '');
if (nasOrigin) {
  try {
    const originMeta = new URL(nasOrigin);
    if (originMeta) {
      if (originMeta.hostname) originConf.originHost = originMeta.hostname;
      if (originMeta.port) originConf.originPort = originMeta.port;
      if (originMeta.protocol) originConf.originScheme = originMeta.protocol.replace(':', '');
    }
  } catch (e) {
    console.error(e);
  }
}

// let ngConf = fs.readFileSync('/etc/nginx/sites-enabled/default.conf').toString();
//直接读取源文件以后覆盖当前nginx配置
let ngConf = fs.readFileSync(__dirname + '/system/nginx_default.conf').toString();
for (const key in onlyofficeConf) {
  ngConf = ngConf.replace(`{{${key}}}`, onlyofficeConf[key]);
}
for (const key in originConf) {
  ngConf = ngConf.replace(`{{${key}}}`, originConf[key]);
}
fs.writeFileSync('/etc/nginx/sites-enabled/default.conf', ngConf, {
  flag: 'w+',
});

// console.info(ngConf);
