import { IncomingMessage } from "http";
import { fromByteArray, toByteArray } from "base64-js";
import { makePass } from '../lib/Auth';
import ServerConfig from "../ServerConfig";
import UserModel from '../model/UserModel';
import { URL } from "url";

const md5 = require('md5');

async function check(urlInfo: URL, req: IncomingMessage): Promise<number | false> {
    if (!req.headers.token) return false;
    // const ifExs = await (new UserModel).where('name', name).or().where('mail', name).first();
    // if (!ifExs) return false;
    //
    return 1;
}

export default {
    check
};