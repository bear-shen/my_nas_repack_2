import {IncomingMessage, ServerResponse} from "http";
import * as fp from "../../lib/FileProcessor";
import {mkRelPath} from "../../lib/FileProcessor";
import * as Config from "../../Config";
import {getRelPath, respCode, setResponseFile} from '../Lib';
import {col_node} from '../../../share/Database';
import fsNp from "fs";

export default async function (req: IncomingMessage, res: ServerResponse) {
    const relPath = getRelPath(req.url, req.headers.host, res);
    // console.info(relPath);
    if (typeof relPath != 'string') return;
    const node = await fp.get(relPath);
    if (!node) return respCode(404, res);
    if (node.type === 'directory') return await printDir(node, res);

    //res.statusCode = 206;
    if (!node?.file_index?.raw) return respCode(404, res);
    const raw = node.file_index.raw;
    let bufFrom = 0;
    let bufTo = raw.size;
    if (req.headers.range) {
        const rngArr = req.headers.range.split('=');
        if (rngArr.length > 1) {
            const byteArr = rngArr[1].split('-');
            //不知道为什么会有from=to的请求...
            if (byteArr.length === 2 && byteArr[0] !== byteArr[1]) {
                bufFrom = Number.parseInt(byteArr[0]);
                bufTo = Number.parseInt(byteArr[1]);
                if (bufTo > raw.size) {
                    bufTo = raw.size;
                }
            }
        }
    }
    if (bufFrom === 0 && bufTo === raw.size) {
        res.statusCode = 200;
    } else {
        res.statusCode = 206;
    }
    //
    const rawPath = fp.mkLocalPath(mkRelPath(node));
    const rs = await fsNp.createReadStream(rawPath, {
        autoClose: true,
        start: bufFrom,
        end: bufTo,
    });
    await setResponseFile(rs, res);
    return;
}

async function printDir(curNode: col_node, res: ServerResponse) {
    const fLs = await fp.ls(curNode.id);
    const tbLs = [] as string[];
    // const pathArr = [] as string[];
    //
    // nodePathLs.forEach(node => node.id ? pathArr.push('/' + node.title) : null)
    const webdavRoot = Config.get().path.webdav;

    //
    if (curNode.id) {
        // const parPathArr = pathArr.slice(0, pathArr.length - 1);
        const parentNode = await fp.get(curNode.id_parent);
        if (parentNode) {
            const parentPath = fp.mkRelPath(parentNode);
            tbLs.push(`<tr>
        <td><a href="${webdavRoot}/${encodeURI(parentPath)}">../</a></td>
        <td>0</td><td>directory</td><td>${parentNode.time_create}</td><td>${parentNode.time_update}</td>
        </tr>`);
        }
    }
    //
    fLs.forEach(f => {
        //        <td><a href="${Config.path.webdav + encodeURI(f.path)}">${f.name}</a></td>
        tbLs.push(`<tr>
        <td><a href="${webdavRoot}/${encodeURI(fp.mkRelPath(f))}">${f.title}</a></td>
        <td>${f?.file_index?.raw?.size ?? 0}</td>
        <td>${f.type}</td><td>${f.time_create}</td><td>${f.time_update}</td>
        </tr>`);
    })
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.write('<html><body>')
    res.write(updDOM)
    res.write('<table style="width:100%;">');
    res.write(`<tr>
        <td>title</td>
        <td>size</td><td>type</td><td>created</td><td>modified</td>
        </tr>`);
    res.write(tbLs.join(''));
    res.write('</table></body></html>');
}

const updDOM = `<script>
      function put() {
        console.info("PUT");
        const fileDOM = document.getElementById("file");
        if (!fileDOM.files || !fileDOM.files.length) return;
        const file = fileDOM.files[0];
        console.info(file);
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState !== 4) return;
            location.reload();
        };
        xmlHttp.open("PUT", location.pathname.replace(/\\\/$/,'') +'/'+ encodeURI(file.name), true);
        xmlHttp.send(file);
      }
    </script><form>
      <input type="file" id="file" />
      <button type="button" onclick="put()">submit</button>
    </form>`;

