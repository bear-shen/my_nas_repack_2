import NodeModel from '../../model/NodeModel';
import {col_node, col_node_file_index, col_tag_group} from '../../../share/Database';
import * as fp from "../../lib/FileProcessor";
import {mkLocalPath, mkRelPath} from "../../lib/FileProcessor";
import * as FFMpeg from '../../lib/FFMpeg';
import {get as getConfig} from "../../ServerConfig";
import util from "util";
import TagModel from "../../model/TagModel";
import TagGroupModel from "../../model/TagGroupModel";
import QueueModel from "../../model/QueueModel";
import fs from "node:fs/promises";

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
        const newFileIndex: {
            rel?: number,
            cover?: col_node_file_index,
            preview?: col_node_file_index,
            normal?: col_node_file_index,
            raw?: col_node_file_index,
        } = {};
        const invalidLs: string[] = [];
        for (const indexKey in node.file_index) {
            switch (indexKey) {
                case 'rel':
                    newFileIndex.rel = node.file_index.rel;
                    break;
                case 'normal':
                case 'preview':
                case 'cover':
                case 'raw':
                    if (!ifReload && node.file_index[indexKey].checksum.length) continue;
                    const localPath = mkLocalPath(mkRelPath(node, indexKey));
                    newFileIndex[indexKey] = {
                        size: 0,
                        checksum: [],
                    }
                    newFileIndex[indexKey].checksum = await fp.checksum(localPath);
                    if (node.file_index[indexKey].checksum && node.file_index[indexKey].checksum.length) {
                        const org = node.file_index[indexKey].checksum.join(',');
                        const tgt = newFileIndex[indexKey].checksum.join(',');
                        if (org === tgt) {
                            invalidLs.push([indexKey, org, tgt].join('|'));
                        }
                    }
                    const stat = await fs.stat(localPath);
                    newFileIndex[indexKey].size = stat.size;
                    break;
            }
        }
        if (invalidLs.length) {
            throw new Error(`invalid hash code, ${invalidLs.join('\r\n')}`)
        }
        await (new NodeModel).where('id', node.id).update({
            file_index: newFileIndex,
        });
    }

    static async buildIndex(payload: { [key: string]: any }): Promise<any> {
        const nodeId = payload.id;
        let node: col_node;
        if (typeof nodeId === 'object')
            node = nodeId;
        else
            node = await (new NodeModel()).where('id', nodeId).first();
        node.node_index.tag = [];
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

    static async deleteForever(payload: { [key: string]: any }): Promise<any> {
        if (!payload.id) {
            throw new Error('id not found');
        }
        await fp.rmReal(payload.id)
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