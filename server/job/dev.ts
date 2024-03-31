//generic
// import fs from "fs";
import {loadConfig} from '../ServerConfig'
// import ExtJob from './processor/ExtJob'
// import StatisticsJob from "./processor/StatisticsJob";

console.info('job dev init')


loadConfig().then(async () => {
    console.info('start')
    // await fp.mkdir(0, 'dev1');
    // await fp.mkdir(0, 'dev2');
    // await fp.mkdir('dev2', 'dev3');
    // await fp.mkdir('dev2', 'dev4');
    // await fp.mkdir('dev2/dev4', 'dev5');
    // await fp.mkdir('dev2', 'dev6/dev7');
    // await fp.mkdir('dev2', 'dev11');
    // await fp.mkdir(12, 'dev14');
    // await fp.mv(1,5,'dev15');
    // await fp.mv(5, 1);
    // await fp.mv(1,0);

    //
    // let path = 'D:\\exos\\db_eros\\hun\\作品合集 78842939 KASABUTA'
    // console.info(await ls(path))
    // await StatisticsJob.node({});
    // path = 'D:\\exos\\db_eros\\hun\\作品合集 78842939 KASABUTA\\20230217 232200_ご主人様、ご自由にお使いください。💕'
    // console.info(fsNP.statSync(path))
    // await SysJob.scanOrphanFile({});
    // Util.send({
    //     path: 'http://www.baidu.com',
    //     success: (content) => {
    //         console.info(content);
    //     }
    // });
    // await ExtJob.importEHT({});
    // await ExtJob.cascadeTag({dirId: 0});
    // await ExtJob.rmRaw({dirId: 7912});
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
    console.info('complete')
})
