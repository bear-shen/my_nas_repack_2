import {IncomingMessage, ServerResponse} from "http";
import * as fp from "../../lib/FileProcessor";
import {getRelPath, getRequestFile, respCode} from "../Lib";
import QueueModel from "../../model/QueueModel";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const pathNodeLs = await fp.relPath2node(relPath);
    if (!pathNodeLs) return respCode(404, res);
    const curNode = pathNodeLs[pathNodeLs.length - 1];
    //
    let overwrite = false;
    if (req.headers.overwrite && (req.headers.overwrite as string).toUpperCase() === 'T') {
        overwrite = true;
    }
    //
    const targetRelPath = getRelPath((req.headers.destination as string), req.headers.host, res);
    if (!targetRelPath) return;
    const targetName = fp.getName(targetRelPath);
    const targetDirPath = fp.getDir(targetRelPath);
    const targetDirNodeLs = await fp.relPath2node(targetDirPath);
    if (!targetDirNodeLs) return respCode(404, res);
    const targetDirNode = targetDirNodeLs[targetDirNodeLs.length - 1];
    //
    const targetRelNodeLs = await fp.relPath2node(targetRelPath);
    if (targetRelNodeLs && !overwrite) return respCode(409, res);
    // 
    const cpRes = await fp.cp(curNode, targetDirNode, targetName);
    if (cpRes)
        (new QueueModel).insert({
            type: 'file/buildIndex',
            payload: {id: cpRes.id},
            status: 1,
        });
    return respCode(201, res);
}

