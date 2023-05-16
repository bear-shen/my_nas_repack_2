import {Stream} from "stream";
import crypto from 'node:crypto';
import Config from "../ServerConfig";
import * as fs from 'fs/promises';
import {ReadStream, Stats} from 'fs';
import * as fsNP from 'fs';
import {type_file, col_node, col_file, col_tag_group} from '../../share/Database';
import ORM from './ORM';
import NodeModel from "../model/NodeModel";
import FileModel from '../model/FileModel';
import {dir} from "console";
import TagModel from "../model/TagModel";
import TagGroupModel from "../model/TagGroupModel";

function isId(inVal: col_node | number | bigint): boolean {
    switch (typeof inVal) {
        case 'bigint':
        case 'number':
        case 'string':
            return true;
            break;
        case 'object':
        default:
            return false;
            break;
    }
}

async function getNodeByIdOrNode(inVal: col_node | number | bigint): Promise<col_node> {
    if (!isId(inVal)) return inVal as col_node;
    if (inVal === 0) return rootNode;
    return await (new NodeModel).where('id', inVal).first();
}

//util
async function relPath2node(relPath: string): Promise<col_node[] | false> {
    let nPathArr = relPath.replace(/\/$/, '').split(/\//);
    nPathArr = nPathArr.filter(n => !!n.length);
    // console.info(relPath, nPathArr);
    const nodeList = [rootNode];
    if (nPathArr.length > 0)
        for (let i1 = 0; i1 < nPathArr.length; i1++) {
            if (!nPathArr[i1].length) continue;
            const curNode = await (new NodeModel).where('id_parent', nodeList[i1].id).where('title', nPathArr[i1]).first();
            if (!curNode) return false;
            nodeList.push(curNode);
        }
    return nodeList;
}

async function getUUID(): Promise<string> {
    let uuid = '';
    do {
        uuid = crypto.randomBytes(12).toString("base64url").toLowerCase()
    } while (await (new FileModel).where('uuid', uuid).first(['id']))
    return uuid;
}

function getRelPathByFile(file: col_file) {
    const path = `/${file.uuid.substring(0, 1)}/${file.uuid.substring(1, 3)}/${file.uuid.substring(3)}.${file.suffix}`;
    return path;
}

function getDir(filePath: string): string {
    filePath = filePath.replace(/\/$/, '');
    const lastSlash = filePath.lastIndexOf('/');
    return filePath.substring(0, lastSlash);
}

function getName(filePath: string): string {
    filePath = filePath.replace(/\/$/, '');
    const lastSlash = filePath.lastIndexOf('/');
    return filePath.substring(lastSlash + 1);
}

function getSuffix(fileName: string): string {
    const ifSlash = fileName.lastIndexOf('/');
    const suffixOffset = fileName.lastIndexOf('.');
    if (ifSlash >= suffixOffset) return '';
    //
    let suffix = '';
    if (suffixOffset > 0) {
        suffix = fileName.slice(suffixOffset + 1);
        if (suffix.length > 6) suffix = '';
        else suffix = suffix.toLowerCase();
    }
    return suffix;
}

function getType(suffix: string): type_file {
    let ifHit = -1;
    // console.info(suffix);
    for (const key in Config.suffix) {
        ifHit = Config.suffix[key].indexOf(suffix);
        if (ifHit === -1) continue;
        return key as type_file;
    }
    return 'binary';
}

async function checkName(dirId: number, name: string) {
    return await (new NodeModel).where('id_parent', dirId).where('title', name).first();
}

//dir
async function ls(dirId: number): Promise<FileStat[]> {
    const nodeLs = await (new NodeModel).where('id_parent', dirId).where('status', 1).select() as FileStat[];
    //
    const fileIdSet = new Set<number>();
    const fileMap = new Map<number, col_file>();
    //
    nodeLs.forEach(node => {
        for (const key in node.index_file_id) {
            if (!Object.prototype.hasOwnProperty.call(node.index_file_id, key)) continue;
            const fileId = node.index_file_id[key];
            fileIdSet.add(fileId);
        }
    });
    if (fileIdSet.size) {
        const fileLs = await (new FileModel).whereIn('id', Array.from(fileIdSet)).select();
        fileLs.forEach(file => fileMap.set(file.id, file));
    }
    //
    nodeLs.forEach(node => {
        node.file = {};
        for (const key in node.index_file_id) {
            if (!Object.prototype.hasOwnProperty.call(node.index_file_id, key)) continue;
            const fileId = node.index_file_id[key];
            const file = fileMap.get(fileId);
            if (!file) continue;
            node.file[key] = file;
        }
    });
    return nodeLs;
}

async function mkdir(dirId: number, name: string): Promise<false | col_node> {
    let parentInfo = rootNode;
    name = titleFilter(name);
    const ifDup = await (new NodeModel)
        .where('id_parent', dirId)
        .where('title', name)
        .first();
    if (ifDup) {
        return false;
    }
    if (dirId) {
        parentInfo = await (new NodeModel).where('id', dirId).first();
        if (!parentInfo) return false;
    }
    //
    const nodeInfo = {
        id_parent: dirId,
        type: 'directory',
        title: name,
        // description: description,
        status: 1,
        building: 1,
        list_node: [...parentInfo.list_node, parentInfo.id],
        list_tag_id: [],
        index_file_id: {},
        index_node: {},
    } as col_node;
    const insRes = await (new NodeModel).insert(nodeInfo);
    // nodeInfo.id = await (new NodeModel).lastInsertId();
    return Object.assign(nodeInfo, {id: insRes.insertId});
}

//file
async function get(nodeId: number | col_node, from: number, to: number): Promise<ReadStream> {
    const node = await getNodeByIdOrNode(nodeId);
    const file = await (new FileModel).where('id', node.index_file_id.raw).first();
    const relPath = getRelPathByFile(file);
    const fullPath = Config.path.local + relPath;
    //
    console.info(fullPath, from, to);
    return fsNP.createReadStream(fullPath, {
        autoClose: true,
        // encoding: 'binary',
        start: from, end: to
    });
}

async function touch(path: string): Promise<false> {
    return false;
}

/**
 * 添加文件不添加节点
 * suffix其实可以内部处理的，不过前面反正会用到
 * */
async function putFile(fromTmpPath: string, suffix: string): Promise<col_file> {
    const stat = await fs.stat(fromTmpPath);
    const fileInfo = {
        uuid: await getUUID(),
        suffix: suffix,
        size: stat.size,
        meta: {},
        status: 1,
    } as col_file;
    //---------------------------------------
    //先落地
    // console.info('FileProcessor put: node cmp');
    const targetPath = Config.path.local + getRelPathByFile(fileInfo);
    try {
        await fs.stat(getDir(targetPath));
    } catch (e) {
        await fs.mkdir(getDir(targetPath), {recursive: true, mode: 0o777});
    }
    // console.info('FileProcessor put: mkdir');
    await fs.cp(fromTmpPath, targetPath);
    await fs.rm(fromTmpPath);
    //---------------------------------------
    //再写入
    const insRes = await (new FileModel).insert(fileInfo);
    fileInfo.id = insRes.insertId;
    return fileInfo;
}

async function put(fromTmpPath: string, toDir: number | col_node, name: string, isCopy: boolean = false): Promise<false | col_node> {
    // console.info('FileProcessor put: init');
    const parentNode = await getNodeByIdOrNode(toDir);
    //
    const ifDup = await checkName(parentNode.id, name);
    // const ifDup = await (new NodeModel).where('id_parent', parentNode.id).where('title', name).first();
    if (ifDup) return false;
    //
    name = titleFilter(name);
    const suffix = getSuffix(name);
    const stat = await fs.stat(fromTmpPath);
    const fileInfo = {
        uuid: await getUUID(),
        suffix: suffix,
        size: stat.size,
        meta: {},
        status: 1,
    } as col_file;
    //---------------------------------------
    //先落地
    // console.info('FileProcessor put: node cmp');
    const targetPath = Config.path.local + getRelPathByFile(fileInfo);
    try {
        await fs.stat(getDir(targetPath));
    } catch (e) {
        await fs.mkdir(getDir(targetPath), {recursive: true, mode: 0o777});
    }
    // console.info('FileProcessor put: mkdir');
    await fs.cp(fromTmpPath, targetPath);
    if (!isCopy)
        await fs.rm(fromTmpPath);
    //---------------------------------------
    //再写入
    await (new FileModel).insert(fileInfo);
    //last insert id 不靠谱的，用uuid回传
    //ResultSetHeader 里的insertId似乎没问题
    const curFileInfo = await (new FileModel).where('uuid', fileInfo.uuid).first(['id']);
    fileInfo.id = curFileInfo.id;
    // console.info(fileInfo.id, 'ref to', name);
    //
    const nodeInfo = {
        id_parent: parentNode.id,
        type: getType(suffix),
        title: name,
        // description: description,
        status: 1,
        building: 1,
        list_node: [...parentNode.list_node, parentNode.id],
        list_tag_id: [],
        index_file_id: {raw: fileInfo.id,},
        index_node: {},
    } as col_node;
    const insRes = await (new NodeModel).insert(nodeInfo);
    // try {
    // await fs.stat(fromTmpPath);
    // await fs.rm(fromTmpPath);
    // } catch (e) {
    // }
    return Object.assign(nodeInfo, {id: insRes.insertId});
}

async function mv(nodeId: number | col_node, toDirId: number | col_node, name: string | false = false, description: string | false = false): Promise<boolean> {
    const node = await getNodeByIdOrNode(nodeId);
    const toDir = await getNodeByIdOrNode(toDirId);
    //
    const sameDir = node.id_parent === toDir.id;
    if (name) name = titleFilter(name);
    //
    console.info('mv to', toDir.title, name);
    const ifDup = await checkName(toDir.id, name === false ? node.title : name);
    if (ifDup && ifDup.id !== node.id) return false;
    //
    if (!sameDir) {
        const newNodeList = [...toDir.list_node, toDir.id];
        console.info('newNodeList:', newNodeList);
        await (new NodeModel).where('id', node.id).update({
            id_parent: toDir.id,
            list_node: newNodeList,
        });
        //如果是不同的目标文件夹的话,需要更改对应的文件索引
        if (node.type === 'directory') {
            const cascadeNode = await (new NodeModel).whereRaw('find_in_set( ? ,list_node)', node.id).select(["id", "list_node"]);
            cascadeNode.forEach(async child => {
                const childIndex = child.list_node.indexOf(node.id);
                await (new NodeModel).where('id', node.id).update({
                    list_node: [...newNodeList, ...child.list_node.slice(childIndex)]
                })
            });
        }
    }
    if (name !== false && description !== false) {
        const updRes = {
            title: name,
            description: description,
        } as { [key: string]: string | false };
        if (updRes.title === false) updRes.title = node.title;
        if (updRes.description === false) updRes.description = node.description;
        await (new NodeModel).where('id', node.id).update(updRes);
    }
    return true;
}

async function rm(nodeId: number): Promise<boolean> {
    await (new NodeModel).where('id', nodeId).update({status: 0});
    return false;
}

async function rmReal(fileId: number | col_file) {
    let isId: boolean;
    switch (typeof fileId) {
        case 'bigint':
        case 'number':
        case 'string':
            isId = true;
            break;
        case 'object':
        default:
            isId = false;
            break;
    }
    let fileInfo: col_file;
    if (isId)
        fileInfo = await (new FileModel()).where('id', fileId).first();
    else
        fileInfo = fileId as col_file;
    const targetPath = Config.path.local + getRelPathByFile(fileInfo);
    await fs.rm(targetPath);
    let dirPath = getDir(targetPath);
    for (let i1 = 0; i1 < 2; i1++) {
        let dirLs = await fs.readdir(dirPath);
        if (!dirLs.length) {
            await fs.rmdir(dirPath)
        }
        dirPath = getDir(dirPath);
    }
    await (new FileModel()).where('id', fileInfo.id).delete();
}

async function cp(nodeId: number | col_node, toDirId: number | col_node, name: string): Promise<boolean> {
    const node = await getNodeByIdOrNode(nodeId);
    const toDir = await getNodeByIdOrNode(toDirId);
    //
    name = titleFilter(name);
    const ifDup = await checkName(toDir.id, name);
    if (ifDup && ifDup.id !== nodeId) return false;
    const newNodeList = [...toDir.list_node, toDir.id];
    const newNodeInfo = {
        id_parent: toDir.id,
        type: node.type,
        title: name,
        description: node.description,
        status: node.status,
        building: node.building,
        list_node: newNodeList,
        list_tag_id: node.list_tag_id,
        index_file_id: node.index_file_id,
        index_node: node.index_node,
    } as col_node;
    await (new NodeModel).insert(newNodeInfo);
    //
    if (newNodeInfo.type === 'directory') {
        const cascadeNode = await (new NodeModel).whereRaw('find_in_set( ? ,list_node)', node.id).select(["id", "list_node"]);
        cascadeNode.forEach(async child => {
            const childIndex = child.list_node.indexOf(node.id);
            await (new NodeModel).where('id', node.id).update({
                list_node: [...newNodeList, ...child.list_node.slice(childIndex)]
            })
        });
    }
    return true;
}

async function stat(nodeId: number | col_node): Promise<FileStat> {
    const node = await getNodeByIdOrNode(nodeId) as FileStat;
    //
    const fileIdSet = new Set<number>();
    const fileMap = new Map<number, col_file>();
    //
    for (const key in node.index_file_id) {
        if (!Object.prototype.hasOwnProperty.call(node.index_file_id, key)) continue;
        const fileId = node.index_file_id[key];
        fileIdSet.add(fileId);
    }
    if (fileIdSet.size) {
        const fileLs = await (new FileModel).whereIn('id', Array.from(fileIdSet)).select();
        fileLs.forEach(file => fileMap.set(file.id, file));
    }
    //
    node.file = {};
    for (const key in node.index_file_id) {
        if (!Object.prototype.hasOwnProperty.call(node.index_file_id, key)) continue;
        const fileId = node.index_file_id[key];
        const file = fileMap.get(fileId);
        if (!file) continue;
        node.file[key] = file;
    }
    return node;
}

async function buildIndex(nodeId: number | col_node, cascade: boolean = false) {
    const node = await getNodeByIdOrNode(nodeId);
    if (cascade) {
        const subLs = await (new NodeModel).whereRaw('find_in_set( ? ,list_node)', node.id).select(["id"]);
        for (let i1 = 0; i1 < subLs.length; i1++) {
            await buildIndex(subLs[i1]);
        }
    }
    console.info('building:', node.id, ':', node.title);
    const tagList = await (new TagModel()).whereIn('id', node.list_tag_id).select();
    const tagGroupIdSet = new Set<number>();
    tagList.forEach(tag => {
        tagGroupIdSet.add(tag.id_group);
    })
    const tagGroupList = await (new TagGroupModel()).whereIn('id', Array.from(tagGroupIdSet)).select();
    const tagGroupMap = new Map<number, col_tag_group>();
    tagGroupList.forEach(tagGroup => {
        tagGroupMap.set(tagGroup.id, tagGroup);
    });
    const nodeTree = await (new NodeModel()).whereIn('id', node.list_node).select();
    const nodeIndex = {
        title: node.title,
        description: node.description,
        tag: [] as string[],
    }
    tagList.forEach(tag => {
        const group = tagGroupMap.get(tag.id_group);
        let tagTTs = [tag.title, ...tag.alt];
        if (group) {
            for (let i1 = 0; i1 < tagTTs.length; i1++) {
                tagTTs[i1] = `${group.title}:${tagTTs[i1]}`;
            }
        }
        nodeIndex.tag.push(...tagTTs);
    });
    await (new NodeModel()).where('id', node.id).update({
        index_node: nodeIndex
    });
}

function titleFilter(title: string) {
    return title.replaceAll(/[\^'/,\r\n\t\\:*?"|<>]/igm, ' ');
}

export {
    relPath2node,
    getRelPathByFile,
    getUUID,
    getDir,
    getName,
    getSuffix,
    getType,
    //
    ls,
    mkdir,
    get,
    touch,
    putFile,
    put,
    mv,
    rm,
    rmReal,
    cp,
    stat,
    //
    FileStat,
    titleFilter,
};

type FileStat = col_node & {
    file?: {
        preview?: col_file,
        normal?: col_file,
        cover?: col_file,
        raw?: col_file,
        [key: string]: col_file | undefined,
    },
    relPath: string,
    path: string,
};

const rootNode = {
    id: 0,
    id_parent: 0,
    type: 'directory',
    title: 'root',
    description: '',
    status: 1,
    building: 0,
    list_node: [],
    list_tag_id: [],
    index_file_id: {},
    index_node: {},
    time_create: '1919-08-10 11:45:14',
    time_update: '1919-08-10 11:45:14',
} as col_node;