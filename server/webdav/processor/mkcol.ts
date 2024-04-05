import {IncomingMessage, ServerResponse} from "http";
import * as fp from "../../lib/FileProcessor";
import {getRelPath, respCode} from "../Lib";
import QueueModel from "../../model/QueueModel";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (typeof relPath != 'string') return;
    const dirPath = fp.dirname(relPath);
    const fileName = fp.titleFilter(fp.basename(relPath));
    const parentDir = await fp.get(dirPath);
    if (!parentDir) return respCode(403, res);
    if (await fp.ifTitleExist(parentDir, fileName))
        return respCode(409, res);
    const mkRes = await fp.mkdir(parentDir, fileName);
    await (new QueueModel).insert({
        type: 'file/buildIndex',
        payload: {id: mkRes.id},
        status: 1,
    });
    return respCode(201, res);
}

