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
        let node: col_node;
        if (typeof nodeId === 'object')
            node = nodeId;
        else
            node = await (new NodeModel()).where('id', nodeId).first();
        let ifErr = false;
        //
        //@notice 重建节点时不删除物理文件
        // for (const key in node.index_file_id) {
        //     if (key === 'raw') continue;
        //     await (new FileModel()).where('id', node.index_file_id[key])
        //         .update({status: 0});
        // }
        //
        const rawFileId = node.index_file_id.raw;
        if (!rawFileId) return;
        const rawFile = await (new FileModel()).where('id', rawFileId).first();
        if (!rawFile) return;
        // const rawFilePath = Config.path.local + fp.getRelPathByFile(rawFile);
        // const conf = Config.parser;
        //
        let parsedFile: col_node | boolean;
        // console.info(node);
        switch (node.type) {
            case 'audio':
                //
                if (!node.index_file_id.normal) {
                    parsedFile = await execFFmpeg(rawFile, 'audio');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.normal = node.index_file_id.raw;
                    else node.index_file_id.normal = parsedFile.id;
                }
                //
                if (!node.index_file_id.preview) {
                    parsedFile = await execFFmpeg(rawFile, 'preview');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.preview = node.index_file_id.raw;
                    else node.index_file_id.preview = parsedFile.id;
                }
                //
                if (!node.index_file_id.cover) {
                    parsedFile = await execFFmpeg(rawFile, 'cover');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.cover = node.index_file_id.raw;
                    else node.index_file_id.cover = parsedFile.id;
                }
                //
                await (new NodeModel()).where('id', node.id).update({
                    index_file_id: node.index_file_id,
                });
                break;
            case 'video':
                //
                if (!node.index_file_id.normal) {
                    parsedFile = await execFFmpeg(rawFile, 'video');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.normal = node.index_file_id.raw;
                    else node.index_file_id.normal = parsedFile.id;
                }
                //
                if (!node.index_file_id.preview) {
                    parsedFile = await execFFmpeg(rawFile, 'preview');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.preview = node.index_file_id.raw;
                    else node.index_file_id.preview = parsedFile.id;
                }
                //
                if (!node.index_file_id.cover) {
                    parsedFile = await execFFmpeg(rawFile, 'cover');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.cover = node.index_file_id.raw;
                    else node.index_file_id.cover = parsedFile.id;
                }
                //
                await (new NodeModel()).where('id', node.id).update({
                    index_file_id: node.index_file_id,
                });
                //subtitle
                const filePath = getConfig().path.local + fp.getRelPathByFile(rawFile);
                const meta = await FFMpeg.loadMeta(filePath);
                console.info(meta);
                const subMap = await FFMpeg.videoExtractSub(meta);
                console.info(subMap);
                if (subMap.size) {
                    const parserConfig = getConfig().parser.subtitle;
                    const subArr = Array.from(subMap, ([subTitle, ffStr]) => ({
                        subTitle, ffStr
                    }));
                    for (let i1 = 0; i1 < subArr.length; i1++) {
                        let ffStr = subArr[i1].ffStr;
                        let subTitle = subArr[i1].subTitle;
                        let ifSuffix = node.title.lastIndexOf('.');
                        if (!ifSuffix || ifSuffix == -1) ifSuffix = 0;
                        if (node.title.length - ifSuffix > 5) ifSuffix = 0;
                        if (node.title.length - ifSuffix < 1) ifSuffix = 0;
                        const subNodeTitle = `${
                            ifSuffix ? node.title.substring(0, ifSuffix) : node.title
                        }.${
                            subTitle
                        }.${
                            parserConfig.format
                        }`;
                        const ifDup = await (new NodeModel()).where('id_parent', node.id_parent).where('title', subNodeTitle).first();
                        if (ifDup) continue;
                        //
                        let nFileInfo: col_node;
                        try {
                            const tmpFilePath = await genTmpPath(parserConfig.format);
                            const exeStr = parseFFStr(ffStr, filePath, tmpFilePath);
                            const {stdout, stderr} = await exec(exeStr);
                            console.info(stdout, stderr);
                            nFileInfo = await fp.putFile(tmpFilePath, parserConfig.format);
                            //
                            const subNodeInfo = {
                                id_parent: node.id_parent,
                                type: 'subtitle',
                                title: subNodeTitle,
                                // description: description,
                                status: 1,
                                building: 1,
                                node_id_list: node.node_id_list,
                                tag_id_list: [],
                                index_file_id: {raw: nFileInfo.id, normal: nFileInfo.id,},
                                index_node: {},
                            } as col_node;
                            await (new NodeModel()).insert(subNodeInfo);
                        } catch (e) {
                            console.info(e);
                            return false;
                        }
                    }
                }
                break;
            case 'image':
                //
                if (!node.index_file_id.normal) {
                    parsedFile = await execFFmpeg(rawFile, 'image');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.normal = node.index_file_id.raw;
                    else node.index_file_id.normal = parsedFile.id;
                }
                //
                if (!node.index_file_id.preview) {
                    parsedFile = await execFFmpeg(rawFile, 'preview');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.preview = node.index_file_id.raw;
                    else node.index_file_id.preview = parsedFile.id;
                }
                //
                if (!node.index_file_id.cover) {
                    parsedFile = await execFFmpeg(rawFile, 'cover');
                    if (parsedFile === false) ifErr = true;
                    else if (parsedFile === true) node.index_file_id.cover = node.index_file_id.raw;
                    else node.index_file_id.cover = parsedFile.id;
                }
                //
                await (new NodeModel()).where('id', node.id).update({
                    index_file_id: node.index_file_id,
                });
                break;
            case 'binary':
                break;
            case 'text':
                break;
            case 'subtitle':
                parsedFile = await execFFmpeg(rawFile, 'subtitle');
                if (parsedFile === false) ifErr = true;
                else if (parsedFile === true) node.index_file_id.normal = node.index_file_id.raw;
                else node.index_file_id.normal = parsedFile.id;
                await (new NodeModel()).where('id', node.id).update({
                    index_file_id: node.index_file_id,
                });
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
        for (const fileKey in node.index_file_id) {
            await (new QueueModel).insert({
                type: 'file/checksum',
                payload: {id: node.index_file_id[fileKey], reload: true},
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
        if (!node.index_file_id.raw) {
            // console.info('no node.index_file_id.raw');
            return;
        }
        const rawId = node.index_file_id.raw;
        for (const key in node.index_file_id) {
            if (key === 'raw') continue;
            const fileId = node.index_file_id[key];
            if (fileId === rawId) continue;
            const ifExs = await fp.checkOrphanFile(fileId);
            if (ifExs > 1) continue;
            await fp.rmReal(fileId);
        }
        // console.info(node.index_file_id,rawId);
        // return;
        await (new NodeModel()).where('id', nodeId).update({
            index_file_id: {raw: rawId},
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
                .select(['id', 'type', "index_file_id"]);
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
    if (!node.index_file_id?.cover) return;
    const nodeLs = node.node_id_list.reverse();
    for (let i1 = 0; i1 < nodeLs.length; i1++) {
        if (!nodeLs[i1]) break;
        const pNode = await (new NodeModel()).where('id', nodeLs[i1]).first();
        if (!pNode) break;
        if (pNode.index_file_id.cover) break;
        await (new NodeModel()).where('id', nodeLs[i1]).update({
            index_file_id: Object.assign(pNode.index_file_id, {cover: node.index_file_id.cover})
        });
    }
}

async function deleteNodeForever(nodeLs: col_node[]) {
    const fileIdSet = new Set<number>;
    for (let i1 = 0; i1 < nodeLs.length; i1++) {
        const node = nodeLs[i1];
        // console.info(node);
        if (node.index_file_id)
            for (const key in node.index_file_id) {
                const fileId = node.index_file_id[key];
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


async function execFFmpeg(file: col_node, type: string,): Promise<col_node | boolean> {
    const filePath = getConfig().path.local + fp.getRelPathByFile(file);
    const meta = await FFMpeg.loadMeta(filePath);
    // console.info('===============================');
    // console.info(meta);
    let method;
    let imgLevel;
    let parserConfig;
    let ffStr: string | boolean;
    switch (type) {
        case 'audio':
            method = FFMpeg.audioStr;
            ffStr = await method(meta);
            parserConfig = getConfig().parser[type];
            break;
        case 'video':
            method = FFMpeg.videoStr;
            ffStr = await method(meta);
            parserConfig = getConfig().parser[type];
            // console.info(ffStr);
            break;
        case 'subtitle':
            console.info(meta);
            method = FFMpeg.subtitleStr;
            const ffMap = await method(meta) as Map<string, string>;
            ffStr = ffMap.get('default');
            if (!ffStr) ffStr = false;
            parserConfig = getConfig().parser[type];
            break;
        case 'image':
        case 'preview':
        case 'cover':
            method = FFMpeg.imageStr;
            imgLevel = type;
            ffStr = await method(meta, imgLevel);
            parserConfig = getConfig().parser[type];
            break;
    }
    if (typeof ffStr === 'boolean') return ffStr;
    // let format = conf.audio.format;
    let nFileInfo: col_node;
    // console.info(ffStr,);
    try {
        const tmpFilePath = await genTmpPath(parserConfig.format);
        const exeStr = parseFFStr(ffStr, filePath, tmpFilePath);
        const {stdout, stderr} = await exec(exeStr);
        console.info(stdout, stderr);
        nFileInfo = await fp.putFile(tmpFilePath, parserConfig.format);
    } catch (e) {
        console.info(e);
        return false;
    }
    return nFileInfo;
}

async function genTmpPath(suffix: string) {
    const uuid = fp.uuid();
    return getConfig().path.temp + '/t_' + uuid + '.' + suffix;
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