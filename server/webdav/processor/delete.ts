import {IncomingMessage, ServerResponse} from "http";
import * as fp from "../../lib/FileProcessor";
import {getRelPath, respCode} from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (typeof relPath != 'string') return;
    const node = await fp.get(relPath);
    if (!node) return respCode(404, res);
    await fp.rm(node);
    return respCode(204, res);
}

