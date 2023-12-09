import util from "util";

const {
    Worker, isMainThread, parentPort, workerData, threadId,
} = require('node:worker_threads');

console.info('job dev init');
//multitask bench
const workerThreads = 5;
const exitSleep = 5 * 1000;
const workerMap: Map<number, Worker> = new Map();
const exec = util.promisify(require('child_process').exec);
if (isMainThread) {
    for (let i1 = 0; i1 < workerThreads; i1++) {
        buildThread(i1);
    }
} else {
    let fr = new Date();
    console.info(`sub:construct ${fr.toISOString()}`);
    const cmd = `ffmpeg -v quiet -hide_banner 
-i /home/vSample/i.mkv
-c:v av1_nvenc -profile:v main10 -preset slow -tune hq -qp 40 -bf 3 -pix_fmt p010le --multipass 2pass-full --lookahead 32 --weightp --bref-mode each
-c:a aac -q:a 1.3
/home/vSample/o.${threadId}.mkv
`.replace(/[\r\n]+/ig, ' ');
    exec(cmd).then(() => {
        let ed = new Date();
        console.info(`sub:complete ${
            ed.toISOString()
        } tt: ${
            (ed.valueOf() - fr.valueOf()) / 1000
        }`);
    })
}

function buildThread(index: number) {
    const worker = new Worker(__filename, {
        workerData: [workerThreads, index,],
    });
    console.info('build thread index:', index, ' , id:', worker.threadId);
    worker.on('online', () => {
        console.info('main:online:', index, ' , id:', worker.threadId);
    });
    worker.on('error', (value: any) => {
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