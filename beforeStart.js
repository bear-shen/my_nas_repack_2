const fs = require('fs');

//onlyoffice随着配置导入，因此不能写在init
const ifUseOnlyoffice = process.env.onlyoffice_enabled;
const onlyofficeConf  = {
  onlyofficeHost  : '127.0.0.1',
  onlyofficePort  : '56000',
  onlyofficeScheme: 'http',
};
if (ifUseOnlyoffice === 'true') {
  const onlyofficeOrigin = process.env.onlyoffice_origin;
  if (onlyofficeOrigin) {
    const originMeta = new URL(onlyofficeOrigin);
    if (originMeta) {
      if (originMeta.hostname) onlyofficeConf.onlyofficeHost = originMeta.hostname;
      if (originMeta.port) onlyofficeConf.onlyofficePort = originMeta.port;
      if (originMeta.protocol) onlyofficeConf.onlyofficeScheme = originMeta.protocol.replace(':', '');
    }
  }
}

// let ngConf = fs.readFileSync('/etc/nginx/sites-enabled/default.conf').toString();
//直接读取源文件以后覆盖当前nginx配置
let ngConf = fs.readFileSync(__dirname + '/system/nginx_default.conf').toString();
for (const key in onlyofficeConf) {
  ngConf = ngConf.replace(`{{${key}}}`, onlyofficeConf[key]);
}
fs.writeFileSync('/etc/nginx/sites-enabled/default.conf', ngConf, {
  flag: 'w+',
});

// console.info(ngConf);
