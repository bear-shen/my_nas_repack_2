import util from "util";
import NodeModel from "../../model/NodeModel";
import {Buffer} from "buffer";
import * as https from "https";
import {RequestOptions} from "https";
import http from "http";
import QueueModel from "../../model/QueueModel";
import * as Config from "../../Config";

const exec = util.promisify(require('child_process').exec);

class ExtJob {

    static async cascadeTag(payload: { [key: string]: any }): Promise<any> {
        // const config = Config.get();
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


    static async syncBGMTag(payload: { [key: string]: any }): Promise<any> {

    }

    static async importEHTTag(payload: { [key: string]: any }): Promise<any> {
        const rootPath = Config.get('path.root');
        const cmd = `php ${__dirname}/../../../../resource/getEHTTag.php ${payload.id} >> ${rootPath}/php.log`;
        const {stdout, stderr} = await exec(cmd);
        // console.info(stdout, stderr);
        await (new QueueModel).insert({
            type: 'file/rebuildIndex',
            payload: {id: parseInt(payload.id)},
            status: 1,
        });
    }

    static async syncJRiverRate(payload: { [key: string]: any }): Promise<any> {
        const rootPath = Config.get('path.root');
        const cmd = `php ${__dirname}/../../../../resource/syncJriver.php ${payload.id_node} ${payload.uid} "${payload.payload}" >> ${rootPath}/php.log`;
        const {stdout, stderr} = await exec(cmd);
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
