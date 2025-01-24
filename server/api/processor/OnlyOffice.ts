import http, {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import type {
    api_file_mkdir_req,
} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import * as fp from "../../lib/FileProcessor";
import QueueModel from "../../model/QueueModel";
import fs from "node:fs/promises";
import fsNp from "node:fs";
import * as https from "https";
import {RequestOptions} from "https";

export default class {
    async callback(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<void> {
        const request = data.fields as api_file_mkdir_req;
        //@see https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/
        const fields: {
            key: string,
            status: number,
            actions: [],
            token: string,
            history: { [key: string]: any },
            users: string[],
            url: string,
            changesurl: string,
            lastsave: string,
            notmodified: string,
        } = data.fields as any;
        const resTxt = JSON.stringify({error: 0});
        const keyArr = fields.key.split('_');
        if (!keyArr || keyArr.length < 2) {
            res.write(JSON.stringify({error: 1}));
            res.end();
            return;
        }
        const nodeId = parseInt(keyArr[0], 16);
        const node = await new NodeModel().where('id', nodeId).first();
        // console.info(fields.status);
        switch (fields.status) {
            default:
                break;
            case 2:
                // console.info('onsave');
                console.info(fields.url);
                const rawLocalPath = fp.mkLocalPath(fp.mkRelPath(node));
                const downResult = await downloadFile(fields.url, rawLocalPath + '.tmp');
                if (!downResult) {
                    res.write(JSON.stringify({error: 1}));
                    res.end();
                    try {
                        await fs.rm(rawLocalPath + '.tmp', {
                            force: true,
                        });
                    } catch (e) {
                        console.info(e);
                    }
                    return;
                }
                await fs.rm(rawLocalPath, {
                    // recursive:true,
                    force: true,
                });
                await fs.rename(rawLocalPath + '.tmp', rawLocalPath);
                (new QueueModel).insert({
                    type: 'file/checksum',
                    payload: {id: node.id},
                    status: 1,
                });
                // console.info('complete');
                break;
        }
        // console.info(data.fields.actions);
        // console.info('===================');
        // console.info(data.files);
        res.write(resTxt);
        res.end();
    }

};

function downloadFile(sourceUrl: string, targetPath: string): Promise<boolean> {
    return new Promise((resolve) => {
        // console.info(sourceUrl, targetPath);
        const file = fsNp.createWriteStream(targetPath, {
            autoClose: true,
        });
        let requestMethod: typeof https.request;
        let options: RequestOptions;
        if (sourceUrl.indexOf('https:') !== -1) {
            requestMethod = https.request;
            options = {rejectUnauthorized: false};
        } else {
            requestMethod = http.request;
            options = {};
        }
        const req = requestMethod(sourceUrl
            , options
            , (response) => {
                // console.info('req callback');
                if (response.statusCode !== 200) {
                    console.info(`download failed: ${response.statusCode}`);
                    //file.close();
                    resolve(false);
                }
                response.pipe(file);
                file.on('finish', () => {
                    console.info('file finish');
                    file.close();
                    resolve(true);
                });
            });
        req.on('finish', () => {
            console.info('req finish');
            //file.close();
            //resolve(true);
        })
        req.on('error', (error) => {
            console.info(`download failed:`, error);
            //file.close();
            resolve(false);
        });
        req.end();
    })
}
