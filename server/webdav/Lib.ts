import { ReadStream, WriteStream } from "fs";
import { IncomingMessage, ServerResponse } from "http";
import Util from "../lib/Util";
import ServerConfig from "../ServerConfig";
import * as fs from 'fs/promises';
import ErrorCode from "../lib/ErrorCode";
import * as fsNP from 'fs';

//@see https://github.com/OpenMarshal/npm-WebDAV-Server/blob/master/src/server/v2/webDAVServer/StartStop.ts#L30
export function getRequestBuffer(req: IncomingMessage, res: ServerResponse): Promise<Buffer> {
    return new Promise(async (resolve: any) => {
        // console.info(req.headers['content-type']);
        const length = req.headers["content-length"] ? Number.parseInt(req.headers["content-length"]) : 0;
        if (!length) resolve('');
        //
        let wrote = 0;
        const bodyBuffer = Buffer.alloc(length);
        req.on('data', async chunk => {
            // console.info(chunk);
            // if (chunk.constructor === String)
            // chunk = Buffer.from(chunk);
            await bodyBuffer.fill(chunk, wrote, chunk.length);
            wrote += chunk.length;
        });
        req.on('end', async () => resolve(bodyBuffer));
        res.on('close', async () => { })
    });
}
//@see https://github.com/OpenMarshal/npm-WebDAV-Server/blob/master/src/server/v2/webDAVServer/StartStop.ts#L30
export function getRequestFile(req: IncomingMessage, res: ServerResponse): Promise<string> {
    return new Promise((resolve: any) => {
        // console.info('getRequestFile:init');
        // console.info(req.headers['content-type']);
        const length = req.headers["content-length"] ? Number.parseInt(req.headers["content-length"]) : 0;
        if (!length) resolve(null);
        //
        let wrote = 0;
        const reqTmpFilePath = `${ServerConfig.path.temp}/${(new Date()).valueOf()}_${Math.random()}`;
        // const ws = fs.createWriteStream(reqTmpFilePath, { encoding: "binary", highWaterMark: 32 * 1024 * 1024, });
        const ws = fsNP.createWriteStream(reqTmpFilePath, {
            encoding: "binary",
            flags: 'w+',
            mode: 0o666,
        });
        //
        req.on('data', async chunk => {
            // if (chunk.constructor === String)
            // chunk = Buffer.from(chunk);
            await ws.write(chunk);
            // await bodyBuffer.fill(chunk, wrote, chunk.length);
            wrote += chunk.length;
        });
        req.on('end', async () => {
            // console.info('getRequestFile:end');
            resolve(reqTmpFilePath);
        });
        res.on('close', async () => {
            // console.info('getRequestFile close');
        })
    });
}

export function setResponseFile(rs: ReadStream, res: ServerResponse): Promise<null> {
    return new Promise(resolve => {
        rs.on('data', (chunk) => {
            // console.info(chunk.length);
            res.write(chunk);
        })
        rs.on('end', () => {
            resolve(null);
        });
    });
}


export function respCode(code: keyof typeof ErrorCode, res: ServerResponse) {
    let msg = 'unknown status';
    if (ErrorCode[code]) {
        msg = ErrorCode[code];
    }
    res.statusCode = code;
    res.write(`${code} : ${msg}`);
    res.end();
}

export function getRelPath(url: string, host: string, res: ServerResponse): string | void {
    // console.info(url);
    const urlInfo = new URL(url, 'http://' + host);
    const reqPath = decodeURI(urlInfo.pathname);
    const davRootPos = reqPath.indexOf(ServerConfig.path.webdav);
    //
    if (davRootPos === -1) return respCode(404, res);
    if (davRootPos !== 0) return respCode(403, res);
    //
    let relPath = reqPath.slice(ServerConfig.path.webdav.length);
    if (!relPath.length) relPath = '/';
    if (relPath.indexOf('/') !== 0) {
        return respCode(404, res);
    }
    return relPath;
}


