import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/FileProcessor";
import { getRelPath, getRequestFile, respCode } from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return respCode(404, res);
    const targetNodeLs = await fp.relPath2node(fp.getDir(relPath));
    if (!targetNodeLs) return respCode(404, res);
    const targetFileName = fp.getName(relPath);
    const tmpFilePath = await getRequestFile(req, res);
    fp.put(tmpFilePath, targetNodeLs[targetNodeLs.length - 1], targetFileName);
    return respCode(201, res);
}

