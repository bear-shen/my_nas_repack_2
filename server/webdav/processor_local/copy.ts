import { IncomingMessage, ServerResponse } from "http";

import { Buffer } from "buffer";
import config from "../../Config";
import Lib from "../Lib";
import NodeModel from "../../model/NodeModel";
import QueueModel from "../../model/QueueModel";
import FileLib from "../../lib/File";
import { ReadStream } from "fs";
import { NodeCol, FileCol } from "../../columns";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const targetUrl = new URL(req.headers['destination'] as string);
    //
    const curNode = await Lib.getCurNode(url) as NodeCol;
    // console.info(curNode);
    if (!curNode) return Lib.respCode(res, 404);
    //
    const rootPos = targetUrl.pathname.indexOf(config.webDavRoot);
    const targetNodePath = targetUrl.pathname.substring(rootPos + config.webDavRoot.length).replace(/\/$/ig, '');
    // console.info(targetNodePath);
    const targetDirOffset = targetNodePath.lastIndexOf('/');
    const targetDirPath = targetNodePath.substring(0, targetDirOffset);
    const targetFileName = decodeURIComponent(targetNodePath.substring(targetDirOffset + 1));
    // console.info(targetDirPath, targetFileName);
    const targetDir = await Lib.mkdir(targetDirPath);
    //
    const ifDup = await (new NodeModel).where('id_parent', targetDir.id).where('title', targetFileName).first();
    if (ifDup)
        return Lib.respCode(res, 409);
    //
    curNode.title = targetFileName;
    await FileLib.moveFile(curNode, targetDir, true);
    return Lib.respCode(res, 201);
}