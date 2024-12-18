import * as fsNP from "fs";
import {ReadStream} from "fs";
import {IncomingMessage, ServerResponse} from "http";
import * as Config from "../Config";
import ErrorCode from "../lib/ErrorCode";
import * as fp from "../lib/FileProcessor";

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
        res.on('close', async () => {
        })
    });
}

//@see https://github.com/OpenMarshal/npm-WebDAV-Server/blob/master/src/server/v2/webDAVServer/StartStop.ts#L30
export function getRequestFile(req: IncomingMessage, res: ServerResponse, suffix: string = ''): Promise<string> {
    return new Promise((resolve: any) => {
        // console.info('getRequestFile:init');
        // console.info(req.headers['content-type']);
        const length = req.headers["content-length"] ? Number.parseInt(req.headers["content-length"]) : 0;
        if (!length) resolve(null);
        //
        let wrote = 0;
        const reqTmpFilePath = fp.genTmpPath(suffix);
        // const ws = fs.createWriteStream(reqTmpFilePath, { encoding: "binary", highWaterMark: 32 * 1024 * 1024, });
        const ws = fsNP.createWriteStream(reqTmpFilePath, {
            autoClose: true,
            // encoding: "binary",
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
            ws.close(() => {
                resolve(reqTmpFilePath);
            });
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


export function respCode(code: keyof typeof ErrorCode | number, res: ServerResponse) {
    let msg = 'unknown status';
    if (ErrorCode[code]) {
        msg = ErrorCode[code];
    }
    res.statusCode = code * 1;
    res.write(`${code} : ${msg}`);
    res.end();
}

export function getRelPath(url: string, host: string, res: ServerResponse): string | void {
    // console.info(url);
    const urlInfo = new URL(url, 'http://' + host);
    const reqPath = decodeURIComponent(urlInfo.pathname);
    const davRootPos = reqPath.indexOf(Config.get().path.webdav);
    //
    if (davRootPos === -1) return respCode(404, res);
    if (davRootPos !== 0) return respCode(403, res);
    //
    let relPath = reqPath.slice(Config.get().path.webdav.length);
    if (!relPath.length) relPath = '';
    relPath = fp.pathFilter(relPath);
    return relPath;
}


