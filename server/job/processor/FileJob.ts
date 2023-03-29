import NodeModel from '../../model/NodeModel';
import {col_file, col_node, col_tag, col_tag_group} from '../../../share/Database';
import FileModel from '../../model/FileModel';
import * as fp from "../../lib/FileProcessor";
import * as FFMpeg from '../../lib/FFMpeg';
import Config from "../../ServerConfig";
import util from "util";
import TagModel from "../../model/TagModel";
import TagGroupModel from "../../model/TagGroupModel";

const exec = util.promisify(require('child_process').exec);

export default class {
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
        const rawFile = await (new FileModel()).where('id', rawFileId).first();
        // const rawFilePath = Config.path.local + fp.getRelPathByFile(rawFile);
        // const conf = Config.parser;
        //
        let parsedFile: col_file | boolean;
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
                const filePath = Config.path.local + fp.getRelPathByFile(rawFile);
                const meta = await FFMpeg.loadMeta(filePath);
                console.info(meta);
                const subMap = await FFMpeg.videoExtractSub(meta);
                console.info(subMap);
                if (subMap.size) {
                    const parserConfig = Config.parser.subtitle;
                    const subArr = Array.from(subMap, ([subTitle, ffStr]) => ({
                        subTitle, ffStr
                    }));
                    for (let i1 = 0; i1 < subArr.length; i1++) {
                        let ffStr = subArr[i1].ffStr;
                        let subTitle = subArr[i1].subTitle;
                        const subNodeTitle = `${
                            node.title.replace(/\..+?$/i, '')
                        }.${
                            subTitle
                        }.${
                            parserConfig.format
                        }`;
                        const ifDup = await (new NodeModel()).where('id_parent', node.id_parent).where('title', subNodeTitle).first();
                        if (ifDup) continue;
                        //
                        let nFileInfo: col_file;
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
                                list_node: node.list_node,
                                list_tag_id: [],
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
                break;
            case 'pdf':
                break;
            case 'directory':
                break;
        }
        //
        await (new NodeModel()).where('id', node.id).update({
            building: ifErr ? -1 : 0,
        });
        //
        await buildIndex(node);
    }
}

async function buildIndex(inNode: number | col_node) {
    const nodeId = inNode;
    let node: col_node;
    if (typeof nodeId === 'object')
        node = nodeId;
    else
        node = await (new NodeModel()).where('id', nodeId).first();
    const tagLs = await (new TagModel).whereIn('id', node.list_tag_id).select();
    const tagGroupIdSet = new Set<number>;
    tagLs.forEach(tag => {
        tagGroupIdSet.add(tag.id_group);
    });
    const tagGroupLs = await (new TagGroupModel).whereIn('id', Array.from(tagGroupIdSet)).select();
    const tagGroupMap = new Map<number, col_tag_group>();
    tagGroupLs.forEach(tagGroup => {
        tagGroupMap.set(tagGroup.id, tagGroup);
    });
    node.index_node.tag = [];
    tagLs.forEach(tag => {
            const tagGroup = tagGroupMap.get(tag.id_group);
            node.index_node.tag.push(`${tagGroup.title}:${tag.title}`);
            tag.alt.forEach(alt => node.index_node.tag.push(`${tagGroup.title}:${alt}`));
            node.index_node.tag.push(`${tag.description}`);
        }
    );
    node.index_node.title = node.title;
    node.index_node.description = node.description;
    await (new NodeModel()).where('id', node.id).update({
        index_node: node.index_node,
    });
}

async function execFFmpeg(file: col_file, type: string,): Promise<col_file | boolean> {
    const filePath = Config.path.local + fp.getRelPathByFile(file);
    const meta = await FFMpeg.loadMeta(filePath);
    let method;
    let imgLevel;
    let parserConfig;
    let ffStr: string | boolean;
    switch (type) {
        case 'audio':
            method = FFMpeg.audioStr;
            ffStr = await method(meta);
            parserConfig = Config.parser[type];
            break;
        case 'video':
            method = FFMpeg.videoStr;
            ffStr = await method(meta);
            parserConfig = Config.parser[type];
            break;
        case 'subtitle':
            method = FFMpeg.subtitleStr;
            const ffMap = await method(meta) as Map<string, string>;
            ffStr = ffMap.get('default');
            parserConfig = Config.parser[type];
            break;
        case 'image':
        case 'preview':
        case 'cover':
            method = FFMpeg.imageStr;
            imgLevel = type;
            ffStr = await method(meta, imgLevel);
            parserConfig = Config.parser[type];
            break;
    }
    if (typeof ffStr === 'boolean') return true;
    // let format = conf.audio.format;
    let nFileInfo: col_file;
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
    const uuid = await fp.getUUID();
    return Config.path.temp + '/t_' + uuid + '.' + suffix;
}


function parseFFStr(str: string, source: string, target: string) {
    str = str.replace('[execMask.program]', Config.parser.ffProgram);
    str = str.replace('[execMask.resource]', source);
    str = str.replace('[execMask.target]', target);
    return str;
}
