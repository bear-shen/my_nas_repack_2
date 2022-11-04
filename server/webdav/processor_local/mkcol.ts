import { IncomingMessage, ServerResponse } from "http";

import { Buffer } from "buffer";
import config from "../../Config";
import Lib from "../Lib";
import NodeModel from "../../model/NodeModel";
import QueueModel from "../../model/QueueModel";
import { ReadStream } from "fs";

export default async function (req: IncomingMessage, bodyPath: string, res: ServerResponse) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    //
    const rootPos = url.pathname.indexOf(config.webDavRoot);
    console.info(url.pathname, config.webDavRoot, rootPos);
    if (rootPos === -1) return Lib.respCode(res, 404);
    //
    const dirPath = url.pathname.substring(rootPos + config.webDavRoot.length);
    Lib.mkdir(dirPath);
    return Lib.respCode(res, 201);
}

