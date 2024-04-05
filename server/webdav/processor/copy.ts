import {IncomingMessage, ServerResponse} from "http";
import * as fp from "../../lib/FileProcessor";
import {getRelPath, respCode} from "../Lib";
import QueueModel from "../../model/QueueModel";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (typeof relPath != 'string') return;
    const curNode = await fp.get(relPath);
    if (!curNode) return respCode(404, res);
    // const curNode = pathNodeLs[pathNodeLs.length - 1];
    //
    let overwrite = false;
    if (req.headers.overwrite && (req.headers.overwrite as string).toUpperCase() === 'T') {
        overwrite = true;
    }
    //
    const targetRelPath = getRelPath((req.headers.destination as string), req.headers.host, res);
    if (!targetRelPath) return;
    const targetTitle = fp.titleFilter(fp.basename(targetRelPath));
    const targetDirPath = fp.dirname(targetRelPath);
    const targetDirNode = await fp.get(targetDirPath);
    const ifExs = await fp.ifTitleExist(targetDirNode, targetTitle);
    if (ifExs) {
        if (!overwrite) return respCode(409, res);
        await fp.rmReal(ifExs);
    }
    const cpRes = await fp.cp(curNode, targetDirPath, targetTitle);
    await (new QueueModel).insert({
        type: 'file/buildIndex',
        payload: {id: cpRes.id},
        status: 1,
    });
    return respCode(201, res);
}

