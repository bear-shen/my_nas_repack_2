#!/bin/bash

service postgresql restart

cd /app/server
#/usr/bin/npm run init

sleep 1
nohup /usr/bin/npm run serve 1>>/app/log/server_verbose.log 2>>/app/log/server_err.log &
sleep 5
nohup /usr/bin/npm run job 1>>/app/log/server_verbose.log 2>>/app/log/server_err.log &
sleep 5
nohup /usr/bin/npm run watcher 1>>/app/log/server_verbose.log 2>>/app/log/server_err.log &
sleep 5

/usr/bin/node /app/beforeStart.js

service nginx restart

/usr/bin/tail -f /app/log/server_*

