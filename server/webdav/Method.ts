import copy from "./processor_local/copy";
import deleteFunc from "./processor_local/delete";
import get from "./processor_local/get";
import head from "./processor_local/head";
import lock from "./processor_local/lock";
import move from "./processor_local/move";
import options from "./processor_local/options";
import post from "./processor_local/post";
import propfind from "./processor_local/propfind";
import proppatch from "./processor_local/proppatch";
import trace from "./processor_local/trace";
import unlock from "./processor_local/unlock";
import put from "./processor_local/put";
import mkcol from "./processor_local/mkcol";
// import copy from "./processor/copy";

const ref = {
    'GET': get,
    'MOVE': move,
    'OPTIONS': options,
    'PROPFIND': propfind,
    'PUT': put,
    'MKCOL': mkcol,
    'DELETE': deleteFunc,
    'COPY': copy,
    //
    'HEAD': head,
    'LOCK': lock,
    'POST': post,
    'PROPPATCH': proppatch,
    'TRACE': trace,
    'UNLOCK': unlock,
};

export default ref;