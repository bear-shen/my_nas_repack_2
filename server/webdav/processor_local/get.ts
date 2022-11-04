import { IncomingMessage, ServerResponse } from "http";

import { Buffer, constants as BuffConstants } from "buffer";
import config from "../../Config";
import Lib from "../Lib";
import FileModel from "../../model/FileModel";
import FileLib from "../../lib/File";
import { open } from 'fs/promises';
import { read, ReadStream } from "fs";
import * as fs from "fs";
import { NodeCol, FileCol } from "../../columns";

export default async function (req: IncomingMessage, bodyPath: string, res: ServerResponse) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    //
    const rootPos = url.pathname.indexOf(config.webDavRoot);
    console.info(url.pathname, config.webDavRoot, rootPos);
    if (rootPos === -1) return Lib.respCode(res, 404);
    //
    const dirNode = await Lib.getCurNode(url) as NodeCol;
    console.info(dirNode);
    if (!dirNode) return Lib.respCode(res, 404);
    if (!dirNode.index_file_id || !dirNode.index_file_id.raw) return Lib.respCode(res, 204);
    //
    const curFile = await (new FileModel).where('id', dirNode.index_file_id.raw).first();
    console.info(curFile);
    if (!curFile) return Lib.respCode(res, 404);
    const filePath = FileLib.makePath('local', curFile.type, curFile.hash, curFile.suffix);
    let bufFrom = 0;
    let bufTo = curFile.size;
    if (req.headers.range) {
        const rngArr = req.headers.range.split('=');
        if (rngArr.length > 1) {
            const byteArr = rngArr[1].split('-');
            //不知道为什么会有from=to的请求...
            if (byteArr.length === 2 && byteArr[0] !== byteArr[1]) {
                bufFrom = Number.parseInt(byteArr[0]);
                bufTo = Number.parseInt(byteArr[1]);
                if (bufTo > curFile.size) {
                    bufTo = curFile.size;
                }
            }
        }
    }
    // let fileHandle = await open(filePath, 'r');
    console.info(curFile, bufTo, bufFrom);
    res.statusCode = 206;
    await writeFileStream(res, filePath, bufFrom, bufTo);
    res.end();
}

function writeFileStream(res: ServerResponse, path: string, from: number, to: number): Promise<any> {
    return new Promise((resolve: any) => {
        const rs = fs.createReadStream(path, {
            start: from, end: to
        });
        rs.on('data', (chunk) => {
            res.write(chunk);
        })
        rs.on('end', () => {
            resolve();
        });
    })
}

