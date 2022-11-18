import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/FileProcessor";
import ServerConfig from "../../ServerConfig";
import { getRelPath, getRequestFile, respCode, setResponseFile } from '../Lib';
import { NodeCol } from '../../../share/Database';

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const nodeLs = await fp.relPath2node(relPath);
    if (!nodeLs) return respCode(404, res);
    const node = nodeLs[nodeLs.length - 1];
    if (node.type === 'directory') return await printDir(node, nodeLs, res);

    //res.statusCode = 206;
    const nodeStat = await fp.stat(node);
    const file = nodeStat.file.raw;

    let bufFrom = 0;
    let bufTo = file.size;
    if (req.headers.range) {
        const rngArr = req.headers.range.split('=');
        if (rngArr.length > 1) {
            const byteArr = rngArr[1].split('-');
            //不知道为什么会有from=to的请求...
            if (byteArr.length === 2 && byteArr[0] !== byteArr[1]) {
                bufFrom = Number.parseInt(byteArr[0]);
                bufTo = Number.parseInt(byteArr[1]);
                if (bufTo > file.size) {
                    bufTo = file.size;
                }
            }
        }
    }
    if (bufFrom === 0 && bufTo === file.size) {
        res.statusCode = 200;
    } else {
        res.statusCode = 206;
    }
    //
    const rs = await fp.get(node, bufFrom, bufTo);
    await setResponseFile(rs, res);
    return;
}

async function printDir(relPath: NodeCol, nodeLs: NodeCol[], res: ServerResponse) {
    const fLs = await fp.ls(relPath.id);
    const tbLs = [] as string[];
    const pathArr = [] as string[];
    nodeLs.forEach(node => node.id ? pathArr.push('/' + node.title) : null)
    fLs.forEach(f => {
        //        <td><a href="${ServerConfig.path.webdav + encodeURI(f.path)}">${f.name}</a></td>
        tbLs.push(`<tr>
        <td><a href="${ServerConfig.path.webdav}${encodeURI(pathArr.join('/'))}/${encodeURI(f.title)}">${f.title}</a></td>
        <td>${f?.file?.raw?.size ?? 0}</td><td>${f.type}</td><td>${f.time_create}</td><td>${f.time_update}</td>
        </tr>`);
    })
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.write('<html><body><table style="width:100%;">');
    res.write(`<tr>
        <td>title</td>
        <td>size</td><td>type</td><td>created</td><td>modified</td>
        </tr>`);
    res.write(tbLs.join(''));
    res.write('</table></body></html>');
}


