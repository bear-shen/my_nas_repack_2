#!/bin/bash

cd /myNas/pkg/24.04/generic
dpkg -i *.deb
cd /myNas/pkg/24.04/nginx
dpkg -i *.deb
cd /myNas/pkg/24.04/php
dpkg -i *.deb
cd /myNas/pkg/24.04/ffmpeg
dpkg -i *.deb

rm -rf /myNas/pkg/24.04/generic
rm -rf /myNas/pkg/24.04/nginx
rm -rf /myNas/pkg/24.04/php
rm -rf /myNas/pkg/24.04/ffmpeg

cd /myNas/pkg/24.04
tar -xvf node-v22.15.0-linux-x64.tar.xz
ln -s /myNas/pkg/24.04/node-v22.15.0-linux-x64/bin/node /usr/bin/node
ln -s /myNas/pkg/24.04/node-v22.15.0-linux-x64/bin/npm /usr/bin/npm

sleep 1

cd /myNas/server
#/usr/bin/npm config set registry https://registry.npmmirror.com
/usr/bin/npm install
#cd /myNas

sleep 1

rm -f /etc/nginx/nginx.conf
rm -f /etc/nginx/mime.types
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

cp /myNas/system/nginx.conf /etc/nginx/nginx.conf
cp /myNas/system/nginx_mime.types /etc/nginx/mime.types
cp /myNas/system/nginx_default.conf /etc/nginx/sites-enabled/default.conf

touch /myNas/log/server_verbose.log
touch /myNas/log/server_err.log

chown -R www-data:www-data /myNas
chmod -R 0755 /myNas

chown -R www-data:www-data /myNas/*
chmod -R 0755 /myNas/*
