import { IncomingMessage, ServerResponse } from "http";

import { Buffer } from "buffer";
import { ReadStream } from "fs";
import {getRelPath, respCode} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    // console.info(relPath, req.url, req.headers.host,);
    if (!relPath) return;
    const nodeLs = await fp.relPath2node(relPath);
    // console.info(nodeLs);
    if (!nodeLs) return respCode(404, res);
    return respCode(200, res);
}

