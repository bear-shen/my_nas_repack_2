import { IncomingMessage, ServerResponse } from "http";

import { Buffer } from "buffer";
import Lib from "../Lib";
import { ReadStream } from "fs";

export default async function (req: IncomingMessage, bodyPath: string, res: ServerResponse) {
    res.setHeader(
        'Allow',
        [
            'OPTIONS',
            'GET',
            // 'HEAD',
            // 'POST',
            'DELETE',
            // 'TRACE',
            'PROPFIND',
            // 'PROPPATCH',
            'COPY',
            'MOVE',
            // 'LOCK',
            // 'UNLOCK',
            'PUT',
        ].join('')
    );
    res.setHeader('Server', 'nodejs-dav/0.1');
    res.setHeader('DAV', '1,2');
    // res.setHeader('DAV', '<http://apache.org/dav/propset/fs/1>');
    res.setHeader('MS-Author-Via', 'DAV');
    return Lib.respCode(res, 200);
}

