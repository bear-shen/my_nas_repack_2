import NodeModel from '../../model/NodeModel';
import {col_favourite, col_node, col_tag_group} from '../../../share/Database';
import * as fp from "../../lib/FileProcessor";
import {mkLocalPath, mkRelPath} from "../../lib/FileProcessor";
import * as FFMpeg from '../../lib/FFMpeg';
import * as Config from "../../Config";
import util from "util";
import TagModel from "../../model/TagModel";
import TagGroupModel from "../../model/TagGroupModel";
import QueueModel from "../../model/QueueModel";
import fs from "node:fs/promises";
import {splitQuery} from "../../lib/ModelHelper";
import FavouriteModel from "../../model/FavouriteModel";

const exec = util.promisify(require('child_process').exec);

class FileJob {
    static async build(payload: { [key: string]: any }): Promise<any> {
        const nodeId = parseInt(payload.id);
        let node: col_node = await fp.get(nodeId);
        if (!node) return;
        //
        // console.info(node);
        let ifErr = false;
        //
        //@notice 重建节点时不删除物理文件
        // for (const key in node.file_index) {
        //     if (key === 'raw') continue;
        //     await (new FileModel()).where('id', node.file_index[key])
        //         .update({status: 0});
        // }
        //
        if (!node?.file_index?.raw) return;
        // node.file_index = {raw: node.file_index.raw};
        //
        // let parsedFile: col_node | boolean;
        // console.info(node);
        switch (node.type) {
            case 'audio':
                //
                if (!node.file_index.normal) {
                    const tmpFilePath = await execFFmpeg(node, 'audio', 'normal');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'normal', fp.extension(tmpFilePath));
                }
                //
                if (!node.file_index.preview) {
                    const tmpFilePath = await execFFmpeg(node, 'preview', 'preview');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'preview', fp.extension(tmpFilePath));
                }
                //
                if (!node.file_index.cover) {
                    const tmpFilePath = await execFFmpeg(node, 'cover', 'cover');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'cover', fp.extension(tmpFilePath));
                }
                //
                // await (new NodeModel()).where('id', node.id).update({
                //     file_index: node.file_index,
                // });
                break;
            case 'video':
                //
                if (!node.file_index.normal) {
                    const tmpFilePath = await execFFmpeg(node, 'video', 'normal');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'normal', fp.extension(tmpFilePath));
                }
                //
                if (!node.file_index.preview) {
                    const tmpFilePath = await execFFmpeg(node, 'preview', 'preview');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'preview', fp.extension(tmpFilePath));
                }
                //
                if (!node.file_index.cover) {
                    const tmpFilePath = await execFFmpeg(node, 'cover', 'cover');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'cover', fp.extension(tmpFilePath));
                }
                //
                //subtitle
                const filePath = fp.mkLocalPath(fp.mkRelPath(node, 'raw'));
                const meta = await FFMpeg.loadMeta(filePath);
                // console.info(meta);
                const subMap = await FFMpeg.videoExtractSub(meta);
                // console.info(subMap);
                if (subMap.size) {
                    const parserConfig = Config.get().parser.subtitle;
                    const subArr = Array.from(subMap, ([subTitle, ffStr]) => ({
                        subTitle, ffStr
                    }));
                    for (let i1 = 0; i1 < subArr.length; i1++) {
                        let ffStr = subArr[i1].ffStr;
                        let subTitle = subArr[i1].subTitle ?? 'sub' + i1;
                        const subNodeTitle = [
                            fp.filename(node.title),
                            subTitle,
                            parserConfig.format
                        ].join('.');
                        const ifDup = await fp.ifTitleExist(node.id_parent, subNodeTitle);
                        if (ifDup) continue;
                        //
                        let nFileInfo: col_node;
                        try {
                            const tmpFilePath = fp.genTmpPath(parserConfig.format);
                            const exeStr = parseFFStr(ffStr, filePath, tmpFilePath);
                            const {stdout, stderr} = await exec(exeStr);
                            console.info(stdout, stderr);
                            nFileInfo = await fp.put(tmpFilePath, node.id_parent, subNodeTitle, 'raw');
                            //更新状态
                            if (nFileInfo.id) {
                                await (new NodeModel()).where('id', nFileInfo.id).update({
                                    building: 0,
                                });
                            }
                        } catch (e) {
                            console.info(e);
                            ifErr = true;
                        }
                    }
                }
                break;
            case 'image':
                //
                if (!node.file_index.normal) {
                    const tmpFilePath = await execFFmpeg(node, 'image', 'normal');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'normal', fp.extension(tmpFilePath));
                }
                //
                if (!node.file_index.preview) {
                    const tmpFilePath = await execFFmpeg(node, 'preview', 'preview');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'preview', fp.extension(tmpFilePath));
                }
                //
                if (!node.file_index.cover) {
                    const tmpFilePath = await execFFmpeg(node, 'cover', 'cover');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'cover', fp.extension(tmpFilePath));
                }
                //
                break;
            case 'binary':
                break;
            case 'text':
                break;
            case 'subtitle':
                const tmpFilePath = await execFFmpeg(node, 'subtitle', 'normal');
                if (tmpFilePath === false) ifErr = true;
                if (typeof tmpFilePath === 'string')
                    await fp.put(tmpFilePath, node.id_parent, node.title, 'normal', fp.extension(tmpFilePath));
                break;
            default:
            case 'office':
            case 'pdf':
            case 'directory':
                break;
        }
        if (ifErr) {
            //
        }
        await (new NodeModel()).where('id', node.id).update({
            building: ifErr ? -1 : 0,
        });
        await cascadeCover(node.id);
        await (new QueueModel).insert({
            type: 'file/checksum',
            payload: {id: node.id, reload: true},
            status: 1,
        });
    }

    /**
     * @notice 注意是fileID
     * */
    static async checksum(payload: { [key: string]: any }): Promise<any> {
        const nodeId = payload.id;
        const ifReload = payload.reload;
        const node = await fp.get(nodeId);
        //就有一个问题，关联的文件要不要一起校验，目前先没管
        const invalidLs: string[] = [];
        for (const indexKey in node.file_index) {
            switch (indexKey) {
                case 'rel':
                    break;
                case 'normal':
                case 'preview':
                case 'cover':
                case 'raw':
                    const localPath = mkLocalPath(mkRelPath(node, indexKey, node.file_index[indexKey].ext));
                    const stat = await fs.stat(localPath);
                    node.file_index[indexKey].size = stat.size;
                    //
                    if (indexKey == 'raw') {
                        if (!ifReload && node.file_index[indexKey].checksum.length) continue;
                        const checksum = await fp.checksum(localPath);
                        //
                        const org = node.file_index[indexKey].checksum.join(',');
                        const tgt = checksum.join(',');
                        if (org != tgt) {
                            if (!ifReload)
                                invalidLs.push([indexKey, org, tgt].join('|'));
                            else
                                node.file_index[indexKey].checksum = checksum;
                        }
                    }
                    break;
            }
        }
        if (invalidLs.length) {
            throw new Error(`invalid hash code, ${invalidLs.join('\r\n')}`)
        }
        await (new NodeModel).where('id', node.id).update({
            file_index: node.file_index,
        });
    }

    static async buildIndex(payload: { [key: string]: any }): Promise<any> {
        const nodeId = payload.id;
        let node: col_node = await fp.get(parseInt(nodeId));
        if (!node) return;
        if (!node.node_index) node.node_index = {
            tag: [],
            title: '',
            description: '',
        };
        node.node_index.tag = [];
        if (node.tag_id_list && node.tag_id_list.length) {
            const tagLs = await (new TagModel).whereIn('id', node.tag_id_list).select();
            if (tagLs.length) {
                const tagGroupIdSet = new Set<number>;
                tagLs.forEach(tag => {
                    tagGroupIdSet.add(tag.id_group);
                });
                const tagGroupLs = await (new TagGroupModel).whereIn('id', Array.from(tagGroupIdSet)).select();
                const tagGroupMap = new Map<number, col_tag_group>();
                tagGroupLs.forEach(tagGroup => {
                    tagGroupMap.set(tagGroup.id, tagGroup);
                });
                tagLs.forEach(tag => {
                        const tagGroup = tagGroupMap.get(tag.id_group);
                        node.node_index.tag.push(`${tagGroup.title}:${tag.title}`);
                        tag.alt.forEach(alt => node.node_index.tag.push(`${tagGroup.title}:${alt}`));
                        node.node_index.tag.push(`${tag.description}`);
                    }
                );
            }
        }
        node.node_index.title = node.title;
        node.node_index.description = node.description;
        await (new NodeModel()).where('id', node.id).update({
            node_index: node.node_index,
        });
    }

    static async rebuild(payload: { [key: string]: any }): Promise<any> {
        const nodeId = payload.id;
        let node: col_node;
        if (typeof nodeId === 'object')
            node = nodeId;
        else
            node = await (new NodeModel()).where('id', nodeId).first();
        //
        // console.info(node);
        if (!node) {
            // console.info('no node');
            return;
        }
        if (!node.file_index.raw) {
            // console.info('no node.file_index.raw');
            return;
        }
        for (const indexKey in node.file_index) {
            switch (indexKey) {
                case 'rel':
                case 'raw':
                    break;
                case 'normal':
                case 'preview':
                case 'cover':
                    await fp.rmFile(node, indexKey);
                    delete node.file_index[indexKey];
                    break;
            }
        }
        await (new NodeModel()).where('id', node.id).update({
            file_index: node.file_index,
        });
        // console.info('to build');
        await FileJob.build(payload);
    }

    static async rebuildIndex(payload: { [key: string]: any }): Promise<any> {
        await FileJob.buildIndex(payload);
    }

    static async rebuildAllIndex(payload: { [key: string]: any }): Promise<any> {
        let preId = 0;
        let nodeIdSet = new Set<number>();
        while (true) {
            const nodeList = await new NodeModel().where('id', '>', preId)
                .order('id', 'asc').limit(1000).select(['id']);
            if (!nodeList) break;
            if (!nodeList.length) break;
            preId = nodeList[nodeList.length - 1].id;
            nodeList.forEach(node => nodeIdSet.add(node.id));
        }
        const nodeIdList = Array.from(nodeIdSet);
        for (let i1 = 0; i1 < nodeIdList.length; i1++) {
            await FileJob.buildIndex({id: nodeIdList[i1]});
        }
    }

    static async deleteForever(payload: { [key: string]: any }): Promise<any> {
        await fp.rmReal(parseInt(payload.id));
    }

    /**
     * 级联隐藏文件
     * */
    static async cascadeDeleteStatus(payload: { [key: string]: any }): Promise<any> {
        const srcId = parseInt(payload.id);
        const rootNode = await (new NodeModel).where('id', srcId).first();
        if (!rootNode) return;
        //
        let targetStatusCode = rootNode.status;
        // await (new NodeModel).where('id', rootNode.id).update({
        //     cascade_status: targetStatusCode,
        // });
        //
        // if (curNode.status != 0) return;
        if (rootNode.type != 'directory') return;
        const subNodeLs = await (new NodeModel)
            .whereRaw('node_id_list @> $0', rootNode.id)
            .select(['id', 'id_parent', 'node_id_list', 'status', 'cascade_status']);
        const statusMap = new Map<number, number[]>();
        subNodeLs.forEach(node => {
            statusMap.set(node.id, [node.status, node.cascade_status]);
        });
        for (let i1 = 0; i1 < subNodeLs.length; i1++) {
            let curNode = subNodeLs[i1];
            //如果当前文件是当前的根目录，不修改状态，status=0且cascade_status=1
            //如果当前文件是已删除的，不用处理，修改状态，status=0且cascade_status=0
            //但是如果路径中有已删除的文件夹，则不修改状态
            let noMod = false;
            for (let i2 = 0; i2 < curNode.node_id_list.length; i2++) {
                let pNodeId = curNode.node_id_list[i2];
                if (!pNodeId) continue;
                let pNodeStatus = statusMap.get(pNodeId);
                if (!pNodeStatus) continue;
                if (pNodeStatus[0] == 0) {
                    noMod = true;
                    break;
                }
            }
            if (noMod) continue;
            //
            await (new NodeModel).where('id', curNode.id).update({
                cascade_status: targetStatusCode,
            })
        }
    }

    /**
     * 级联更新文件
     * 前置的 FileProcessor/mv 已经移动了物理文件
     * 这里只需要重建修改后的 node_id_list 和 node_path
     * */
    static async cascadeMoveFile(payload: { [key: string]: any }): Promise<any> {
        const srcId = parseInt(payload.id);
        let parentNode: col_node;
        if (srcId)
            parentNode = await new NodeModel().where('id', srcId).first([
                'id', "node_id_list", "node_path"
            ]);
        else
            parentNode = fp.rootNode;
        if (!parentNode) throw new Error('node not found');
        //
        // const nodeCacheMap: Map<number, col_node> = new Map();
        // nodeCacheMap.set(parentNode.id, parentNode);
        //直接丢进递归里，不然比较麻烦
        const subNodeLs = await new NodeModel()
            // .whereRaw('node_id_list @> $0', srcId)
            .where('id_parent', srcId)
            .select(['id', 'type']);
        if (!subNodeLs || !subNodeLs.length) return;
        const nodePath = mkRelPath(parentNode);
        const nodeIdList = parentNode.node_id_list;
        nodeIdList.push(parentNode.id);
        // console.info(parentNode.node_id_list);
        const subNodeIdLs: number[] = [];
        for (let i1 = 0; i1 < subNodeLs.length; i1++) {
            subNodeIdLs.push(subNodeLs[i1].id);
        }
        await new NodeModel().whereIn('id', subNodeIdLs).update({
            node_id_list: nodeIdList,
            node_path: nodePath,
        });
        for (let i1 = 0; i1 < subNodeLs.length; i1++) {
            const node = subNodeLs[i1];
            if (node.type === 'directory') {
                await FileJob.cascadeMoveFile({id: node.id});
            }
        }
        await cascadeCover(payload.id)
    }

    static async cascadeCopyFile(payload: { [key: string]: any }): Promise<any> {
    }
}

async function cascadeCover(nodeId: number) {
    const node = await (new NodeModel()).where('id', nodeId).first();
    if (!node.file_index?.cover) return;
    const nodeLs = node.node_id_list.reverse();
    for (let i1 = 0; i1 < nodeLs.length; i1++) {
        const pNodeId = nodeLs[i1];
        if (!pNodeId) break;
        const pNode = await (new NodeModel()).where('id', pNodeId).first();
        if (!pNode) break;
        if (pNode.file_index.rel) break;
        await (new NodeModel()).where('id', pNodeId).update({
            file_index: {
                rel: node.id,
            }
        });
    }
}

async function execSharp(file: col_node, type: string,): Promise<col_node | boolean> {
    /*@todo
     * sharp跑了一下分发现性能确实有提升但是提升的有限
     * 本来以为是cli跑ff需要频繁启动耗时导致的慢
     * 但是看来也就没有太大的改进，不过这是wsl下的成绩，windows下可能影响会较大
     */
    return false;
}


/**
 * 返回true的时候表示无需转换
 * 考虑到现在的架构
 * 不转换的不填就行了
 * */
async function execFFmpeg(
    fileNode: col_node, targetFileType: string,
    fileIndexKey: 'normal' | 'preview' | 'cover'
): Promise<string | boolean> {
    const orgFilePath = fp.mkLocalPath(fp.mkRelPath(fileNode, 'raw'));
    // const targetFilePath = fp.mkLocalPath(fp.mkRelPath(fileNode, targetKey));
    const meta = await FFMpeg.loadMeta(fp.bashTitleFilter(orgFilePath));
    // console.info('===============================');
    // console.info(meta);
    if (!meta) throw new Error('invalid file/filename');
    let method;
    let imgLevel;
    let parserConfig;
    let ffStr: string | boolean;
    switch (targetFileType) {
        case 'audio':
            method = FFMpeg.audioStr;
            ffStr = await method(meta);
            parserConfig = Config.get().parser[targetFileType];
            break;
        case 'video':
            method = FFMpeg.videoStr;
            ffStr = await method(meta);
            parserConfig = Config.get().parser[targetFileType];
            // console.info(ffStr);
            break;
        case 'subtitle':
            console.info(meta);
            method = FFMpeg.subtitleStr;
            const ffMap = await method(meta) as Map<string, string>;
            ffStr = ffMap.get('default');
            if (!ffStr) ffStr = false;
            parserConfig = Config.get().parser[targetFileType];
            break;
        case 'image':
        case 'preview':
        case 'cover':
            method = FFMpeg.imageStr;
            imgLevel = targetFileType;
            ffStr = await method(meta, imgLevel);
            parserConfig = Config.get().parser[targetFileType];
            break;
    }
    if (typeof ffStr === 'boolean') return ffStr;
    // let format = conf.audio.format;
    let nFileInfo: col_node;
    // console.info(ffStr,);
    try {
        const tmpFilePath = fp.genTmpPath(parserConfig.format);
        const exeStr = parseFFStr(ffStr, orgFilePath, tmpFilePath);
        // console.info(exeStr);
        const {stdout, stderr} = await exec(exeStr);
        console.info(stdout, stderr);
        return tmpFilePath;
    } catch (e) {
        console.info(e);
        return false;
    }
    // return nFileInfo;
}


function parseFFStr(str: string, source: string, target: string) {
    str = str.replace('[execMask.program]', (Config.get()).parser.ffProgram);
    str = str.replace('[execMask.resource]', '"' + fp.bashTitleFilter(source) + '"');
    str = str.replace('[execMask.target]', '"' + fp.bashTitleFilter(target) + '"');
    // console.info('===============================');
    // console.info(str);
    return str;
}

export default FileJob;
