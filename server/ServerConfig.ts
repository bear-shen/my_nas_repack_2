import {type_file} from '../share/Database';
import fs from "fs";
import tls, {ConnectionOptions} from "tls";
import {ORMQueryResult} from "./lib/DBDriver";
import * as toml from "toml";
import SettingModel from "./model/SettingModel";
import CacheModel from "./model/CacheModel";
// import SettingModel from "./model/SettingModel";
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
const tomlConfContent = fs.readFileSync('./config.toml');
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

export let loaded = false;
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
loadConfig();

export async function loadConfig() {
    loaded = false;
    //这边如果用SettingModel的话在worker中会提示  Class extends value undefined is not a constructor or null
    //但是主进程里面不会，原因不明
    //stackoverflow讲可能是循环引用，那为何主进程就行
    const settingArr: ORMQueryResult = await query('select * from settings');
    // console.info(settingArr);
    for (let i1 = 0; i1 < settingArr.length; i1++) {
        const row = settingArr [i1];
        const keyArr = row.name.split('.');
        const lastKey = keyArr.pop();
        let target: any = serverConfig;
        for (let i1 = 0; i1 < keyArr.length; i1++) {
            if (!target[keyArr[i1]]) target[keyArr[i1]] = {};
            target = target[keyArr[i1]];
        }
        target[lastKey] = JSON.parse(row.value);
    }
    //mk path
    const pathConf = BaseConfig.path as ConfType;
    try {
        pathConf.temp = pathConf.root + '/' + pathConf.prefix_temp;
        fs.mkdirSync(pathConf.temp, {recursive: true, mode: 0o777});
    } catch (e) {
    }
    try {
        pathConf.cover = pathConf.root + '/' + pathConf.prefix_cover;
        fs.mkdirSync(pathConf.cover, {recursive: true, mode: 0o777});
    } catch (e) {
    }
    try {
        pathConf.preview = pathConf.root + '/' + pathConf.prefix_preview;
        fs.mkdirSync(pathConf.preview, {recursive: true, mode: 0o777});
    } catch (e) {
    }
    try {
        pathConf.normal = pathConf.root + '/' + pathConf.prefix_normal;
        fs.mkdirSync(pathConf.normal, {recursive: true, mode: 0o777});
    } catch (e) {
    }
    // console.info('==========');
    // console.info(serverConfig);
    //setting里update，加载不update
    // const curTimeStamp = Math.round((new Date().valueOf()) / 60 * 1000).toString();
    const curTimeStamp = new Date().valueOf().toString();
    const ifExs = await (new CacheModel).where('code', 'config_stamp').first();
    if (!ifExs)
        await (new CacheModel).insert({
            code: 'config_stamp',
            value: curTimeStamp,
        });
    loaded = true;
    // serverConfig;
}

console.info(BaseConfig);


export function get(key: string = '') {
    // console.info('getConfig', key);
    // if (!loaded) loadConfig();
    if (!key.length) return serverConfig;
    const keyArr = key.split('.');
    let target: any = serverConfig;
    for (let i1 = 0; i1 < keyArr.length; i1++) {
        target = target[keyArr[i1]];
    }
    return target;
}

