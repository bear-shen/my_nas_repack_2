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
export const BaseConfig: ConfType = {
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

export function loadLocal() {
//
    const tomlConfContent = fsNp.readFileSync(__dirname + '/../config.toml');
// console.info(__dirname + '/config.toml');
// console.info(tomlConfContent);
    const tomlConf = toml.parse(tomlConfContent.toString()) as ConfType;
    mergeToml(BaseConfig, tomlConf);
    //
    // if (process.env.NAS_DRIVER) (BaseConfig.db as ConfType).driver = process.env.NAS_DRIVER;
    // if (process.env.NAS_PORT) (BaseConfig.db as ConfType).port = parseInt(process.env.NAS_PORT);
    // if (process.env.NAS_DB) (BaseConfig.db as ConfType).database = process.env.NAS_DB;
    // if (process.env.NAS_USER) (BaseConfig.db as ConfType).account = process.env.NAS_USER;
    // if (process.env.NAS_PASSWORD) (BaseConfig.db as ConfType).password = process.env.NAS_PASSWORD;
    //
    if (process.env.NAS_ORIGIN) (BaseConfig.web as ConfType).origin = process.env.NAS_ORIGIN;
    if (process.env.onlyoffice_enabled) (BaseConfig.web as ConfType).onlyoffice_enabled = process.env.onlyoffice_enabled;
    // if (process.env.onlyoffice_api_src) (BaseConfig.web as ConfType).onlyoffice_api_src = process.env.onlyoffice_api_src;
    if (process.env.onlyoffice_origin) (BaseConfig.web as ConfType).onlyoffice_origin = process.env.onlyoffice_origin;
    if (process.env.onlyoffice_jwt_secret) (BaseConfig.web as ConfType).onlyoffice_jwt_secret = process.env.onlyoffice_jwt_secret;
    //
    return BaseConfig;
}

export function mergeToml(pConf: ConfType, pToml: ConfType) {
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

export let loaded = false;

export function getDBBase() {
    const dbConfig = get('db');
// console.info(Config.get());
// console.info(dbConfig);
//     let driverName = '';
//     switch (dbConfig.driver) {
//         case 'mysql':
//             driverName = "./lib/MySQL";
//             break
//         case 'postgresql':
//             driverName = "./lib/PostgreSQL";
//             break
//     }
    const {
        query,
        execute,
        SQL_PARAM
    } = require("./lib/PostgreSQL");
    return {
        query, execute, SQL_PARAM
    }
}

export let serverConfig = BaseConfig;

export async function loadDB(query: (sql: string, binds?: Array<any>) => Promise<ORMQueryResult>) {
    //这边如果用SettingModel的话在worker中会提示  Class extends value undefined is not a constructor or null
    //但是主进程里面不会，原因不明
    //stackoverflow讲可能是循环引用，那为何主进程就行
    const settingArr: ORMQueryResult = await (query('select * from settings'));
    for (let i1 = 0; i1 < settingArr.length; i1++) {
        const row = settingArr[i1];
        const keyArr = row.name.split('.');
        const lastKey = keyArr.pop();
        let target: any = serverConfig;
        for (let i1 = 0; i1 < keyArr.length; i1++) {
            if (!target[keyArr[i1]]) target[keyArr[i1]] = {};
            target = target[keyArr[i1]];
        }
        // target[lastKey] = JSON.parse(row.value);
        target[lastKey] = row.value;
    }
    loaded = true;
}

// console.info(BaseConfig);


export function get(key: string = '') {
    // console.info('Config.get', key);
    // if (!loaded) loadConfig();
    if (!key.length) return serverConfig;
    const keyArr = key.split('.');
    let target: any = serverConfig;
    if (!target) return null;
    for (let i1 = 0; i1 < keyArr.length; i1++) {
        target = target[keyArr[i1]];
    }
    return target;
}
