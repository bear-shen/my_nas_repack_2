import {type_file} from '../share/Database';
import * as fsNp from "fs";
import * as fs from 'fs/promises';
import tls, {ConnectionOptions} from "tls";
import * as toml from "toml";
import {ORMQueryResult} from "./lib/DBDriver";
import * as Config from "./Config";
import {type ConfType} from "./Config";

//这里是docker初始化的文件
const BaseConfig: ConfType = Config.loadLocal();

let dbInit = false;
try {
    fsNp.readFileSync(__dirname + '/../../init.db.txt')
    dbInit = true;
} catch (e) {

}
if (dbInit) {
    console.info('already inited');
    process.exit(0);
}
//所以先赋值一下
export let serverConfig = BaseConfig;
const dbConf = BaseConfig.db as ConfType;
let driverName = '';
switch (dbConf.driver) {
    case 'mysql':
        driverName = "./lib/MySQL";
        break;
    case 'postgresql':
        driverName = "./lib/PostgreSQL";
        break;
}
const {
    query,
    execute,
    SQL_PARAM
} = require(driverName);

async function doInit() {
    let ifExs = false;
    try {
        await execute('select * from settings');
        ifExs = true;
    } catch (e) {
        console.info('db already exists, exit');
        return;
    }
    const sqlInitStr = fsNp.readFileSync(__dirname + '/../../init.postgres.sql').toString();
    // console.info(sqlInitStr);
    await execute(sqlInitStr);
    const sqlBaseStr = fsNp.readFileSync(__dirname + '/../../init.base.sql').toString();
    // console.info(sqlBaseStr);
    await execute(sqlBaseStr);
    fsNp.writeFileSync(__dirname + '/../../init.db.txt', '1', {flag: 'a+'});
    console.info('db inited');
}

doInit().then(() => {
    process.exit(0);
});