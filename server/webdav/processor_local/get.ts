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
    const rs = fp.get(relPath, 0, ifExs.size);
    await setResponseFile(rs, res);
    return;
}

