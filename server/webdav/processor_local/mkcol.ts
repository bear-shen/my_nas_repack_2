import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/LocalFileProcessor";
import { getRelPath, getRequestFile, respCode } from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req, res);
    if (!relPath) return;
    fp.mkdir(relPath);
    return respCode(201, res);
}

