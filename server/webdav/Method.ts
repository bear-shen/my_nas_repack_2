// import copy from "./processor_local/copy";
// import deleteFunc from "./processor_local/delete";
// import get from "./processor_local/get";
import head from "./processor_local/head";
// import lock from "./processor_local/lock";
// import move from "./processor_local/move";
// import options from "./processor_local/options";
// import post from "./processor_local/post";
import propfind from "./processor_local/propfind";
// import proppatch from "./processor_local/proppatch";
// import trace from "./processor_local/trace";
// import unlock from "./processor_local/unlock";
import put from "./processor_local/put";
import mkcol from "./processor_local/mkcol";
// import copy from "./processor/copy";
import { IncomingMessage, ServerResponse } from 'http';

const ref = {
    // 'GET': get,//@todo
    // 'MOVE': move,//@todo
    // 'OPTIONS': options,//@todo
    'PROPFIND': propfind,
    'PUT': put,//@todo
    'MKCOL': mkcol,//@todo
    // 'DELETE': deleteFunc,//@todo
    // 'COPY': copy,//@todo
    //
    'HEAD': head,
    // 'LOCK': lock,//@todo
    // 'POST': post,//@todo
    // 'PROPPATCH': proppatch,//@todo
    // 'TRACE': trace,//@todo
    // 'UNLOCK': unlock,//@todo
} as { [key: string]: (req: IncomingMessage, res: ServerResponse) => any };

export default ref;