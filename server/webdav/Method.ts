import copy from "./processor/copy";
import deleteFunc from "./processor/delete";
import get from "./processor/get";
import head from "./processor/head";
// import lock from "./processor/lock";
import move from "./processor/move";
// import options from "./processor/options";
// import post from "./processor/post";
import propfind from "./processor/propfind";
// import proppatch from "./processor/proppatch";
// import trace from "./processor/trace";
// import unlock from "./processor/unlock";
import put from "./processor/put";
import mkcol from "./processor/mkcol";
import { IncomingMessage, ServerResponse } from 'http';

const ref = {
    'GET': get,//@todo
    'MOVE': move,//@todo
    // 'OPTIONS': options,//@todo
    'PROPFIND': propfind,
    'PUT': put,//@todo
    'MKCOL': mkcol,//@todo
    'DELETE': deleteFunc,//@todo
    'COPY': copy,//@todo
    //
    'HEAD': head,
    // 'LOCK': lock,//@todo
    // 'POST': post,//@todo
    // 'PROPPATCH': proppatch,//@todo
    // 'TRACE': trace,//@todo
    // 'UNLOCK': unlock,//@todo
} as { [key: string]: (req: IncomingMessage, res: ServerResponse) => any };

export default ref;