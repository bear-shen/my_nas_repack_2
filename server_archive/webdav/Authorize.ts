import { IncomingMessage } from "http";
import { fromByteArray, toByteArray } from "base64-js";
import { makePass } from '../lib/Auth';
import UserModel from '../model/UserModel';

const md5 = require('md5');

async function check(req: IncomingMessage): Promise<boolean> {
    if (!req.headers.authorization) return false;
    const authStr = req.headers.authorization as string;
    const authArr = authStr.split(' ');
    // console.info(authArr);
    if (authArr.length < 2) return false;
    //
    const scheme = authArr.shift();
    const parameters = authArr;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
     * case 'Bearer':
     * case 'Digest':
     * case 'HOBA':
     * case 'Mutual':
     * case 'Negotiate':
     * case 'NTLM':
     * case 'VAPID':
     * case 'SCRAM':
     * case 'AWS4-HMAC-SHA256':
     * */
    switch (scheme) {
        default:
            return false;
            break;
        case 'Basic':
            /*const arr = [] as number[];
            for (let i1 = 0; i1 < parameters[0].length; i1++) {
                arr.push(parameters[0].charCodeAt(i1));
            }
            const str = fromByteArray(Uint8Array.from(arr));*/
            const decrypt = toByteArray(parameters[0])
            const decryptStr = String.fromCharCode(...Array.from(decrypt));
            const pwArr = decryptStr.split(':');
            //
            const name = pwArr.shift();
            const password = pwArr.join(':');
            const ifExs = await (new UserModel).where('name', name).or().where('mail', name).first();
            if (!ifExs) return false;
            if (ifExs.password !== md5(md5(password))) return false;
            break;
    }
    //
    return true;
}

export default {
    check
};