import util from "util";
import {get as getConfig} from "../../ServerConfig";
import * as fp from "../../lib/FileProcessor";
import {mkLocalPath, mkRelPath} from "../../lib/FileProcessor";
import fs from "node:fs/promises";
import {col_node} from "../../../share/Database";
import NodeModel from "../../model/NodeModel";
import QueueModel from "../../model/QueueModel";
import {Dirent} from "fs";
import {splitQuery} from "../../lib/ModelHelper";
import SettingModel from "../../model/SettingModel";

const exec = util.promisify(require('child_process').exec);

export default class {
    static async run(payload: { [key: string]: any }): Promise<any> {
        const pathConfig = getConfig('path');
        const curJobLs = await (new QueueModel).where('type', 'sync/run').whereIn('status', [1, 2]).select();
        if (curJobLs.length > 1) throw new Error('sync job running');
        await syncDir(pathConfig.root, fp.rootNode);
        // await syncDir(Buffer.from(pathConfig.root), fp.rootNode);
    }

    static async check(payload: { [key: string]: any }): Promise<any> {
        const pathConfig = getConfig('path');
        const nodeIdQLs = await (new NodeModel).select(['id']);
        const nodeIdLs: number[] = [];
        nodeIdQLs.forEach(n => nodeIdLs.push(n.id));
        //
        const nodeArr = await splitQuery<col_node>(NodeModel, nodeIdLs, null, [
            'id', 'title', 'node_path', 'file_index', 'node_id_list', 'type',
        ]);
        // const nodeMap = new Map<string, col_node>;
        // nodeArr.forEach((node) => nodeMap.set(node.node_path, node));
        //
        const rawFileSet = await scanLocalDir(pathConfig.root);
        const previewFileSet = await scanLocalDir(pathConfig.preview);
        const normalFileSet = await scanLocalDir(pathConfig.normal);
        const coverFileSet = await scanLocalDir(pathConfig.cover);
        const extStt = {
            //db中存在raw中不存在
            db: [] as string[],
            //raw中存在db中不存在
            raw: [] as string[],
            //preview中存在db中不存在
            preview: [] as string[],
            //normal中存在db中不存在
            normal: [] as string[],
            //cover中存在db中不存在
            cover: [] as string[],
        };
        const dbFileSet = new Set<string>;
        nodeArr.forEach(node => {
            const localRawPath = mkLocalPath(mkRelPath(node, 'raw'));
            if (!rawFileSet.has(localRawPath)) {
                extStt.db.push(localRawPath);
                return;
            }
            if (node.type == 'directory') {
                dbFileSet.add(localRawPath);
            } else {
                if (node.file_index.raw)
                    dbFileSet.add(localRawPath);
                if (node.file_index.preview)
                    dbFileSet.add(mkLocalPath(mkRelPath(node, 'preview', node.file_index.preview.ext)));
                if (node.file_index.normal)
                    dbFileSet.add(mkLocalPath(mkRelPath(node, 'normal', node.file_index.normal.ext)));
                if (node.file_index.cover)
                    dbFileSet.add(mkLocalPath(mkRelPath(node, 'cover', node.file_index.cover.ext)));
            }
        });
        rawFileSet.forEach(f => {
            if (!dbFileSet.has(f)) {
                extStt.raw.push(f);
            }
        });
        previewFileSet.forEach(f => {
            if (!dbFileSet.has(f)) {
                extStt.preview.push(f);
            }
        });
        normalFileSet.forEach(f => {
            if (!dbFileSet.has(f)) {
                extStt.normal.push(f);
            }
        });
        coverFileSet.forEach(f => {
            if (!dbFileSet.has(f)) {
                extStt.cover.push(f);
            }
        });
        const ifExs = await new SettingModel().where('name', '_t_file_check_result')
            .order('id', 'desc').first();
        if (ifExs) {
            await new SettingModel().where('id', ifExs.id).update({
                name: '_t_file_check_result',
                value: extStt,
                status: 1,
            });
        } else {
            await new SettingModel().insert({
                name: '_t_file_check_result',
                value: extStt,
                status: 1,
            });
        }

    }
}

async function scanLocalDir(localRoot: string): Promise<Set<string>> {
    const config = getConfig();
    const resPath = new Set<string>();
    let subFileLs: Dirent[];
    try {
        subFileLs = await fs.readdir(localRoot, {encoding: 'utf-8', withFileTypes: true});
    } catch (e) {
        // throw new Error(`cannot read dir: ${localRoot}`)
        console.error(`cannot read dir: ${localRoot}`);
        return resPath;
    }
    for (let i1 = 0; i1 < subFileLs.length; i1++) {
        //
        if (config.import_ignore.indexOf(subFileLs[i1].name) !== -1) continue;
        if (config.path.prefix_temp == subFileLs[i1].name) continue;
        if (config.path.prefix_preview == subFileLs[i1].name) continue;
        if (config.path.prefix_normal == subFileLs[i1].name) continue;
        if (config.path.prefix_cover == subFileLs[i1].name) continue;
        //
        const subPath = localRoot + '/' + subFileLs[i1].name;
        resPath.add(subPath);
        if (subFileLs[i1].isDirectory()) {
            const subSet = await scanLocalDir(subPath);
            subSet.forEach(s => resPath.add(s));
        }
    }
    return resPath;
}

/**
 * @notice readdir在一定版本下不能很好的支持emoji字符，不行就换一个
 * xftp传输文件时候emoji处理不好
 *
 * | file     | sys      | trans     | ls success | node success |
 * | -------- | -------- | --------- | ---------- | ------------ |
 * | win      | win      |           |            |              |
 * | win      | wsl      |           | 1          |              |
 * | wsl      | wsl      | cp        | 1          |              |
 * | wsl      | wsl      | xftp      | 0          |              |
 * | wsl      | wsl      | winscp    | 1          | 1            |
 * | synology | synology | xftp      | 0          |              |
 * | synology | synology | filezilla | 1          |              |
 * */
async function syncDir(localRoot: string, rootNode: col_node) {
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
            await fp.rename(
                localRoot + '/' + subFileLs[i1].name,
                localRoot + '/' + fTitle
            );
            subFileLs[i1].name = fTitle;
        }
        //排除多余的文件
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
        } else {
            //更新时间大于导入时间的需要重新更新
            if (curNode.type != 'directory') {
                const localStats = await fs.stat(fPath);
                const updateTime = new Date(ifExs.time_update);
                if (localStats.mtime.valueOf() >= updateTime.valueOf()) {
                    console.info(
                        'file modified, rebuild now: ',
                        ifExs.title,
                        ifExs.time_update,
                        updateTime,
                        updateTime.valueOf(),
                        localStats.mtime,
                        localStats.mtime.valueOf(),
                    )
                    await (new QueueModel).insert({
                        type: 'file/rebuild',
                        payload: {id: curNode.id},
                        status: 1,
                    });
                }
            }
        }
        if (curNode.type == 'directory') {
            await syncDir(fPath, curNode);
        }
    }
    //
    for (let i1 = 0; i1 < subNodeLs.length; i1++) {
        const curNode = subNodeLs[i1];
        if (curSubNodeTitleSet.has(curNode.title)) continue;
        await fp.rmReal(curNode);
    }
}
