#!/bin/bash

service postgresql start

cd /app/server
#/usr/bin/npm run init

sleep 5
nohup /usr/bin/npm run serve 1>>/app/log/server_verbose.log 2>>/app/log/server_err.log &
sleep 5
nohup /usr/bin/npm run job 1>>/app/log/server_verbose.log 2>>/app/log/server_err.log &
sleep 5
service nginx start

/bin/bash

