import {IncomingMessage, ServerResponse} from "http";
import * as fp from "../../lib/FileProcessor";
import {getRelPath, getRequestFile, respCode} from "../Lib";
import QueueModel from "../../model/QueueModel";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const parentDir = await fp.relPath2node(fp.getDir(relPath));
    if (!parentDir) return respCode(403, res);
    const mkRes = await fp.mkdir(parentDir[parentDir.length - 1].id, fp.getName(relPath));
    if (mkRes)
        (new QueueModel).insert({
            type: 'file/buildIndex',
            payload: {id: mkRes.id},
            status: 1,
        });
    return respCode(201, res);
}

