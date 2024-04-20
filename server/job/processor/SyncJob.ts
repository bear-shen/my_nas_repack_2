import util from "util";
import {get as getConfig} from "../../ServerConfig";
import * as fp from "../../lib/FileProcessor";
import fs from "node:fs/promises";
import {col_node} from "../../../share/Database";
import NodeModel from "../../model/NodeModel";
import QueueModel from "../../model/QueueModel";
import {Dirent} from "fs";

const exec = util.promisify(require('child_process').exec);

export default class {
    static async run(payload: { [key: string]: any }): Promise<any> {
        const pathConfig = getConfig('path');
        await scanDir(pathConfig.root, fp.rootNode);
        // await scanDir(Buffer.from(pathConfig.root), fp.rootNode);
    }
}

/**
 * @notice readdir不能很好的支持emoji字符
 * buffer读取可以认为正常（能遍历但是二进制不同），且无法过滤标题
 * */
async function scanDir(localRoot: string, rootNode: col_node) {
    const config = getConfig();
    // console.info(20, localRoot);
    let subFileLs: Dirent[];
    try {
        subFileLs = await fs.readdir(localRoot, {encoding: 'utf-8', withFileTypes: true});
    } catch (e) {
        // throw new Error(`cannot read dir: ${localRoot}`)
        console.error(`cannot read dir: ${localRoot}`);
        return;
    }
    const subNodeLs = await fp.ls(rootNode);
    // const subNodeMap: Map<string, col_node> = new Map();
    // subNodeLs.forEach(node => {
    //     subNodeMap.set(node.title, node);
    // });
    const curSubNodeTitleSet: Set<string> = new Set();
    for (let i1 = 0; i1 < subFileLs.length; i1++) {
        const fTitle = fp.titleFilter(subFileLs[i1].name);
        //规范化文件名
        if (subFileLs[i1].name != fTitle) {
            await fp.rename(localRoot + '/' + subFileLs[i1].name, localRoot + '/' + fTitle)
            subFileLs[i1].name = fTitle;
        }
        //
        if (config.import_ignore.indexOf(fTitle) !== -1) continue;
        if (config.path.prefix_temp == fTitle) continue;
        if (config.path.prefix_preview == fTitle) continue;
        if (config.path.prefix_normal == fTitle) continue;
        if (config.path.prefix_cover == fTitle) continue;
        //
        curSubNodeTitleSet.add(fTitle);
        const fPath = localRoot + '/' + fTitle;
        // console.info(fPath, fTitle,)
        const fStat = subFileLs[i1];
        // const fStat = await fs.stat(fPath);
        if (!(fStat.isDirectory() || fStat.isFile())) continue;
        // console.warn(45, rootNode, fTitle);
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
                file_index: {},
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
            const insRes = await (new NodeModel).insert(ins);
            ins.id = insRes.insertId;
            curNode = ins;
        } else {
            curNode = ifExs;
        }
        if (!ifExs) {
            if (curNode.type != 'directory')
                await (new QueueModel).insert({
                    type: 'file/build',
                    payload: {id: curNode.id},
                    status: 1,
                });
            await (new QueueModel).insert({
                type: 'file/buildIndex',
                payload: {id: curNode.id},
                status: 1,
            });
        }
        if (curNode.type == 'directory') {
            await scanDir(fPath, curNode);
        }
    }
    //
    for (let i1 = 0; i1 < subNodeLs.length; i1++) {
        const curNode = subNodeLs[i1];
        if (curSubNodeTitleSet.has(curNode.title)) continue;
        await fp.rmReal(curNode);
    }
}
