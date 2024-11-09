import {IncomingMessage} from "http";
import {URL} from "url";
import AuthModel from '../model/AuthModel';
import UserModel from "../model/UserModel";
import UserGroupModel from "../model/UserGroupModel";
import {get as getConfig} from "../ServerConfig";

const md5 = require('md5');

async function check(url: URL, req: IncomingMessage): Promise<number | true | false> {
    // console.info(url.pathname,);
    // console.info(url, data,);
    const [_, prefix, c, a] = url.pathname.split('/');
    const fPath = `/api/${c}/${a}`;
    //
    let authRole = 0;
    const authLs = getConfig('auth.api');
    for (const path in authLs) {
        const match = new RegExp(path, 'i');
        if (fPath.match(match)) {
            authRole = authLs[path][0];
        }
    }
    if (!authRole) {
        return true;
    }
    // console.info([_, prefix, c, a]);
    // console.info(req.headers);
    if (!req.headers['auth-token']) return false;
    const ifExs = await (new AuthModel).where('token', req.headers['auth-token']).order('id', 'desc').first(['uid']);
    // console.info(ifExs);
    if (!ifExs) return false;
    if (authRole == 2) {
        const user = await (new UserModel()).where('id', ifExs.uid).first();
        const group = await (new UserGroupModel()).where('id', user.id_group).first();
        if (!group.admin || group.admin != 1) {
            return false;
        }
    }
    //
    return ifExs.uid;
}

async function checkRole(uid: number, role: 'admin' | 'user' | 'guest') {
    const user = await (new UserModel()).where('id', uid).first();
    if (!user.status) throw new Error('prohibited user');
    const group = await (new UserGroupModel()).where('id', user.id_group).first();
    if (!group.status) throw new Error('prohibited user group');
    switch (role) {
        case "admin":
            if (!group.admin) throw new Error('no privilege');
            break;
        case "user":
            if (group.title == 'guest') throw new Error('no privilege');
            break;
        case "guest":
            // if (!group.admin) throw new Error('no privilege');
            break;
    }
}

export default {
    check
};