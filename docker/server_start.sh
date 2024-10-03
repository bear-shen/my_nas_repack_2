#!/bin/bash
cd /app/server
/usr/local/bin/npm run init
sleep 5
nohup /usr/local/bin/npm run serve 1>>/app/log/server_verbose.log 2>>/app/log/server_err.log &
sleep 5
nohup /usr/local/bin/npm run job 1>>/app/log/server_verbose.log 2>>/app/log/server_err.log &

/bin/bash

