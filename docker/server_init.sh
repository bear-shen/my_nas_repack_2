#!/bin/bash

apt update
apt upgrade -y

apt install -y tzdata wget xz-utils xzip b3sum xxhash ffmpeg


cd /home
wget https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz
tar -xvf node-v20.18.0-linux-x64.tar.xz
ln -s /home/node-v20.18.0-linux-x64/bin/node /usr/bin/node
ln -s /home/node-v20.18.0-linux-x64/bin/npm /usr/bin/npm

sleep 1

cd /app/server
/usr/bin/npm config set registry https://registry.npmmirror.com
/usr/bin/npm install
cd /app

touch /app/log/server_verbose.log
touch /app/log/server_err.log

chown -R www-data:www-data /app
chmod -R 0755 /app

chown -R www-data:www-data /app/*
chmod -R 0755 /app/*


