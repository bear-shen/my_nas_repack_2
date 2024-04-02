import NodeModel from '../../model/NodeModel';
import {col_node, col_tag_group} from '../../../share/Database';
import * as fp from "../../lib/FileProcessor";
import * as FFMpeg from '../../lib/FFMpeg';
import {get as getConfig} from "../../ServerConfig";
import util from "util";
import TagModel from "../../model/TagModel";
import TagGroupModel from "../../model/TagGroupModel";
import QueueModel from "../../model/QueueModel";

const exec = util.promisify(require('child_process').exec);

class FileJob {
    static async build(payload: { [key: string]: any }): Promise<any> {
        const nodeId = payload.id;
        let node: col_node = await fp.get(nodeId);
        //
        let ifErr = false;
        //
        //@notice 重建节点时不删除物理文件
        // for (const key in node.file_index) {
        //     if (key === 'raw') continue;
        //     await (new FileModel()).where('id', node.file_index[key])
        //         .update({status: 0});
        // }
        //
        if (!node.file_index.raw) return;
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
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'normal');
                }
                //
                if (!node.file_index.preview) {
                    const tmpFilePath = await execFFmpeg(node, 'preview', 'preview');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'preview');
                }
                //
                if (!node.file_index.cover) {
                    const tmpFilePath = await execFFmpeg(node, 'cover', 'cover');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'cover');
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
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'normal');
                }
                //
                if (!node.file_index.preview) {
                    const tmpFilePath = await execFFmpeg(node, 'preview', 'preview');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'preview');
                }
                //
                if (!node.file_index.cover) {
                    const tmpFilePath = await execFFmpeg(node, 'cover', 'cover');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'cover');
                }
                //
                //subtitle
                const filePath = fp.mkLocalPath(fp.mkRelPath(node, 'raw'));
                const meta = await FFMpeg.loadMeta(filePath);
                // console.info(meta);
                const subMap = await FFMpeg.videoExtractSub(meta);
                // console.info(subMap);
                if (subMap.size) {
                    const parserConfig = getConfig().parser.subtitle;
                    const subArr = Array.from(subMap, ([subTitle, ffStr]) => ({
                        subTitle, ffStr
                    }));
                    for (let i1 = 0; i1 < subArr.length; i1++) {
                        let ffStr = subArr[i1].ffStr;
                        let subTitle = subArr[i1].subTitle;
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
                            nFileInfo = await fp.put(tmpFilePath, node.id_parent, subNodeTitle, 'normal');
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
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'normal');
                }
                //
                if (!node.file_index.preview) {
                    const tmpFilePath = await execFFmpeg(node, 'preview', 'preview');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'preview');
                }
                //
                if (!node.file_index.cover) {
                    const tmpFilePath = await execFFmpeg(node, 'cover', 'cover');
                    if (tmpFilePath === false) ifErr = true;
                    if (typeof tmpFilePath === 'string')
                        await fp.put(tmpFilePath, node.id_parent, node.title, 'cover');
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
                    await fp.put(tmpFilePath, node.id_parent, node.title, 'normal');
                break;
            case 'pdf':
                break;
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
        for (const fileKey in node.file_index) {
            await (new QueueModel).insert({
                type: 'file/checksum',
                payload: {id: node.file_index[fileKey], reload: true},
                status: 1,
            });
        }
    }

    /**
     * @notice 注意是fileID
     * */
    static async checksum(payload: { [key: string]: any }): Promise<any> {
        const fileId = payload.id;
        const ifReload = payload.reload;
        let file: col_node;
        if (typeof fileId === 'object')
            file = fileId;
        else
            file = await (new FileModel()).where('id', fileId).first();
        //
        if (!file || !file.uuid)
            throw new Error(`invalid file id, ${fileId}`);
        const checksum = await fp.checksum(file);
        if (!ifReload && file.checksum && file.checksum.length) {
            if (file.checksum != checksum) {
                throw new Error(`invalid hash code, ${checksum}`)
            } else {
                return;
            }
        } else {
            await (new FileModel()).where('id', fileId).update({
                checksum: checksum,
            });
        }
    }

    static async buildIndex(payload: { [key: string]: any }): Promise<any> {
        const nodeId = payload.id;
        let node: col_node;
        if (typeof nodeId === 'object')
            node = nodeId;
        else
            node = await (new NodeModel()).where('id', nodeId).first();
        node.index_node.tag = [];
        if (node.tag_id_list.length) {
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
                        node.index_node.tag.push(`${tagGroup.title}:${tag.title}`);
                        tag.alt.forEach(alt => node.index_node.tag.push(`${tagGroup.title}:${alt}`));
                        node.index_node.tag.push(`${tag.description}`);
                    }
                );
            }
        }
        node.index_node.title = node.title;
        node.index_node.description = node.description;
        await (new NodeModel()).where('id', node.id).update({
            index_node: node.index_node,
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
        const rawId = node.file_index.raw;
        for (const key in node.file_index) {
            if (key === 'raw') continue;
            const fileId = node.file_index[key];
            if (fileId === rawId) continue;
            const ifExs = await fp.checkOrphanFile(fileId);
            if (ifExs > 1) continue;
            await fp.rmReal(fileId);
        }
        // console.info(node.file_index,rawId);
        // return;
        await (new NodeModel()).where('id', nodeId).update({
            file_index: {raw: rawId},
        });
        // console.info('to build');
        await FileJob.build(payload);
    }

    static async rebuildIndex(payload: { [key: string]: any }): Promise<any> {
        await FileJob.buildIndex(payload);
    }

    static async deleteForever(payload: { [key: string]: any }): Promise<any> {
        if (!payload.id) {
            throw new Error('id not found');
        }
        // console.info(1);
        // try {
        const curNode = await new NodeModel().where('id', payload.id).first();
        if (!curNode) throw new Error('node not found or already deleted');
        // } catch (e) {
        //     console.info(e);
        // }
        // console.info(2);
        // return ;
        const targetNodeList: col_node[] = [];
        if (curNode.type === 'directory') {
            // dirNodeIdList.push(curNode.id);
            await (new NodeModel).whereRaw('find_in_set( ? ,node_id_list)', curNode.id).update({status: -1});
            const subNodeList = await (new NodeModel)
                .whereRaw('find_in_set( ? ,node_id_list)', curNode.id)
                .select(['id', 'type', "file_index"]);
            subNodeList.forEach(node => targetNodeList.push(node));
        }
        targetNodeList.push(curNode);
        console.info(`delete node:${targetNodeList.length}`);
        // console.info(`delete dir node:${dirNodeIdList.join(',')}`);
        // console.info(`delete file node:${Array.from(fileNodeIdSet).join(',')}`);
        // if (dirNodeIdList.length)
        //     await (new NodeModel()).whereIn('id', dirNodeIdList).delete();
        // if (fileNodeIdSet.size)
        await deleteNodeForever(targetNodeList);
    }
}

async function cascadeCover(nodeId: number) {
    const node = await (new NodeModel()).where('id', nodeId).first();
    if (!node.file_index?.cover) return;
    const nodeLs = node.node_id_list.reverse();
    for (let i1 = 0; i1 < nodeLs.length; i1++) {
        if (!nodeLs[i1]) break;
        const pNode = await (new NodeModel()).where('id', nodeLs[i1]).first();
        if (!pNode) break;
        if (pNode.file_index.cover) break;
        await (new NodeModel()).where('id', nodeLs[i1]).update({
            file_index: Object.assign(pNode.file_index, {cover: node.file_index.cover})
        });
    }
}

async function deleteNodeForever(nodeLs: col_node[]) {
    const fileIdSet = new Set<number>;
    for (let i1 = 0; i1 < nodeLs.length; i1++) {
        const node = nodeLs[i1];
        // console.info(node);
        if (node.file_index)
            for (const key in node.file_index) {
                const fileId = node.file_index[key];
                if (fileIdSet.has(fileId)) continue;
                fileIdSet.add(fileId);
                const ifExs = await fp.checkOrphanFile(fileId);
                if (ifExs > 1) continue;
                await fp.rmReal(fileId);
            }
        await (new NodeModel()).where('id', node.id).delete();
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
    const meta = await FFMpeg.loadMeta(orgFilePath);
    // console.info('===============================');
    // console.info(meta);
    let method;
    let imgLevel;
    let parserConfig;
    let ffStr: string | boolean;
    switch (targetFileType) {
        case 'audio':
            method = FFMpeg.audioStr;
            ffStr = await method(meta);
            parserConfig = getConfig().parser[targetFileType];
            break;
        case 'video':
            method = FFMpeg.videoStr;
            ffStr = await method(meta);
            parserConfig = getConfig().parser[targetFileType];
            // console.info(ffStr);
            break;
        case 'subtitle':
            console.info(meta);
            method = FFMpeg.subtitleStr;
            const ffMap = await method(meta) as Map<string, string>;
            ffStr = ffMap.get('default');
            if (!ffStr) ffStr = false;
            parserConfig = getConfig().parser[targetFileType];
            break;
        case 'image':
        case 'preview':
        case 'cover':
            method = FFMpeg.imageStr;
            imgLevel = targetFileType;
            ffStr = await method(meta, imgLevel);
            parserConfig = getConfig().parser[targetFileType];
            break;
    }
    if (typeof ffStr === 'boolean') return ffStr;
    // let format = conf.audio.format;
    let nFileInfo: col_node;
    // console.info(ffStr,);
    try {
        const tmpFilePath = fp.genTmpPath(parserConfig.format);
        const exeStr = parseFFStr(ffStr, orgFilePath, tmpFilePath);
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
    str = str.replace('[execMask.program]', (getConfig()).parser.ffProgram);
    str = str.replace('[execMask.resource]', source);
    str = str.replace('[execMask.target]', target);
    // console.info('===============================');
    // console.info(str);
    return str;
}

export default FileJob;