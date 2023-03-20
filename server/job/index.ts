import {IncomingMessage, ServerResponse} from "http";
// import fs from "fs";
import ServerConfig from "../ServerConfig";
import QueueModel from "../model/QueueModel";
import FileJob from "./processor/FileJob";
import jobs from "./jobs";
import fs from "fs";

console.info('job watcher init');


async function run() {
    while (true) {
        const ifExs = await (new QueueModel).where('status', 1).order('id').first();
        if (!ifExs) break;
        if (!jobs[ifExs.type]) {
            setStatus(ifExs.id, -2);
            break;
        }
        try {
            const job = jobs[ifExs.type];
            await job(ifExs.payload);
            setStatus(ifExs.id, 0);
        } catch (error) {
            setStatus(ifExs.id, -1);
        }
    }
    setTimeout(run, 1000);
}

//-2 unknown -1 failed 0 success 1 new
function setStatus(queueId: number, status: number) {
    (new QueueModel).where('id', queueId).update({status: status});
}

run();
