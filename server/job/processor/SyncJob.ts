import util from "util";
import {get as getConfig} from "../../ServerConfig";
import * as fp from "../../lib/FileProcessor";
import fs from "node:fs/promises";
import {col_node} from "../../../share/Database";
import NodeModel from "../../model/NodeModel";
import QueueModel from "../../model/QueueModel";

const exec = util.promisify(require('child_process').exec);

export default class {
    static async run(payload: { [key: string]: any }): Promise<any> {
        const pathConfig = getConfig('path');
        await scanDir(pathConfig.root, fp.rootNode);
    }
}

async function scanDir(localRoot: string, rootNode: col_node) {
    const fNameLs = await fs.readdir(localRoot);
    const subNodeLs = await fp.ls(rootNode);
    // const subNodeMap: Map<string, col_node> = new Map();
    // subNodeLs.forEach(node => {
    //     subNodeMap.set(node.title, node);
    // });
    const curSubNodeTitleSet: Set<string> = new Set();
    for (let i1 = 0; i1 < fNameLs.length; i1++) {
        const fTitle = fp.titleFilter(fNameLs[i1]);
        curSubNodeTitleSet.add(fTitle);
        const fPath = localRoot + '/' + fTitle;
        const fStat = await fs.stat(fPath);
        if (!(fStat.isDirectory() || fStat.isFile())) continue;
        const ifExs = await fp.ifTitleExist(rootNode, fTitle);
        let curNode: col_node;
        if (!ifExs) {
            const ins: col_node = {
                id_parent: rootNode.id,
                title: fTitle,
                description: '',
                node_id_list: [...rootNode.node_id_list, rootNode.id],
                node_path: fp.mkRelPath(rootNode),
                status: 1,
                building: 0,
            };
            if (fStat.isDirectory()) {
                ins.type = 'directory';
            }
            if (fStat.isFile()) {
                ins.type = fp.getType(fp.extension(fTitle));
                ins.file_index = {
                    raw: {size: 0, checksum: [],},
                };
            }
            await (new NodeModel).insert(ins);
            ins.id = await (new NodeModel).lastInsertId();
            curNode = ins;
        } else {
            curNode = ifExs;
        }
        if (curNode.type != 'directory')
            (new QueueModel).insert({
                type: 'file/build',
                payload: {id: curNode.id},
                status: 1,
            });
        (new QueueModel).insert({
            type: 'file/buildIndex',
            payload: {id: curNode.id},
            status: 1,
        });
        if (curNode.type == 'directory') {
            scanDir(fPath, curNode);
        }
    }
    for (let i1 = 0; i1 < subNodeLs.length; i1++) {
        const curNode = subNodeLs[i1];
        if (curSubNodeTitleSet.has(curNode.title)) continue;
        fp.rmReal(curNode);
    }
}
