import {IncomingMessage, ServerResponse} from "http";
import {Element, ElementCompact} from "xml-js";
import * as fp from "../../lib/FileProcessor";

import * as convert from 'xml-js';
import {ReadStream} from "fs";

/**
 * header
 * depth=1  当前目录加父目录
 * depth=0  当前目录
 * */

import {Buffer} from "buffer";
import Config from "../../ServerConfig";
import {getRelPath, getRequestBuffer, respCode} from "../Lib";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const nodeLs = await fp.relPath2node(relPath);
    if (!nodeLs) return respCode(404, res);
    const curNode = nodeLs[nodeLs.length - 1];
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
    let fileLs = [] as (fp.FileStat & { relPath: string })[];
    let dirPath = fp.getDir(relPath);
    for (let i1 = 0; i1 <= depth; i1++) {
        if (i1 === 0) {
            const fi = await fp.stat(curNode);
            if (!fi) return respCode(404, res);
            fileLs.push(Object.assign(fi, {relPath: `${dirPath}${fi.title === 'root' ? '' : '/' + fi.title}`}));
        } else if (i1 === 1) {
            const fl = await fp.ls(curNode.id);
            //if (fl) continue;
            fl.forEach(f => fileLs.push(Object.assign(f, {
                relPath: `${dirPath}/${f.title}`
            })));
        }
    }
    // console.info(fileLs);
    fileLs.forEach(f => {
        outputData.multistatus.response.push(buildRespNode(xmlLs, f))
    });
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
        'multistatus': {
            _attributes: {
                'xmlns:D': 'DAV:',
                'xmlns:ns1': "SAR:",
                'xmlns:ns0': "DAV:",
            },
            'response': [
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
            resourceType = {'collection': {}};
            break;
    }
    const availProp = {
        'creationdate': {_text: node.time_create},
        'getlastmodified': {_text: node.time_update},
        'executable': {_text: 'F'},
        'resourcetype': resourceType,
        'getcontenttype': {_text: mime},
        'getcontentlength': {_text: node.file?.raw?.size ?? 0},
    };
    const target = {
        _attributes: {
            'xmlns:lp1': 'DAV:',
            'xmlns:lp2': 'http://apache.org/dav/props/',
            'xmlns:g0': 'DAV:',
            'xmlns:g1': 'SAR:',
        },
        'href': {_text: Config.path.webdav + encodeURI(node.relPath),},
        'propstat': {
            'prop': {},
            'D:status': {_text: 'HTTP/1.1 200 OK',},
        },
    } as ElementCompact;
    for (let i1 = 0; i1 < xmlLs.length; i1++) {
        const propKey = xmlLs[i1] as keyof typeof availProp;
        if (availProp[propKey]) {
            target.propstat.prop[propKey] = availProp[propKey];
        }
    }
    return target;
}

