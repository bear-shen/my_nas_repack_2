import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/FileProcessor";
import { getRelPath, getRequestFile, respCode } from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    // put的上传性能问题从index.ts那边就开始了
    // console.info('put:1');
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return respCode(404, res);
    // console.info('put:2');
    const targetNodeLs = await fp.relPath2node(fp.getDir(relPath));
    if (!targetNodeLs) return respCode(404, res);
    // console.info('put:3');
    const targetFileName = fp.getName(relPath);
    // console.info('put:4');
    const tmpFilePath = await getRequestFile(req, res);
    // console.info('put:5');
    fp.put(tmpFilePath, targetNodeLs[targetNodeLs.length - 1], targetFileName);
    // console.info('put:6');
    return respCode(201, res);
}

