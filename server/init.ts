import * as fsNp from "fs";
import * as fs from 'fs/promises';
import tls, {ConnectionOptions} from "tls";
import * as toml from "toml";
import {ORMQueryResult} from "./lib/DBDriver";
//
export type ConfValue = string | number | boolean | ConfValue[];
export type ConfType = {
    [key: string]: ConfValue | ConfType;
}
//
const BaseConfig: ConfType = {
    // windows: true,
    // pathPrefix: '/api',
    // port: {
    //     api: 8090,
    //     webdav: 8095,
    // },
    auth: {
        api: {
            '^/api/user/login$': [0],
            '^/api/user/auth$': [0],
            '^/api/dev/[^/]+?$': [0],
            '^/api/[^/]+?/[^/]+?$': [1],
        } as { [key: string]: Array<any> },
    },
    //
    path: {
        //通过prefix自动构建
        temp: '',
        preview: '',
        normal: '',
        cover: '',
    },
};
//
const tomlConfContent = fsNp.readFileSync(__dirname + '/../config.toml');
// console.info(__dirname + '/config.toml');
// console.info(tomlConfContent);
const tomlConf = toml.parse(tomlConfContent.toString()) as ConfType;
mergeToml(BaseConfig, tomlConf);

function mergeToml(pConf: ConfType, pToml: ConfType) {
    for (const k in pToml) {
        let it = false;
        if (typeof pToml[k] == 'object') {
            if (!Array.isArray(pToml[k])) {
                it = true;
            }
        }
        if (!pConf[k]) {
            pConf[k] = pToml[k];
        } else {
            if (it) {
                mergeToml(pConf[k] as ConfType, pToml[k] as ConfType);
            } else {
                pConf[k] = pToml[k];
            }
        }
    }
}

//
let dbInit = false;
try {
    fsNp.accessSync(__dirname + '/../../init.db.txt')
    dbInit = true;
} catch (e) {

}
if (dbInit) throw new Error('already init');
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
}

doInit().then(() => {
    process.exit(0);
});