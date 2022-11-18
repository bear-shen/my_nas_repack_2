import { Stream } from "stream";
import crypto from 'node:crypto';
import Config from "../ServerConfig";
import * as fs from 'fs/promises';
import { ReadStream, Stats } from 'fs';
import * as fsNP from 'fs';
import { FileType, NodeCol, FileCol } from '../../share/Database';
import ORM from './ORM';
import NodeModel from "../model/NodeModel";
import FileModel from '../model/FileModel';
import { dir } from "console";

function isId(inVal: NodeCol | number | bigint): boolean {
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
async function getNodeByIdOrNode(inVal: NodeCol | number | bigint): Promise<NodeCol> {
    if (!isId(inVal)) return inVal as NodeCol;
    if (inVal === 0) return rootNode;
    return await (new NodeModel).where('id', inVal).first();
}
//util
async function relPath2node(relPath: string): Promise<NodeCol[] | false> {
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
function getUUID(): string {
    return crypto.randomBytes(12).toString("base64url").toLowerCase();
}
function getRelPathByFile(file: FileCol) {
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
function getType(suffix: string): FileType {
    let ifHit = -1;
    // console.info(suffix);
    for (const key in Config.suffix) {
        ifHit = Config.suffix[key].indexOf(suffix);
        if (ifHit === -1) continue;
        return key as FileType;
    }
    return 'binary';
}
async function checkName(dirId: number, name: string) {
    return await (new NodeModel).where('id_parent', dirId).
        where('title', name).
        first();
}
//dir
async function ls(dirId: number): Promise<FileStat[]> {
    const nodeLs = await (new NodeModel).where('id_parent', dirId).select() as FileStat[];
    //
    const fileIdSet = new Set<number>();
    const fileMap = new Map<number, FileCol>();
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

async function mkdir(dirId: number, name: string): Promise<NodeCol | false> {
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
    } as NodeCol;
    await (new NodeModel).insert(nodeInfo);
    nodeInfo.id = await (new NodeModel).lastInsertId();
    return nodeInfo;
}
//file
async function get(nodeId: string, from: number, to: number): Promise<ReadStream> {
    const node = await (new NodeModel).where('id', nodeId).first();
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

async function put(fromTmpPath: string, toDir: number | NodeCol, name: string): Promise<boolean> {
    const parentNode = await getNodeByIdOrNode(toDir);
    //
    const ifDup = await (new NodeModel).where('id_parent', parentNode.id).where('title', name).first();
    if (ifDup) return false;
    //
    const suffix = getSuffix(name);
    const stat = await fs.stat(fromTmpPath);
    const fileInfo = {
        uuid: getUUID(),
        suffix: suffix,
        size: stat.size,
        meta: {},
        status: 1,
    } as FileCol;
    await (new FileModel).insert(fileInfo);
    fileInfo.id = await (new FileModel).lastInsertId();
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
        index_file_id: { raw: fileInfo.id, },
        index_node: {},
    } as NodeCol;
    await (new NodeModel).insert(nodeInfo);
    const targetPath = Config.path.local + getRelPathByFile(fileInfo);
    await fs.mkdir(getDir(targetPath), { recursive: true, mode: 0o777 });
    await fs.rename(fromTmpPath, targetPath);
    return true;
}

async function mv(nodeId: number, toDirId: number, name: string): Promise<boolean> {
    const toDir = await (new NodeModel).where('id', toDirId).first();
    const node = await (new NodeModel).where('id', nodeId).first();
    //
    const sameDir = node.id_parent === toDir.id;
    //
    const ifDup = await checkName(toDirId, name);
    if (ifDup && ifDup.id !== nodeId) return false;
    //如果是不同的目标文件夹的话,需要更改对应的文件索引
    if (!sameDir && node.type === 'directory') {
        const newNodeList = [...toDir.list_node, toDir.id];
        await (new NodeModel).where('id', node.id).update({
            list_node: newNodeList
        })
        //
        const cascadeNode = await (new NodeModel).whereRaw('find_in_set( ? ,list_node)', nodeId).select(["id", "list_node"]);
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
    await (new NodeModel).where('id', nodeId).update({ status: 0 });
    return false;
}

async function cp(nodeId: number | NodeCol, toDirId: number | NodeCol, name: string): Promise<boolean> {

    const node = await getNodeByIdOrNode(nodeId);
    const toDir = await getNodeByIdOrNode(toDirId);
    //
    const ifDup = await checkName(toDir.id, name);
    if (ifDup && ifDup.id !== nodeId) return false;
    const newNodeList = [...toDir.list_node, toDir.id];
    const newNodeInfo = {
        id_parent: toDirId,
        type: node.type,
        title: name,
        description: node.description,
        status: node.status,
        building: node.building,
        list_node: newNodeList,
        list_tag_id: node.list_tag_id,
        index_file_id: node.index_file_id,
        index_node: node.index_node,
    } as NodeCol;
    await (new NodeModel).insert(newNodeInfo);
    //
    if (newNodeInfo.type === 'directory') {
        const cascadeNode = await (new NodeModel).whereRaw('find_in_set( ? ,list_node)', nodeId).select(["id", "list_node"]);
        cascadeNode.forEach(async child => {
            const childIndex = child.list_node.indexOf(node.id);
            await (new NodeModel).where('id', node.id).update({
                list_node: [...newNodeList, ...child.list_node.slice(childIndex)]
            })
        });
    }
    return true;
}

async function stat(nodeId: number | NodeCol): Promise<FileStat> {
    const node = await getNodeByIdOrNode(nodeId) as FileStat;
    //
    const fileIdSet = new Set<number>();
    const fileMap = new Map<number, FileCol>();
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

type FileStat = NodeCol & {
    file?: {
        preview?: FileCol,
        normal?: FileCol,
        cover?: FileCol,
        raw?: FileCol,
        [key: string]: FileCol | undefined,
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
} as NodeCol;