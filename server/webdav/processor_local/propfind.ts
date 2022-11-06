import { IncomingMessage, ServerResponse } from "http";
import { Element, ElementCompact } from "xml-js";
import NodeModel from "../../model/NodeModel";
import FileModel from "../../model/FileModel";
import config from "../../Config";
import Lib from "../Lib";

const convert = require('xml-js');
import { ReadStream } from "fs";

/**
 * header
 * depth=1  当前目录加父目录
 * depth=0  当前目录
 * */

import { Buffer } from "buffer";

export default async function (req: IncomingMessage, res: ServerResponse) {
    // console.info('proc here, req:', body);
    const url = new URL(req.url, `http://${req.headers.host}`);
    let output = '';
    const outputData = getBase();
    /*if (body) {
     const content = convert.xml2js(body, {compact: true});
     console.info(content);
     outputData['D:multistatus']['D:response'].push(respErr(url.pathname, '404 Not Found'));
     //body不知道怎么处理
     return resp(res, outputData);
     }*/
    const rootPos = url.pathname.indexOf(config.webDavRoot);
    console.info(url.pathname, config.webDavRoot, rootPos);
    if (rootPos === -1) {
        outputData['D:multistatus']['D:response'].push(respErr(url.pathname, '404 Not Found'));
        //找不到根目录
        return resp(res, outputData);
    }
    const dirNode = await Lib.getCurNode(url) as NodeCol;
    if (!dirNode) {
        outputData['D:multistatus']['D:response'].push(respErr(url.pathname, '404 Not Found'));
        //找不到节点
        return resp(res, outputData);
    }
    // const dirId = dirIdArr[dirIdArr.length - 1];
    // if (dirNode.id === 0)

    if (dirNode.type !== 'directory') {
        const curFile = await (new FileModel).where('id', dirNode.id).first();
        outputData['D:multistatus']['D:response'].push(buildRespNode(url, dirNode, false, curFile));
        //文件信息
        return resp(res, outputData);
    }
    outputData['D:multistatus']['D:response'].push(buildRespNode(url, dirNode, false));
    const depth = Number.parseInt(req.headers.depth ? req.headers.depth as string : '0');
    if (!depth || dirNode.type !== 'directory') {
        //depth=0 或者是个文件的话，只返回当前节点
        return resp(res, outputData);
    }
    const nodeList = await (new NodeModel).where('id_parent', dirNode.id).where('status', 1).select();
    const rawFileSet = new Set<number>();
    nodeList.forEach(node => {
        if (node.index_file_id && node.index_file_id.raw)
            rawFileSet.add(node.index_file_id.raw)
    });
    const fileMap = new Map<number, FileCol>();
    if (rawFileSet.size) {
        const fileList = await (new FileModel).whereIn('id', Array.from(rawFileSet)).select();
        fileList.forEach(file => fileMap.set(file.id, file));
    }
    nodeList.forEach(
        node => {
            let file: FileCol;
            if (node.type !== 'directory')
                file = fileMap.get(node.index_file_id.raw);
            outputData['D:multistatus']['D:response'].push(buildRespNode(url, node, true, file));
        }
    );
    //返回当前节点和当前目录下的节点
    return resp(res, outputData);
}

function resp(res: ServerResponse, outputData: ElementCompact) {
    // console.info(JSON.stringify(outputData));
    // const output = convert.js2xml(outputData, {compact: true, spaces: 4});
    const output = convert.js2xml(outputData, { compact: true, });
    if (output) res.setHeader('Content-Type', 'text/xml; charset="utf-8"');
    res.statusCode = 207;
    // console.info(output);
    res.write(output);
    res.end();
}

function getBase(): ElementCompact {
    return {
        _declaration: { _attributes: { version: "1.0", encoding: "utf-8" } },
        'D:multistatus': {
            _attributes: { 'xmlns:D': 'DAV:', },
            'D:response': [
                // {
                //     _attributes: {'xmlns:lp1': 'DAV:', 'xmlns:lp2': 'http://apache.org/dav/props/',},
                //     'D:href': {_text: '/dav/',},
                //     'D:propstat': {
                //         'D:prop': {
                //             'lp1:resourcetype': {'D:collection': {}},
                //             'lp1:creationdate': {_text: '2022-04-23T07:04:19Z'},
                //             'lp1:getlastmodified': {_text: 'Sat, 23 Apr 2022 07:04:19 GMT'},
                //             'lp1:getetag': {_text: '"1000-5dd4cf3b269c7"'},
                //             'D:getcontenttype': {_text: 'httpd/unix-directory'},
                //         },
                //         'D:status': {_text: 'HTTP/1.1 200 OK',},
                //     },
                // },
            ]
        }
    } as ElementCompact;
}


function respErr(path: string, msg: string): ElementCompact {
    return {
        _attributes: { 'xmlns:g0': 'DAV:', },
        'D:href': { _text: path, },
        'D:propstat': {
            // 'D:prop': {
            //     'g0:quota-available-bytes': {},
            //     'g0:quota-used-bytes': {},
            // },
            'D:status': { _text: `HTTP/1.1 ${msg}`, },
        },
    } as ElementCompact;
}


function buildRespNode(url: URL, node: NodeCol, withPathName: boolean = true, file?: FileCol) {
    let mime = '';
    let resourceType = {};
    switch (node.type) {
        case "binary":
        case "text":
        case "image":
        case "subtitle":
        case "video":
        case "audio":
            mime = node.type;
            resourceType = {};
            break;
        case "directory":
            mime = 'httpd/unix-directory';
            resourceType = { 'D:collection': {} };
            break;
    }
    const target = {
        _attributes: { 'xmlns:lp1': 'DAV:', 'xmlns:lp2': 'http://apache.org/dav/props/', },
        'D:href': { _text: `${url.pathname}${withPathName ? encodeURIComponent(node.title) : ''}`, },
        'D:propstat': {
            'D:prop': {
                'lp1:creationdate': { _text: node.time_create },
                'lp1:getlastmodified': { _text: node.time_update },
                'lp1:getetag': { _text: `"1000-${node.id}${(new Date()).valueOf()}"` },
                // 'D:supportedlock': {
                //     'D:lockentry': [{
                //         'D:lockscope': {
                //             'D:exclusive': {},
                //         },
                //         'D:locktype': {
                //             'D:write': {},
                //         },
                //     }, {
                //         'D:lockscope': {
                //             'D:shared': {},
                //         },
                //         'D:locktype': {
                //             'D:write': {},
                //         },
                //     },]
                // },
                // 'D:lockdiscovery': {},
                // 'D:getcontenttype': {_text: 'httpd/unix-directory'},
                // 'lp1:resourcetype': {'D:collection': {}},
                'lp2:executable': { _text: 'F' },
                'lp1:resourcetype': resourceType,
                'D:getcontenttype': { _text: mime },
                'lp1:getcontentlength': { _text: file ? file.size : 0 },
            },
            'D:status': { _text: 'HTTP/1.1 200 OK', },
        },
    } as ElementCompact;
    return target;
}

