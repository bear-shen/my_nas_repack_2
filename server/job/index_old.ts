import {IncomingMessage, ServerResponse} from "http";
// import fs from "fs";
import QueueModel from "../model/QueueModel";
import FileJob from "./processor/FileJob";
import jobs from "./jobs";
import fs from "fs";

console.info('job watcher init');


async function run() {
    while (true) {
        const ifExs = await (new QueueModel).where('status', 1).order('id').first();
        if (!ifExs) break;
        await setStatus(ifExs.id, 2);
        console.info([ifExs.type, ifExs.payload])
        if (!jobs[ifExs.type]) {
            await setStatus(ifExs.id, -2);
            break;
        }
        try {
            const job = jobs[ifExs.type];
            await job(ifExs.payload);
            await setStatus(ifExs.id, 0);
        } catch (error) {
            console.info(error);
            await setStatus(ifExs.id, -1);
        }
    }
    setTimeout(run, 1000);
}

//-2 unknown -1 failed 0 success 1 new
async function setStatus(queueId: number, status: number) {
    await (new QueueModel).where('id', queueId).update({status: status});
}

run();
