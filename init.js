const fs = require('fs');

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
      if (originMeta.host) onlyofficeConf.onlyofficeHost = originMeta.host;
      if (originMeta.port) onlyofficeConf.onlyofficePort = originMeta.port;
      if (originMeta.protocol) onlyofficeConf.onlyofficeScheme = originMeta.protocol;
    }
  }
}

// const ngConf = fs.readFileSync('/etc/nginx/sites-enabled/default.conf').toString();
let ngConf = fs.readFileSync(__dirname + '/system/nginx_default.conf').toString();
for (const key in onlyofficeConf) {
  ngConf = ngConf.replace(`{{${key}}}`, onlyofficeConf[key]);
}
fs.writeFileSync(__dirname + '/system/nginx_default.conf', ngConf, {
  flag: 'w+',
});

// console.info(ngConf);
