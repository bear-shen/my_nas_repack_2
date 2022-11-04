import { IncomingMessage, ServerResponse } from "http";
import FileLib from "../../lib/File";

import { Buffer } from "buffer";
import Lib from "../Lib";
import NodeModel from "../../model/NodeModel";
import { ReadStream } from "fs";
import { NodeCol, FileCol } from "../../columns";

export default async function (req: IncomingMessage, bodyPath: string, res: ServerResponse) {
    // console.info('proc here, req:', body);
    const url = new URL(req.url, `http://${req.headers.host}`);
    //@see FileController/delete
    const node = await Lib.getCurNode(url) as NodeCol;
    if (!node || !node.id)
        return Lib.respCode(res, 404);
    if (!node) throw new Error('no file');
    const targetStatus = node.status ? 0 : 1;
    await (new NodeModel()).where('id', node.id)
        .update({
            status: targetStatus,
        });
    if (node.type !== 'directory') return Lib.respCode(res, 204);
    //文件夹的时候处理一下级联
    await (new NodeModel()).whereRaw('find_in_set( ? , list_node)', node.id)
        .where('status', 1)
        .update({ status: -1 });
    return Lib.respCode(res, 204);
}

