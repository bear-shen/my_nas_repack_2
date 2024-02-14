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
