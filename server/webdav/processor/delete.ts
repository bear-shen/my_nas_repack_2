import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/LocalFileProcessor";
import { getRelPath, getRequestFile, respCode } from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    fp.rm(relPath);
    return respCode(204, res);
}

