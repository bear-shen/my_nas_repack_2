// with ecosystem.config.js:
//  pm2 start
// manual:
//  pm2 start npm --name server -- run serve
//  pm2 delete tosho_server
module.exports = {
  apps: [
    {
      name  : 'tosho_server',
      script: 'npm run serve'
    }, {
      name  : 'tosho_job',
      script: 'npm run job'
    }, {
      name  : 'tosho_ftp',
      script: 'npm run ftp'
    }, {
      name  : 'tosho_webdav',
      script: 'npm run webdav'
    },
  ]
};
