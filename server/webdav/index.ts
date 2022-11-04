import { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import ServerConfig from "../ServerConfig";
import http from "http";
import Authorize from "./Authorize";
import Method from "./Method";
import ErrorCode from "../lib/ErrorCode";

fs.mkdirSync(
    ServerConfig.path.temp,
    { recursive: true, mode: 0o777 }
);


/**
 * propfind
 * 返回401
 * propfind 空数据
 * 返回webdav相关的一些数据
 *
 * options
 * 返回支持的method
 *
 * propfind 请求系统容量
 * 返回容量，但是apache的没做，这边也不管了
 *
 * ---- 添加文件
 * put 文件
 * 201 created 空数据
 * propfind 文件
 * 207 multi 文件信息
 * lock 文件 xml数据
 * 200 ok 返回lock-token
 * unlock 文件 带lock-token
 * 204 no content 空数据
 * head 文件
 * 200 ok 空数据
 * put 文件
 * 204 no content 空数据
 * propfind 文件
 * 207 multi 文件信息
 * 100 continue
 * put 文件 文件数据 Overwrite|translate|Expect
 * 204 no content 空数据
 * propfind 文件
 * 207 multi 文件信息
 *
 * */
const server = http.createServer(async function (req: IncomingMessage, res: ServerResponse) {
    // const tmpBodyPath = await getRequestBody(req, res);
    console.info(req.method, req.headers,);
    const authorized = await Authorize.check(req);
    if (!authorized) {
        res.setHeader('WWW-Authenticate', 'Basic realm="WebDAV Server"');
        return sendErr(401, res);
    }
    // console.info('func:', Method[req.method as keyof typeof method]);
    const methodName = req.method as keyof typeof Method;
    if (!Method[methodName]) return sendErr(501, res);
    try {
        await Method[methodName](req, res);
    } catch (e: any) {
        const err = e as Error;
        console.error(err.name, err.message, err.stack,)
        return sendErr(500, res);
    }
    if (!res.writableEnded) res.end();
});
server.listen(ServerConfig.port.webdav);

//@see https://github.com/OpenMarshal/npm-WebDAV-Server/blob/master/src/server/v2/webDAVServer/StartStop.ts#L30
// function getRequestBody(req: IncomingMessage, res: ServerResponse): Promise<ReadStream> {
/* function getRequestBody(req: IncomingMessage, res: ServerResponse): Promise<string> {
    return new Promise(async (resolve: any) => {
        // console.info(req.headers['content-type']);
        const length = req.headers["content-length"] ? Number.parseInt(req.headers["content-length"]) : 0;
        let wrote = 0;
        // const bodyBuffer = Buffer.alloc(length);
        let reqTmpFilePath: string, ws: WriteStream;
        if (length) {
            reqTmpFilePath = `${tmpPath}/${(new Date()).valueOf()}`;
            ws = fs.createWriteStream(reqTmpFilePath, { encoding: "binary", highWaterMark: 32 * 1024 * 1024, });
        }
        req.on('data', async chunk => {
            if (chunk.constructor === String)
                chunk = Buffer.from(chunk);
            await ws.write(chunk);
            wrote += chunk.length;
        });
        req.on('end', async () => {
            if (ws) ws.destroy();
            if (!length) return resolve(null);
            // console.info(reqTmpFilePath, rs, wrote);
            console.info(reqTmpFilePath);
            resolve(reqTmpFilePath);
            // resolve(fs.createReadStream(reqTmpFilePath));
        });
        res.on('close', async () => {
            // console.info('req evt close');
            if (reqTmpFilePath) {
                try {
                    await fs.stat(reqTmpFilePath);
                    await fs.rm(reqTmpFilePath);
                } catch (e) {
                }
            }
        })
    });
} */

function sendErr(code: keyof typeof ErrorCode, res: ServerResponse) {
    let msg = 'unknown error';
    if (ErrorCode[code]) {
        msg = ErrorCode[code];
    }
    res.statusCode = code;
    res.write(`${code} : ${msg}`);
    res.end();
}



