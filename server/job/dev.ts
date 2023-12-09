//generic
// import fs from "fs";
import {loadConfig} from "../ServerConfig";
import ExtJob from "./processor/ExtJob";

console.info('job dev init');


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
});
