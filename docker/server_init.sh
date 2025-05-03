#!/bin/bash

cd /app/pkg/24.04/generic
dpkg -i *.deb
cd /app/pkg/24.04/nginx
dpkg -i *.deb
cd /app/pkg/24.04/php
dpkg -i *.deb
cd /app/pkg/24.04/ffmpeg
dpkg -i *.deb

rm -rf /app/pkg/24.04/generic
rm -rf /app/pkg/24.04/nginx
rm -rf /app/pkg/24.04/php
rm -rf /app/pkg/24.04/ffmpeg

cd /app/pkg/24.04
tar -xvf node-v22.15.0-linux-x64.tar.xz
ln -s /app/pkg/24.04/node-v22.15.0-linux-x64/bin/node /usr/bin/node
ln -s /app/pkg/24.04/node-v22.15.0-linux-x64/bin/npm /usr/bin/npm

sleep 1

cd /app/server
#/usr/bin/npm config set registry https://registry.npmmirror.com
/usr/bin/npm install
#cd /app

sleep 1

rm -f /etc/nginx/nginx.conf
rm -f /etc/nginx/mime.types
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

cp /app/system/nginx.conf /etc/nginx/nginx.conf
cp /app/system/nginx_mime.types /etc/nginx/mime.types
cp /app/system/nginx_default.conf /etc/nginx/sites-enabled/default.conf

touch /app/log/server_verbose.log
touch /app/log/server_err.log

chown -R www-data:www-data /app
chmod -R 0755 /app

chown -R www-data:www-data /app/*
chmod -R 0755 /app/*
