import { IncomingMessage, ServerResponse } from "http";
import * as fp from "../../lib/LocalFileProcessor";
import ServerConfig from "../../ServerConfig";
import { getRelPath, getRequestFile, respCode, setResponseFile } from '../Lib';

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    if (!relPath) return;
    const ifExs = await fp.stat(relPath);
    if (!ifExs) return respCode(404, res);
    if (ifExs.isDir) return await printDir(relPath, res);
    if (!ifExs.isFile) return respCode(405, res);
    //res.statusCode = 206;
    //
    let bufFrom = 0;
    let bufTo = ifExs.size;
    if (req.headers.range) {
        const rngArr = req.headers.range.split('=');
        if (rngArr.length > 1) {
            const byteArr = rngArr[1].split('-');
            //不知道为什么会有from=to的请求...
            if (byteArr.length === 2 && byteArr[0] !== byteArr[1]) {
                bufFrom = Number.parseInt(byteArr[0]);
                bufTo = Number.parseInt(byteArr[1]);
                if (bufTo > ifExs.size) {
                    bufTo = ifExs.size;
                }
            }
        }
    }
    if (bufFrom === 0 && bufTo === ifExs.size) {
        res.statusCode = 200;
    } else {
        res.statusCode = 206;
    }
    //
    const rs = fp.get(relPath, bufFrom, bufTo);
    await setResponseFile(rs, res);
    return;
}

async function printDir(relPath: string, res: ServerResponse) {
    const fLs = await fp.ls(relPath);
    const tbLs = [] as string[];
    fLs.forEach(f => {
        //        <td><a href="${ServerConfig.path.webdav + encodeURI(f.path)}">${f.name}</a></td>
        tbLs.push(`<tr>
        <td><a href="${ServerConfig.path.webdav + f.path}">${f.name}</a></td>
        <td>${f.size}</td><td>${f.type}</td><td>${f.timeCreated}</td><td>${f.timeModified}</td>
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
