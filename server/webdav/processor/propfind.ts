import {IncomingMessage, ServerResponse} from "http";
import * as convert from "xml-js";
import {ElementCompact} from "xml-js";
import * as fp from "../../lib/FileProcessor";
import {get_sync as getConfigSync} from "../../ServerConfig";
import {getRelPath, getRequestBuffer, respCode} from "../Lib";

/**
 * header
 * depth=1  当前目录加父目录
 * depth=0  当前目录
 *
 * 不加d前缀winscp无法读取文件
 * path不加斜杠winscp无法识别目录
 * 日期不用utcstring/gmtstring winscp无法识别目录
 * 总结winscp吔屎

 * */

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    // console.info(relPath, req.url, req.headers.host,);
    if (!relPath) return;
    const nodeLs = await fp.relPath2node(relPath);
    // console.info(nodeLs);
    if (!nodeLs) return respCode(404, res);
    const curNode = nodeLs[nodeLs.length - 1];
    // console.info(curNode);
    //
    const outputData = getBase();
    // console.info(relPath);
    const xmlBuffer = await (await getRequestBuffer(req, res)).toString();
    const xmlData = convert.xml2js(xmlBuffer, {compact: true});
    const xmlLs = getXmlAttr(xmlData);
    // console.info(JSON.stringify(xmlData));
    //console.info(xmlLs);
    //
    let depth = Number.parseInt(req.headers.depth ? req.headers.depth as string : '0');
    // console.info(depth);
    let fileLs = [] as (fp.FileStat & { relPath: string })[];
    let dirPath = fp.getDir(relPath);
    for (let i1 = 0; i1 <= depth; i1++) {
        if (i1 === 0) {
            const fi = await fp.stat(curNode);
            if (!fi) return respCode(404, res);
            fileLs.push(Object.assign(fi, {relPath: `${dirPath}${fi.title === 'root' ? '' : '/' + fi.title}`}));
        } else if (i1 === 1) {
            const fl = await fp.ls(curNode.id);
            // console.info(curNode.id, fl);
            //if (fl) continue;
            fl.forEach(f => fileLs.push(Object.assign(f, {
                relPath: `${dirPath}/${f.title}`
                // relPath: `${dirPath}/dev`
            })));
        }
    }
    // console.info(fileLs);
    fileLs.forEach(f => {
        outputData['D:multistatus']['D:response'].push(buildRespNode(xmlLs, f))
    });
    // console.info(outputData);
    //
    return resp(res, outputData);
}

function resp(res: ServerResponse, outputData: ElementCompact) {
    // console.info(JSON.stringify(outputData));
    // const output = convert.js2xml(outputData, {compact: true, spaces: 4});
    const output = convert.js2xml(outputData, {compact: true,});
    if (output) res.setHeader('Content-Type', 'text/xml; charset="utf-8"');
    res.statusCode = 207;
    // console.info(output);
    res.write(output);
    res.end();
}

function getXmlAttr(xml: any): string[] {
    if (!xml.propfind) return [];
    if (!xml.propfind.prop) return [];
    const res = [];
    for (const key in xml.propfind.prop) {
        if (!Object.prototype.hasOwnProperty.call(xml.propfind.prop, key)) continue;
        res.push(key);
    }
    return res;
}

function getBase(): ElementCompact {
    return {
        _declaration: {_attributes: {version: "1.0", encoding: "utf-8"}},
        'D:multistatus': {
            _attributes: {
                'xmlns:D': 'DAV:',
                // 'xmlns:ns1': "SAR:",
                // 'xmlns:ns0': "DAV:",
            },
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


function buildRespNode(xmlLs: string[], node: (fp.FileStat & { relPath: string })) {
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
            resourceType = {'D:collection': {}};
            break;
    }
    const availProp = {
        'creationdate': {_text: (new Date(node.time_create)).toUTCString()},
        'getlastmodified': {_text: (new Date(node.time_update)).toUTCString()},
        'executable': {_text: 'F'},
        'resourcetype': resourceType,
        'getcontenttype': {_text: mime},
        'getcontentlength': {_text: node.file?.raw?.size ?? 0},
        'displayname': {_text: node.title},
    };
    if (node.type === 'directory') {
        delete availProp['getcontentlength'];
        delete availProp['getcontenttype'];
        delete availProp['executable'];
    }
    const target = {
        _attributes: {
            // 'xmlns:lp1': 'DAV:',
            // 'xmlns:lp2': 'http://apache.org/dav/props/',
            // 'xmlns:g0': 'DAV:',
            // 'xmlns:g1': 'SAR:',
        },
        'D:href': {
            _text:
                getConfigSync().path.webdav
                + encodeURI(node.relPath)
                //winscp不加这个无法识别为目录，这货不判断prop
                + (node.type === 'directory' ? '/' : '')
            ,
        },
        'D:propstat': {
            'D:prop': {} as { [key: string]: any },
            'D:status': {_text: 'HTTP/1.1 200 OK',},
        },
    } as ElementCompact;
    // console.info(xmlLs);
    if (xmlLs.length)
        for (let i1 = 0; i1 < xmlLs.length; i1++) {
            const key = xmlLs[i1] as keyof typeof availProp;
            if (availProp[key]) {
                target['D:propstat']['D:prop']['D:' + key] = availProp[key];
            }
        }
    else {
        for (const key in availProp) {
            if (!Object.prototype.hasOwnProperty.call(availProp, key)) continue;
            target['D:propstat']['D:prop']['D:' + key] = availProp[key as keyof typeof availProp];
        }
    }
    return target;
}

