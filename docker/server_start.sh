#!/bin/bash

#service postgresql restart

cd /myNas/server

/usr/bin/npm run init

sleep 1
nohup /usr/bin/npm run serve 1>>/myNas/log/server_verbose.log 2>>/myNas/log/server_err.log &
sleep 5
nohup /usr/bin/npm run job 1>>/myNas/log/server_verbose.log 2>>/myNas/log/server_err.log &
sleep 5
nohup /usr/bin/npm run watcher 1>>/myNas/log/server_verbose.log 2>>/myNas/log/server_err.log &
sleep 5

service nginx restart

/usr/bin/tail -f /myNas/log/server_*

