import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/LocalFileProcessor";
import { getRelPath, getRequestFile, respCode, setResponseFile } from '../Lib';

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const ifExs = await fp.stat(relPath);
    if (!ifExs) return respCode(404, res);
    if (!ifExs.isFile) return respCode(405, res);
    res.statusCode = 206;
    //
    let bufFrom = 0;
    let bufTo = ifExs.size;
    if (req.headers.range) {
        const rngArr = req.headers.range.split('=');
        if (rngArr.length > 1) {
            const byteArr = rngArr[1].split('-');
            //不知道为什么会有from=to的请求...
            if (byteArr.length === 2 && byteArr[0] !== byteArr[1]) {
                bufFrom = Number.parseInt(byteArr[0]);
                bufTo = Number.parseInt(byteArr[1]);
                if (bufTo > ifExs.size) {
                    bufTo = ifExs.size;
                }
            }
        }
    }
    //
    const rs = fp.get(relPath, bufFrom, bufTo);
    await setResponseFile(rs, res);
    return;
}

