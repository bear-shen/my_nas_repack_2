import { IncomingHttpHeaders, IncomingMessage } from "http";
import { PersistentFile } from "formidable";
import Config from "../ServerConfig";
import AuthModel from "../model/AuthModel";
const md5 = require('md5');


export function makePass(pass: string): string {
    return md5(md5(pass));
}

//return uid|false|-1 on no auth
/*export default async function (
    url: URL,
    request: IncomingMessage,
): Promise<boolean | number> {
    // console.info(url, header);
    let needAuth = false;
    for (const authKey in Config.auth) {
        if (!url.pathname.match(new RegExp(authKey))) continue;
        needAuth = !!(Config.auth[authKey as string][0]);
    }
    if (!needAuth) return -1;
    const header = request.headers;
    const method = request.method;
    let token: string;
    switch (method) {
        case 'POST':
            if (!header['auth-token']) return false;
            token = header['auth-token'] as string;
            break;
        case 'GET':
            const param = url.searchParams;
            if (!param.get('token')) return false;
            token = param.get('token');
            break;
    }
    const ifAuthed = await (new AuthModel()).where('token', token).first();
    if (!ifAuthed) return false;
    return ifAuthed.uid;
}*/