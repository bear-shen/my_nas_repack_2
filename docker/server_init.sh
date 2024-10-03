#!/bin/sh

#useradd node
cd /app/server
npm config set registry https://registry.npmmirror.com
npm install
cd /app

touch log/server_verbose.log
touch log/server_err.log

chmod -R 0755 /app
chown -R node /app

chmod -R 0755 *
chown -R node *


