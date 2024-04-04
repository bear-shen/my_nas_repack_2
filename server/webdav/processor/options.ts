import {IncomingMessage, ServerResponse} from "http";

import * as fp from "../../lib/FileProcessor";
import {getRelPath, getRequestFile, respCode} from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    res.setHeader(
        'Allow',
        [
            'GET',
            'MOVE',
            'OPTIONS',
            'PROPFIND',
            'PUT',
            'MKCOL',
            'DELETE',
            'COPY',
        ].join('')
    );
    res.setHeader('Server', 'nodejs-dav/0.1');
    res.setHeader('DAV', '1,2');
    // res.setHeader('DAV', '<http://apache.org/dav/propset/fs/1>');
    // res.setHeader('MS-Author-Via', 'DAV');
    return respCode(200, res);
}