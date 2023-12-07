import util from "util";

console.info('job dev init');
//multitask bench
const {
    Worker, isMainThread, parentPort, workerData, threadId,
} = require('node:worker_threads');
const exec = util.promisify(require('child_process').exec);
if (isMainThread) {
    const workerThreads = 4;
    const exitSleep = 5 * 1000;
    const workerMap: Map<number, Worker> = new Map();

    for (let i1 = 0; i1 < workerThreads; i1++) {
        buildThread(i1);
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
} else {
    console.info('sub:construct');
    const cmd = `ffmpeg.exe -v quiet -hide_banner 
-i /home/vSample/i.mkv
-c:v av1_nvenc -profile:v main10 -preset slow -tune hq -qp 40 -bf 3 -pix_fmt p010le
-c:a aac -q:a 1.3
/home/vSample/o.${threadId}.mkv
`.replace(/[\r\n]+/ig,' ');

}
/*
//generic
// import fs from "fs";
import {loadConfig} from "../ServerConfig";
import ExtJob from "./processor/ExtJob";


loadConfig().then(async () => {
    console.info('start');
    // await SysJob.scanOrphanFile({});
    // Util.send({
    //     path: 'http://www.baidu.com',
    //     success: (content) => {
    //         console.info(content);
    //     }
    // });
    // await ExtJob.importEHT({});
    // await ExtJob.cascadeTag({dirId: 0});
    await ExtJob.rmRaw({dirId: 7912});
    // ORM.dumpSql = true;
    // const cacheModel = new CacheModel();
    // await cacheModel.count();
    // console.info('delete');
    // await cacheModel.delete();
    // const nodeLs = await (new NodeModel).select();
    // nodeLs.forEach(async (node) => {
    //         FileJob.deleteForever({id: node.id});
    //     }
    // );
    console.info('complete');
});*/
