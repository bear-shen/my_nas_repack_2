import { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import ServerConfig from "../ServerConfig";
import http from "http";
import Authorize from "./Authorize";
import Method from "./Method";
import { respCode } from "./Lib";

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
    // console.info(req.method, req.headers,);
    const authorized = await Authorize.check(req);
    if (!authorized) {
        res.setHeader('WWW-Authenticate', 'Basic realm="WebDAV Server"');
        return respCode(401, res);
    }
    // console.info('func:', Method[req.method as keyof typeof method]);
    const methodName = req.method as keyof typeof Method;
    console.info(methodName, req.url);
    if (!Method[methodName]) return respCode(501, res);
    try {
        await Method[methodName](req, res);
    } catch (e: any) {
        const err = e as Error;
        console.error(err.name, err.message, err.stack,)
        return respCode(500, res);
    }
    if (!res.writableEnded) res.end();
});
server.listen(ServerConfig.port.webdav);
console.info('server now listen on:', ServerConfig.port.webdav);




