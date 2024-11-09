import QueueModel from "../model/QueueModel";
import {init} from "../startServer";
import jobs from "./jobs";
import CacheModel from "../model/CacheModel";

const {workerData, threadId} = require('node:worker_threads');

console.info('=================');
// console.info('worker:', workerData);
console.info('worker:', threadId);

const threads = workerData[0];
const threadIndex = workerData[1];

let configStamp: string | boolean = false;

async function run() {
    while (true) {
        // ORM.dumpSql = true;
        const cachedConfig = await (new CacheModel).where('code', 'config_stamp').first();
        if (!cachedConfig) {
            console.info('config not load');
            process.exit();
            return;
        }
        if (!configStamp) {
            configStamp = cachedConfig.val;
        }
        if (cachedConfig.val != configStamp) {
            console.info('config stamp not match, exit and reload');
            process.exit();
        }
        // console.info(cachedConfig);
        const ifExs = await (new QueueModel).where('status', 1).where(`id%${parseInt(threads)}`, parseInt(threadIndex)).order('id').first();
        if (!ifExs) break;
        // console.info('get queue, id', ifExs.id, threads, threadIndex);
        // break;
        await setStatus(ifExs.id, 2);
        console.info(threadIndex, [ifExs.type, ifExs.payload])
        if (!jobs[ifExs.type]) {
            await setStatus(ifExs.id, -2);
            break;
        }
        try {
            const job = jobs[ifExs.type];
            const result = await job(ifExs.payload);
            await setStatus(ifExs.id, 0,
                result ?
                    (typeof result === 'string') ?
                        result : JSON.stringify(result) : 'success'
            );
        } catch (error) {
            console.info(error);
            let errMsg = error && error.name && error.message ? `${error.name}:${error.message}` : JSON.parse(error);
            await setStatus(ifExs.id, -1, errMsg);
        }
    }
    // console.info(Config.get()?.new_key);
    setTimeout(run, 1000);
}

//-2 unknown -1 failed 0 success 1 new
async function setStatus(queueId: number, status: number, result?: string) {
    if (result)
        await (new QueueModel).where('id', queueId).update({status: status, result: result});
    else
        await (new QueueModel).where('id', queueId).update({status: status});
}

init().then(() => {
    // console.info('======================================');
    // console.info(get());
    // if (!Config.get()) {
    //     // console.info(Config.get());
    //     return;
    // }
    // console.info(Config.get('parser.image'));
    run();
});