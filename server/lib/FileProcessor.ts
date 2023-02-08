import {Stream} from "stream";
import crypto from 'node:crypto';
import Config from "../ServerConfig";
import * as fs from 'fs/promises';
import {ReadStream, Stats} from 'fs';
import * as fsNP from 'fs';
import {type_file, col_node, col_file} from '../../share/Database';
import ORM from './ORM';
import NodeModel from "../model/NodeModel";
import FileModel from '../model/FileModel';
import {dir} from "console";

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

async function mkdir(dirId: number, name: string): Promise<boolean> {
    let parentInfo = rootNode;
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
        building: 0,
        list_node: [...parentInfo.list_node, parentInfo.id],
        list_tag_id: [],
        index_file_id: {},
        index_node: {},
    } as col_node;
    await (new NodeModel).insert(nodeInfo);
    nodeInfo.id = await (new NodeModel).lastInsertId();
    return true;
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

async function put(fromTmpPath: string, toDir: number | col_node, name: string): Promise<false | col_node> {
    // console.info('FileProcessor put: init');
    const parentNode = await getNodeByIdOrNode(toDir);
    //
    const ifDup = await (new NodeModel).where('id_parent', parentNode.id).where('title', name).first();
    if (ifDup) return false;
    //
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
    await fs.rm(fromTmpPath);
    //---------------------------------------
    //再写入
    await (new FileModel).insert(fileInfo);
    //last insert id 不靠谱的，用uuid回传
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
    await (new NodeModel).insert(nodeInfo);
    // try {
    // await fs.stat(fromTmpPath);
    // await fs.rm(fromTmpPath);
    // } catch (e) {
    // }
    return nodeInfo;
}

async function mv(nodeId: number | col_node, toDirId: number | col_node, name: string): Promise<boolean> {
    const node = await getNodeByIdOrNode(nodeId);
    const toDir = await getNodeByIdOrNode(toDirId);
    //
    const sameDir = node.id_parent === toDir.id;
    //
    console.info(toDir.title, name);
    const ifDup = await checkName(toDir.id, name);
    if (ifDup && ifDup.id !== node.id) return false;
    //
    const newNodeList = [...toDir.list_node, toDir.id];
    console.info('newNodeList:', newNodeList);
    await (new NodeModel).where('id', node.id).update({
        id_parent: toDir.id,
        list_node: newNodeList,
    });
    //如果是不同的目标文件夹的话,需要更改对应的文件索引
    if (!sameDir && node.type === 'directory') {
        const cascadeNode = await (new NodeModel).whereRaw('find_in_set( ? ,list_node)', node.id).select(["id", "list_node"]);
        cascadeNode.forEach(async child => {
            const childIndex = child.list_node.indexOf(node.id);
            await (new NodeModel).where('id', node.id).update({
                list_node: [...newNodeList, ...child.list_node.slice(childIndex)]
            })
        });
    }
    await (new NodeModel).where('id', node.id).update({
        title: name,
    });
    return true;
}

async function rm(nodeId: number): Promise<boolean> {
    await (new NodeModel).where('id', nodeId).update({status: 0});
    return false;
}

async function cp(nodeId: number | col_node, toDirId: number | col_node, name: string): Promise<boolean> {
    const node = await getNodeByIdOrNode(nodeId);
    const toDir = await getNodeByIdOrNode(toDirId);
    //
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
    put,
    mv,
    rm,
    cp,
    stat,
    //
    FileStat,
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