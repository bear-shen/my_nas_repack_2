import {IncomingMessage} from "http";
import {URL} from "url";
import AuthModel from '../model/AuthModel';
import UserModel from "../model/UserModel";
import UserGroupModel from "../model/UserGroupModel";
import * as Config from "../Config";


async function check(url: URL, req: IncomingMessage): Promise<number | true | false> {
    // console.info(url.pathname,);
    // console.info(url, data,);
    const [_, prefix, c, a] = url.pathname.split('/');
    const fPath = `/api/${c}/${a}`;
    //
    let authRole = 0;
    const authLs = Config.get('auth.api');
    for (const path in authLs) {
        const match = new RegExp(path, 'i');
        if (fPath.match(match)) {
            authRole = authLs[path][0];
            break;
        }
    }
    if (!authRole) {
        return true;
    }
    // console.info([_, prefix, c, a]);
    // console.info(req.headers);
    let token = req.headers['auth-token'];
    if (!token) {
        if (req.url) {
            let uriInfo = new URL('http://0.0.0.0' + req.url);
            if (uriInfo) {
                if (uriInfo.searchParams && uriInfo.searchParams.has('tosho_token')) {
                    token = uriInfo.searchParams.get('tosho_token');
                }
            }
        }
    }
    if (!token) return false;
    const ifExs = await (new AuthModel).where('token', token).order('id', 'desc').first(['uid']);
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
