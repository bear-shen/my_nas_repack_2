import util from "util";
import NodeModel from "../../model/NodeModel";
import * as fp from "../../lib/FileProcessor";
import Buffer from "buffer";
import * as https from "https";
import {RequestOptions} from "https";
import http from "http";
import {col_node} from "../../../share/Database";
import QueueModel from "../../model/QueueModel";
import fs from "node:fs/promises";

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
                .whereRaw('find_in_set(?,node_id_list)', root.id)
                .select();
        } else {
            nodeLs = [root];
        }
        for (let i1 = 0; i1 < nodeLs.length; i1++) {
            const node = nodeLs[i1];
            if (!node.file_index) continue;
            if (!node.file_index.raw) continue;
            if (!node.file_index.normal) continue;
            const rawLocalPath = fp.mkLocalPath(fp.mkRelPath(node));
            await fs.rm(rawLocalPath, {
                // recursive:true,
                force: true,
            });
            const targetIndex = node.file_index;
            delete targetIndex.raw;
            await (new NodeModel).where('id', node.id).update({
                file_index: targetIndex,
            });
            // const ifExs = await fp.checkOrphanFile(rawFId)
            // if (ifExs) continue;
            // await fp.rmReal(rawFId);
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
        // if (!root.tag_id_list.length) return;
        //
        const dirLs = await (new NodeModel)
            .where('id_parent', root.id)
            .where('type', 'directory')
            .select();
        dirLs.push(root);
        // console.info(dirLs);
        if (!dirLs.length) return;
        for (let i1 = 0; i1 < dirLs.length; i1++) {
            const dir = dirLs[i1];
            // if (!dir.tag_id_list) continue;
            // if (!dir.tag_id_list.length) continue;
            const subLs = await (new NodeModel)
                .where('id_parent', dir.id)
                .where('type', 'directory')
                .select();
            for (let i2 = 0; i2 < subLs.length; i2++) {
                const sub = subLs[i2];
                const tagIdSet: Set<number> = new Set(sub.tag_id_list);
                dir.tag_id_list.forEach(id => tagIdSet.add(id));
                await (new NodeModel)
                    .where('id', sub.id)
                    .update({
                        tag_id_list: Array.from(tagIdSet),
                    });
                await (new QueueModel).insert({
                    type: 'file/rebuildIndex',
                    payload: {id: sub.id},
                    status: 1,
                });
            }
        }
        return;
    }

    static async importEHT(payload: { [key: string]: any }): Promise<any> {
        const cmd = `php ${__dirname}/../../../../../resource/getEHTTag.php ${payload.id}`;
        const {stdout, stderr} = await exec(cmd);
        // console.info(stdout, stderr);
        await (new QueueModel).insert({
            type: 'file/rebuildIndex',
            payload: {id: parseInt(payload.id)},
            status: 1,
        });
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