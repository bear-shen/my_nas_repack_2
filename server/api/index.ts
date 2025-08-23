import http, {IncomingMessage, ServerResponse} from "http";
import * as Config from "../Config";
import {init} from "../startServer";
import Authorize from "./Authorize";
import formidable, {Fields, Files} from "formidable";
import Router from "./Router";
import {ParsedForm} from "./types";
import ORM from "../lib/ORM";


const server = http.createServer(async function (req: IncomingMessage, res: ServerResponse) {
    // console.info(new URL('http://www.baidu.com/aaa'));
    // console.info(req.method, req.headers);
    // console.info(req.url);
    //
    const config = Config.get();
    /*
    //想想好像并不涉及到跨域,直接去掉
    if (req.headers.origin) {
        const origin = config.origin ? config.origin : req.headers.origin;
        if (origin) {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Origin', origin);
            if (req.headers['access-control-request-headers'])
                res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        }
    }*/
    if (['POST', 'GET',].indexOf(req.method) === -1) {
        res.write('');
        res.end();
        return;
    }
    //
    const urlInfo = new URL(req.url, `http://${req.headers.host}`);
    const authResult = await Authorize.check(urlInfo, req);
    // console.info(authResult);
    if (!authResult) {
        res.write(JSON.stringify({
            'code': 10,
            'msg': 'no auth',
            'data': null,
        }));
        res.end();
        return;
    }
    // console.info('authInfo', authResult);
    //
    const data = await parseForm(req);
    data.uid = authResult === true ? 0 : authResult;
    //
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    let result = null;
    try {
        result = await Router(urlInfo, data, req, res);
        result = {
            'code': 0,
            'msg': 'success',
            'data': result,
        };
    } catch (e: any) {
        console.error((e as Error).stack);
        result = {
            'code': 100,
            'msg': `${(e as Error).name}: ${(e as Error).message}`,
            'data': config.public ? [] : (e as Error).stack,
        };
    }
    if (!res.writableEnded) {
        res.write(JSON.stringify(result));
        res.end();
    }
});

init().then(() => {
    const config = Config.get();
    server.listen(config.port.api);
    console.info('server now listen on:', config.port.api);
    console.info('temp dir:', config.path.temp);
    console.info('file dir:', config.path.root);
    //重置自增id，用于修复导入数据时的id混乱
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('auth','id'), coalesce(max(id), 1)) from auth;`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('favourite','id'), coalesce(max(id), 1)) from favourite;`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('favourite_group','id'), coalesce(max(id), 1)) from favourite_group;`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('node','id'), coalesce(max(id), 1)) from node;`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('queue','id'), coalesce(max(id), 1)) from queue;`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('rate','id'), coalesce(max(id), 1)) from rate;`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('settings','id'), coalesce(max(id), 1)) from "settings";`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('tag','id'), coalesce(max(id), 1)) from tag;`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('tag_group','id'), coalesce(max(id), 1)) from tag_group;`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('user','id'), coalesce(max(id), 1)) from "user";`);
    (new ORM).execute(`SELECT setval(pg_get_serial_sequence('user_group','id'), coalesce(max(id), 1)) from user_group;`);
});

function parseForm(req: IncomingMessage): Promise<ParsedForm> {
    return new Promise((resolve: any) => {
        //@see https://nodejs.org/en/knowledge/HTTP/servers/how-to-handle-multipart-form-data/
        //@see https://github.com/node-formidable/formidable/blob/master/src/Formidable.js
        const form = formidable({
            maxFileSize: 1024 * 1024 * 1024 * 1024,
        });
        // const form = new formidable().IncomingForm();
        form.parse(req, function (err: any, fields: Fields, files: Files) {
            // console.info(fields, files);
            resolve({fields, files, uid: false});
        });
    });
}
