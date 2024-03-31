// import fs from "fs";
import {Worker} from "worker_threads";

console.info('job watcher init');

//队列太多nvenc跑不起来，原因不明
const workerThreads = 4;
const exitSleep = 5 * 1000;
const workerMap: Map<number, Worker> = new Map();

for (let i1 = 0; i1 < workerThreads; i1++) {
    buildThread(i1);
}

function buildThread(index: number) {
    const worker = new Worker(__dirname + '/worker.js', {
        workerData: [workerThreads, index,],
    });
    console.info('build thread index:', index, ' , id:', worker.threadId);
    worker.on('online', () => {
        console.info('main:online:', index, ' , id:', worker.threadId);
    });
    worker.on('error', (value) => {
        console.info('main:error:', index, ' , id:', worker.threadId, value);
    });
    worker.on('exit', () => {
        console.info('main:exit', index);
        //exit之后已经取不到threadId了，不清楚有没有例外情况
        // if (worker.threadId)
        workerMap.delete(index);
        setTimeout(buildThread.bind(this, index), exitSleep);
    });
    workerMap.set(index, worker);
}
