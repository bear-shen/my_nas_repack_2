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
            //[0:admin,1:user,2:admin]
            //
            '^/api/user/login$': [0],
            '^/api/user/auth$': [0],
            '^/api/dev/[^/]+?$': [0],
            //
            '^/api/[^/]+?/[^/]+?$': [1],
            //
            '^/api/user/[^/]+?$': [2],
            '^/api/user_group/[^/]+?$': [2],
            '^/api/log/[^/]+?$': [2],
            '^/api/setting/[^/]+?$': [2],
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
        if (pToml.hasOwnProperty && !pToml.hasOwnProperty(k)) continue;
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

if (process.env.NAS_DRIVER) (BaseConfig.db as ConfType).driver = process.env.NAS_DRIVER;
if (process.env.NAS_PORT) (BaseConfig.db as ConfType).port = parseInt(process.env.NAS_PORT);
if (process.env.NAS_DB) (BaseConfig.db as ConfType).database = process.env.NAS_DB;
if (process.env.NAS_USER) (BaseConfig.db as ConfType).account = process.env.NAS_USER;
if (process.env.NAS_PASSWORD) (BaseConfig.db as ConfType).password = process.env.NAS_PASSWORD;

//
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