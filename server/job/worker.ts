import QueueModel from "../model/QueueModel";

const {workerData, threadId} = require('node:worker_threads');

console.info('=================')
console.info('worker:', workerData);
console.info('worker:', threadId);

const threads = workerData[0];
const threadIndex = workerData[1];

// throw new Error('def Err');

//-2 unknown -1 failed 0 success 1 new
async function setStatus(queueId: number, status: number) {
    await (new QueueModel).where('id', queueId).update({status: status});
}

// run();
