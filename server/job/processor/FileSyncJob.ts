import util from "util";
import * as Config from "../../Config";
import * as fp from "../../lib/FileProcessor";
import {mkLocalPath, mkRelPath} from "../../lib/FileProcessor";
import fs from "node:fs/promises";
import type {col_node, col_node_file_index} from "../../../share/Database";
import NodeModel from "../../model/NodeModel";
import QueueModel from "../../model/QueueModel";
import {Dirent} from "fs";
import {splitQuery} from "../../lib/ModelHelper";
import SettingModel from "../../model/SettingModel";
import ORM from "../../lib/ORM";
import TagGroupModel from "../../model/TagGroupModel";
import TagModel from "../../model/TagModel";

const exec = util.promisify(require('child_process').exec);


export default class {
    static async local2db(payload: { [key: string]: any }): Promise<any> {
        const pathConfig = Config.get('path');
        const curJobLs = await (new QueueModel).whereIn('type', ['sync/local2db', 'sync/db2local',]).whereIn('status', [1, 2]).select();
        if (curJobLs.length > 1) throw new Error('sync job running');
        await syncDir(pathConfig.root, fp.rootNode);
        // await syncDir(Buffer.from(pathConfig.root), fp.rootNode);
    }

    static async db2local(payload: { [key: string]: any }): Promise<any> {
        //不会删除raw部分的文件，只删除缓存部分
        const pathConfig = Config.get('path');
        const curJobLs = await (new QueueModel).whereIn('type', ['sync/local2db', 'sync/db2local',]).whereIn('status', [1, 2]).select();
        if (curJobLs.length > 1) throw new Error('sync job running');
        await syncGeneratedDir(pathConfig.preview, fp.rootNode, 'preview',);
        await syncGeneratedDir(pathConfig.normal, fp.rootNode, 'normal',);
        await syncGeneratedDir(pathConfig.cover, fp.rootNode, 'cover',);
    }

    static async check(payload: { [key: string]: any }): Promise<any> {
        const pathConfig = Config.get('path');
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
            // if (node.title.indexOf('20240825 222200_希尔') !== -1) console.info(node, localRawPath);
            // if (node.type == 'directory') {
            //     dbFileSet.add(localRawPath);
            // } else {
            if (node.type == 'directory' || node.file_index.raw)
                dbFileSet.add(localRawPath);
            if (node.type == 'directory' || node.file_index.preview)
                dbFileSet.add(mkLocalPath(mkRelPath(node, 'preview', node?.file_index?.preview?.ext ?? null)));
            if (node.type == 'directory' || node.file_index.normal)
                dbFileSet.add(mkLocalPath(mkRelPath(node, 'normal', node?.file_index?.normal?.ext ?? null)));
            if (node.type == 'directory' || node.file_index.cover)
                dbFileSet.add(mkLocalPath(mkRelPath(node, 'cover', node?.file_index?.cover?.ext ?? null)));
            // }
        });
        rawFileSet.forEach(f => {
            // if (f.indexOf('20240825 222200_希尔') !== -1) console.info(f, dbFileSet.has(f));
            if (dbFileSet.has(f)) return;
            extStt.raw.push(f);
        });
        previewFileSet.forEach(f => {
            // if (f.indexOf('20200610') !== -1) console.info(f);
            if (dbFileSet.has(f)) return;
            extStt.preview.push(f);
        });
        normalFileSet.forEach(f => {
            if (dbFileSet.has(f)) return;
            extStt.normal.push(f);
        });
        coverFileSet.forEach(f => {
            if (dbFileSet.has(f)) return;
            extStt.cover.push(f);
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

//@notice 做缓存的话就不能热修改，但是本身修改的就不多。。。
let filterCacheLoaded: boolean = false;
let importerTitleFilter: Set<string> = new Set<string>();
let filterPathConfig: { [key: string]: string } = {};

function filtered(fileName: string) {
    if (!filterCacheLoaded) {
        if (Config.get().import_ignore.length) {
            const importerTitleFilterArr: string[] = Config.get('import_ignore');
            for (let i1 = 0; i1 < importerTitleFilterArr.length; i1++) {
                importerTitleFilter.add(importerTitleFilterArr[i1].toLowerCase())
            }
        }
        filterPathConfig = Config.get('path');
        filterCacheLoaded = true;
    }
    const lowerFileName = fileName.toLowerCase();
    if (importerTitleFilter.has(lowerFileName)) return true;
    if (filterPathConfig.prefix_temp == lowerFileName) return true;
    if (filterPathConfig.prefix_preview == lowerFileName) return true;
    if (filterPathConfig.prefix_normal == lowerFileName) return true;
    if (filterPathConfig.prefix_cover == lowerFileName) return true;
    //
    return false;
}

async function scanLocalDir(localRoot: string): Promise<Set<string>> {
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
        if (filtered(subFileLs[i1].name)) continue;
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
 * 根据本地文件同步检测数据库记录
 * 有数据的根据更新时间更新，没有数据的自动创建
 *
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
    const curSubFileTitleSet: Set<string> = new Set();
    for (let i1 = 0; i1 < subFileLs.length; i1++) {
        //console.info(localRoot+subFileLs[i1].name,subFileLs[i1].isDirectory(),subFileLs[i1].isFile());
        if (!rootNode.id) {
            console.info('sync/local2db : ', new Date().toISOString(), subFileLs[i1].name);
        }
        //写入标签文件
        if (subFileLs[i1].name == '_tags.json') {
            await parseTagFile(localRoot, rootNode.id);
            continue;
        }
        //规范化文件名
        const fTitle = fp.titleFilter(subFileLs[i1].name);
        if (subFileLs[i1].name != fTitle) {
            await fp.rename(
                localRoot + '/' + subFileLs[i1].name,
                localRoot + '/' + fTitle
            );
            subFileLs[i1].name = fTitle;
        }
        //排除多余的文件
        if (filtered(subFileLs[i1].name)) continue;
        //
        curSubFileTitleSet.add(fTitle);
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
                //导入时检测一下已存在的文件，导入已经构建好的文件时不再次build
                //可能会有一些容错上的问题，先试试
                const indexTypeLs: ('preview' | 'normal' | 'cover')[] = [
                    'preview', 'normal', 'cover',
                ];
                if (['image', 'video', 'audio'].indexOf(ins.type) !== -1) {
                    for (let i1 = 0; i1 < indexTypeLs.length; i1++) {
                        const indexType = indexTypeLs[i1];
                        const parserConfigType = indexType == 'normal' ? ins.type : indexType;
                        const parserConfig = Config.get().parser[parserConfigType];
                        const tSuffix: string = parserConfig.format;
                        const relPath = fp.mkRelPath({
                            id: -1,
                            node_path: ins.node_path,
                            title: ins.title,
                        }, indexType, tSuffix);
                        const localPath = fp.mkLocalPath(relPath);
                        if (await fp.ifLocalFileExists(localPath)) {
                            ins.file_index[indexType] = {
                                size: 0,
                                ext: tSuffix,
                                checksum: [],
                            };
                        }
                    }
                }
            }
            const insRes = await (new NodeModel).insert(ins) as col_node[];
            ins.id = insRes[0].id;
            curNode = ins;
        } else {
            curNode = ifExs;
        }
        if (!ifExs) {
            //console.info('ins',localRoot+subFileLs[i1].name,subFileLs[i1].isDirectory(),subFileLs[i1].isFile());
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
                //console.info('upd',localRoot+subFileLs[i1].name,subFileLs[i1].isDirectory(),subFileLs[i1].isFile());
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
        if (curSubFileTitleSet.has(curNode.title)) continue;
        await fp.rmReal(curNode);
    }
}

/**
 * 根据数据库文件检测生成过的文件
 * 有文件但是没有数据的删除
 * */
async function syncGeneratedDir(localRoot: string, rootNode: col_node, genType: string) {
    // console.info(localRoot);
    let subFileLs: Dirent[];
    try {
        subFileLs = await fs.readdir(localRoot, {encoding: 'utf-8', withFileTypes: true});
    } catch (e) {
        // throw new Error(`cannot read dir: ${localRoot}`)
        console.error(`cannot read dir: ${localRoot}`);
        return;
    }
    //
    const subNodeLs = await fp.ls(rootNode);
    const subNodeMap = new Map<string, col_node>();
    subNodeLs.forEach(subNode => {
        subNodeMap.set(subNode.title, subNode);
        if (subNode.type === 'directory') return;
        if (subNode.file_index) {
            if (subNode.file_index[genType]) {
                const file = subNode.file_index[genType] as col_node_file_index;
                if (file.ext) {
                    subNodeMap.set(subNode.title + '.' + file.ext, subNode);
                }
            }
        }
    });
    //
    for (let i1 = 0; i1 < subFileLs.length; i1++) {
        const subFile = subFileLs[i1];
        if (!(subFile.isDirectory() || subFile.isFile())) continue;
        const subTitle = subFile.name;
        const ifNodeExs = subNodeMap.get(subTitle);
        const subPath = subFile.parentPath + '/' + subTitle;
        //不存在的文件和文件/文件名类型不对的文件都删除
        let toDel = false;
        if (!ifNodeExs) {
            toDel = true;
        } else {
            //存在的文件不处理
            if (subFile.isFile())
                if (ifNodeExs.type === 'directory')
                    toDel = true;
            if (subFile.isDirectory())
                if (ifNodeExs.type !== 'directory')
                    toDel = true;
        }
        if (toDel) {
            console.info('syncGeneratedDir rm:', subPath);
            try {
                await fs.rm(subPath, {
                    force: true,
                    recursive: true,
                });
            } catch (e) {
                console.error(e);
            }
            continue;
        }
        //遍历文件夹
        if (subFile.isDirectory()) {
            await syncGeneratedDir(subPath, ifNodeExs, genType);
        }
    }
    return;
}

async function parseTagFile(localRoot: string, rootId: number) {
    const rootNode = await (new NodeModel).where('id', rootId).first();
    if (!rootNode) return;
    // console.info(rootNode);
    if (rootNode.tag_id_list && rootNode.tag_id_list.length) {
        return;
    }
    //
    const tagFilePath = localRoot + '/' + '_tags.json';
    const tagContentBuffer = await fs.readFile(tagFilePath);
    if (!tagContentBuffer || !tagContentBuffer.length) return;
    let tagContent: [[string, string]];
    try {
        let t = tagContentBuffer.toString();
        tagContent = JSON.parse(t);
    } catch (e) {
        return;
    }
    if (!tagContent) return;
    let tagIdSet = new Set<number>();
    for (let i1 = 0; i1 < tagContent.length; i1++) {
        let groupName = tagContent[i1][0];
        let tagName = tagContent[i1][1];
        //
        let ifGroupExs = await (new TagGroupModel).where('title', groupName).first();
        if (!ifGroupExs) {
            await (new TagGroupModel).insert({
                title: groupName,
                description: '',
                id_node: 0,
                sort: 0,
                status: 1,
            });
            ifGroupExs = await (new TagGroupModel).where('title', groupName).first();
        }
        //
        let ifTagExs = await (new TagModel).where('title', tagName).where('id_group', ifGroupExs.id).first();
        if (!ifTagExs) {
            await (new TagModel).insert({
                id_group: ifGroupExs.id,
                alt: [tagName],
                description: tagName,
                index_tag: [tagName],
                status: 1,
                title: tagName,
            });
            ifTagExs = await (new TagModel).where('title', tagName).where('id_group', ifGroupExs.id).first();
        }
        tagIdSet.add(ifTagExs.id);
    }
    if (!tagIdSet.size) return;
    await (new NodeModel()).where('id', rootId).update({
        tag_id_list: Array.from(tagIdSet),
    });
    await (new QueueModel).insert({
        type: 'file/buildIndex',
        payload: {id: rootId},
        status: 1,
    });
}




