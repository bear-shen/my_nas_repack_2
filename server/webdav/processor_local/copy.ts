import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/LocalFileProcessor";
import { getRelPath, getRequestFile, respCode } from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    //
    let overwrite = false;
    if (req.headers.overwrite && (req.headers.overwrite as string).toUpperCase() === 'T') {
        overwrite = true;
    }
    //
    const targetRelPath = getRelPath((req.headers.destination as string), req.headers.host, res);
    if (!targetRelPath) return;
    const ifExs = fp.stat(targetRelPath);
    if (ifExs && !overwrite) return respCode(409, res);
    // 409
    fp.cp(relPath, targetRelPath);
    return respCode(201, res);
}

