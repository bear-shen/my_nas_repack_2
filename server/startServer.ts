import * as fsNp from "fs";
import {ORMQueryResult} from "./lib/DBDriver";
import * as Config from "./Config";
import {type ConfType} from "./Config";
//这里是后端启动的文件
const BaseConfig: ConfType = Config.loadLocal();

export async function init() {
    const {
        query,
        execute,
        SQL_PARAM
    } = Config.getDBBase();
    await Config.loadDB(query);
    await prepareLocal(query);
}

export async function prepareLocal(query: (sql: string, binds?: Array<any>) => Promise<ORMQueryResult>) {
    //mk path
    const pathConf = BaseConfig.path as ConfType;
    try {
        pathConf.temp = pathConf.root + '/' + pathConf.prefix_temp;
        fsNp.mkdirSync(pathConf.temp, {recursive: true, mode: 0o777});
    } catch (e) {
    }
    try {
        pathConf.cover = pathConf.root + '/' + pathConf.prefix_cover;
        fsNp.mkdirSync(pathConf.cover, {recursive: true, mode: 0o777});
    } catch (e) {
    }
    try {
        pathConf.preview = pathConf.root + '/' + pathConf.prefix_preview;
        fsNp.mkdirSync(pathConf.preview, {recursive: true, mode: 0o777});
    } catch (e) {
    }
    try {
        pathConf.normal = pathConf.root + '/' + pathConf.prefix_normal;
        fsNp.mkdirSync(pathConf.normal, {recursive: true, mode: 0o777});
    } catch (e) {
    }
    // console.info('==========');
    // console.info(serverConfig);
    //setting里update，加载不update
    // const curTimeStamp = Math.round((new Date().valueOf()) / 60 * 1000).toString();
    const curTimeStamp = new Date().valueOf().toString();
    const ifExs = await query("select * from cache where code='config_stamp'");
    if (!ifExs || !ifExs.length)
        await query(`insert into cache (code, val)
                     values ('config_stamp', ${curTimeStamp})`);
    // serverConfig;
}
