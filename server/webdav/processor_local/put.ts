import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/LocalFileProcessor";
import { getRelPath, getRequestFile, respCode } from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req, res);
    if (!relPath) return;
    const tmpFilePath = await getRequestFile(req, res);
    fp.put(tmpFilePath, relPath);
    return respCode(201, res);
}

