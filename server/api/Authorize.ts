import { IncomingMessage } from "http";
import { fromByteArray, toByteArray } from "base64-js";
import { makePass } from '../lib/Auth';
import UserModel from '../model/UserModel';
import { URL } from "url";
import AuthModel from '../model/AuthModel';

const md5 = require('md5');

async function check(url: URL, req: IncomingMessage): Promise<number | true | false> {
    // console.info(url.pathname,);
    // console.info(url, data,);
    const [_, prefix, c, a] = url.pathname.split('/');
    if (c === 'user' && a === 'login') {
        return true;
    }
    // console.info([_, prefix, c, a]);
    // console.info(req.headers);
    if (!req.headers['auth-token']) return false;
    const ifExs = await (new AuthModel).where('token', req.headers['auth-token']).order('id', 'desc').first();
    if (!ifExs) return false;
    //
    return ifExs.uid;
}

export default {
    check
};