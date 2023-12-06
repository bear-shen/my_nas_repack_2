import util from "util";
import {get as getConfig} from "../../ServerConfig";
import NodeModel from "../../model/NodeModel";
import * as fp from "../../lib/FileProcessor";
import {Buffer} from "buffer";
import * as https from "https";
import {RequestOptions} from "https";
import http from "http";
import {col_node} from "../../../share/Database";

const exec = util.promisify(require('child_process').exec);

class ExtJob {
    static async rmRaw(payload: { [key: string]: any }): Promise<any> {
        // const config = getConfig();
        const rootId = payload.id;
        const root = await (new NodeModel).where('id', rootId).first();
        if (!root) throw new Error('root not found');
        let nodeLs: col_node[] = [];
        if (root.type === 'directory') {
            nodeLs = await (new NodeModel)
                .whereRaw('find_in_set(?,list_node)', root.id)
                .select();
        } else {
            nodeLs = [root];
        }
        for (let i1 = 0; i1 < nodeLs.length; i1++) {
            const node = nodeLs[i1];
            if (!node.index_file_id) continue;
            if (!node.index_file_id.raw) continue;
            if (!node.index_file_id.normal) continue;
            if (node.index_file_id.normal === node.index_file_id.raw) continue;
            const rawFId = node.index_file_id.raw;
            node.index_file_id.raw = node.index_file_id.normal;
            await (new NodeModel).where('id', node.id).update({
                index_file_id: node.index_file_id,
            });
            const ifExs = await fp.checkOrphanFile(rawFId)
            if (ifExs) continue;
            await fp.rmReal(rawFId);
        }
        return;
    }

    static async cascadeTag(payload: { [key: string]: any }): Promise<any> {
        // const config = getConfig();
        const rootId = payload.id;
        let root = null;
        if (rootId) {
            root = await (new NodeModel).where('id', rootId).first();
        } else {
            root = {id: 0, title: 'root'};
        }
        if (!root) throw new Error('root not found');
        // if (!root.list_tag_id.length) return;
        //
        const dirLs = await (new NodeModel).where('id_parent', root.id).select();
        // console.info(dirLs);
        if (!dirLs.length) return;
        for (let i1 = 0; i1 < dirLs.length; i1++) {
            const dir = dirLs[i1];
            // if (!dir.list_tag_id) continue;
            // if (!dir.list_tag_id.length) continue;
            const subLs = await (new NodeModel)
                .where('id_parent', dir.id)
                .where('type', 'directory')
                .select();
            for (let i2 = 0; i2 < subLs.length; i2++) {
                const sub = subLs[i2];
                const tagIdSet: Set<number> = new Set(sub.list_tag_id);
                dir.list_tag_id.forEach(id => tagIdSet.add(id));
                await (new NodeModel)
                    .where('id', sub.id)
                    .update({
                        list_tag_id: Array.from(tagIdSet),
                    });
            }
        }
        return;
    }

    static async importEHT(payload: { [key: string]: any }): Promise<any> {
        const config = getConfig();
        const req = await sendRequest(
            'https://www.baidu.com/',
            null,
            {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': 'yey=ney',
                },
            });
        console.info(req);
    }
}

function sendRequest(url: string, post: string, options: RequestOptions) {
    let isHttps = url.indexOf('https:') === 0;
    let body = new Buffer('');
    return new Promise(async resolve => {
        let lib = isHttps ? https : http;
        const req = lib.request(url, options, (res) => {
            // console.log(`STATUS: ${res.statusCode}`);
            // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf-8');
            res.on('data', async (chunk) => {
                // console.log(`BODY: ${chunk}`);
                const sub = Buffer.from(chunk);
                body = Buffer.concat([body, sub]);
            });
            res.on('end', () => {
                console.log('No more data in response.');
                resolve(body.toString());
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        if (post) {
            req.write(post);
        }
        req.end();
    });
}


export default ExtJob;