// import fs from "fs";
import {loadConfig} from "../ServerConfig";
import SysJob from "./processor/SysJob";

console.info('job dev init');

loadConfig().then(async () => {
    console.info('start');
    await SysJob.scanOrphanFile({});
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
});
