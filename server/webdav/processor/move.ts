import {IncomingMessage, ServerResponse} from "http";
import * as fp from "../../lib/FileProcessor";
import {getRelPath, getRequestFile, respCode} from "../Lib";
import QueueModel from "../../model/QueueModel";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const sourceNode = await fp.relPath2node(relPath);
    if (!sourceNode) return respCode(404, res);
    //
    let overwrite = false;
    if (req.headers.overwrite && (req.headers.overwrite as string).toUpperCase() === 'T') {
        overwrite = true;
    }
    //
    const targetRelPath = getRelPath((req.headers.destination as string), req.headers.host, res);
    if (!targetRelPath) return;
    // 409
    const targetNode = await fp.relPath2node(targetRelPath);
    if (targetNode && !overwrite) return respCode(409, res);
    //
    const targetDirPath = fp.dirname(targetRelPath);
    const targetName = fp.getName(targetRelPath);
    const targetDir = await fp.relPath2node(targetDirPath);
    if (!targetDir) return respCode(403, res);
    //
    console.info(
        sourceNode[sourceNode.length - 1].title, targetDir[targetDir.length - 1].title, targetName
    )
    await fp.mv(sourceNode[sourceNode.length - 1], targetDir[targetDir.length - 1], targetName);
    (new QueueModel).insert({
        type: 'file/rebuildIndex',
        payload: {id: sourceNode[sourceNode.length - 1].id},
        status: 1,
    });
    return respCode(201, res);
}

