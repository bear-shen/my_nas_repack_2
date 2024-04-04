import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/FileProcessor";
import { getRelPath, getRequestFile, respCode } from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const node = await fp.relPath2node(relPath);
    if (!node) return respCode(404, res);
    fp.rm(node[node.length - 1].id);
    return respCode(204, res);
}

