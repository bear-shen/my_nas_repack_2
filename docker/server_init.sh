#!/bin/bash

cd /app/pkg/24.04/nginx
dpkg -i *.deb
cd /app/pkg/24.04/generic
dpkg -i *.deb
cd /app/pkg/24.04/php
dpkg -i *.deb
cd /app/pkg/24.04/software-properties-common
dpkg -i *.deb
cd /app/pkg/24.04/pgroonga
dpkg -i *.deb
cd /app/pkg/24.04/ffmpeg
dpkg -i *.deb
cd /app/pkg/24.04
dpkg -i sudo_*.deb

rm -rf /app/pkg/24.04/nginx
rm -rf /app/pkg/24.04/generic
rm -rf /app/pkg/24.04/php
rm -rf /app/pkg/24.04/software-properties-common
rm -rf /app/pkg/24.04/pgroonga
rm -rf /app/pkg/24.04/ffmpeg
rm /app/pkg/24.04/sudo_*.deb

cd /app/pkg/24.04
tar -xvf node-v20.18.1-linux-x64.tar.xz
ln -s /app/pkg/24.04/node-v20.18.1-linux-x64/bin/node /usr/bin/node
ln -s /app/pkg/24.04/node-v20.18.1-linux-x64/bin/npm /usr/bin/npm

sleep 1

cd /app/server
#/usr/bin/npm config set registry https://registry.npmmirror.com
/usr/bin/npm install
cd /app


sleep 1

service postgresql start

sudo -u postgres -H psql --command 'CREATE DATABASE toshokan'
sudo -u postgres -H psql -d toshokan --command 'CREATE EXTENSION pgroonga'
sudo -u postgres -H psql -d toshokan -a -f /app/init.postgres.sql
sudo -u postgres -H psql -d toshokan -a -f /app/init.base.sql

rm -f /etc/nginx/nginx.conf
rm -f /etc/nginx/mime.types
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default
rm -f /etc/postgresql/16/main/pg_hba.conf

cp /app/system/nginx.conf /etc/nginx/nginx.conf
cp /app/system/nginx_mime.types /etc/nginx/mime.types
cp /app/system/nginx_default.conf /etc/nginx/sites-enabled/default.conf
cp /app/system/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf
cp /app/system/postgresql.conf /etc/postgresql/16/main/postgresql.conf

#cd /app/front/dist
#wget https://github.com/mozilla/pdf.js/releases/download/v4.10.38/pdfjs-4.10.38-dist.zip
#unzip pdfjs-4.10.38-dist.zip -d pdfjs

#cp /app/system/wsl.conf /etc/wsl.conf


### won't work on default wsl (System has not been booted with systemd as init system (PID 1))
### use nohup
#cp /app/system/nodeServer.service /usr/lib/systemd/system
#cp /app/system/nodeJob.service /usr/lib/systemd/system
#systemctl enable nodeServer
#systemctl enable nodeJob

#service postgresql start
#service nginx start

touch /app/log/server_verbose.log
touch /app/log/server_err.log

chown -R www-data:www-data /app
chmod -R 0755 /app

chown -R www-data:www-data /app/*
chmod -R 0755 /app/*


