import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/FileProcessor";
import { getRelPath, getRequestFile, respCode } from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const parentDir = await fp.relPath2node(fp.getDir(relPath));
    if (!parentDir) return respCode(403, res);
    fp.mkdir(parentDir[parentDir.length - 1].id, fp.getName(relPath));
    return respCode(201, res);
}

