import { ReadStream, WriteStream } from "fs";
import { IncomingMessage, ServerResponse } from "http";
import Util from "../lib/Util";
import ServerConfig from "../ServerConfig";
import * as fs from 'fs/promises';
import ErrorCode from "../lib/ErrorCode";

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
    return new Promise(async (resolve: any) => {
        // console.info(req.headers['content-type']);
        const length = req.headers["content-length"] ? Number.parseInt(req.headers["content-length"]) : 0;
        if (!length) resolve(null);
        //
        let wrote = 0;
        const reqTmpFilePath = `${ServerConfig.path.temp}/${(new Date()).valueOf()}`;
        // const ws = fs.createWriteStream(reqTmpFilePath, { encoding: "binary", highWaterMark: 32 * 1024 * 1024, });
        const ws = await fs.open(reqTmpFilePath, 'a+', 0o666);
        //
        req.on('data', async chunk => {
            // if (chunk.constructor === String)
            // chunk = Buffer.from(chunk);
            await ws.write(chunk, wrote);
            // await bodyBuffer.fill(chunk, wrote, chunk.length);
            wrote += chunk.length;
        });
        req.on('end', async () => {
            resolve(reqTmpFilePath);
        });
        res.on('close', async () => {
            try {
                await fs.stat(reqTmpFilePath);
                await fs.rm(reqTmpFilePath);
            } catch (e) {
            }
        })
    });
}


export function sendErr(code: keyof typeof ErrorCode, res: ServerResponse) {
    let msg = 'unknown error';
    if (ErrorCode[code]) {
        msg = ErrorCode[code];
    }
    res.statusCode = code;
    res.write(`${code} : ${msg}`);
    res.end();
}
