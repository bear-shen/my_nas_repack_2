import * as fs from "fs/promises";
import * as fsNP from "fs";
import FileModel from "../model/FileModel";
import Config from "../Config";
import NodeModel from "../model/NodeModel";
import TagModel from "../model/TagModel";
import TagGroupModel from "../model/TagGroupModel";
import * as Buffer from "buffer";
import QueueModel from "../model/QueueModel";
import { Stats } from "node:fs";
import Util from "./Util";
import { ExecException } from "child_process";
import { FileCol, FileType, NodeCol } from "../../share/database";

const util = require('util');
const crypt = require('crypto');
const child_process = require('child_process');

function getFileHash(input: string): Promise<string> {
    return new Promise((resolve) => {
        child_process.exec(
            Config.hashFunction.replace('{fileName}', input),
            (e: ExecException, stdout: string, stderr: string,) => {
                resolve(stdout.trim());
            }
        );
    })
}

async function makeFileDir(sourcePath: string, isRel: boolean = true): Promise<string> {
    // const root = process.cwd();
    const filePath = (isRel ? Config.fileRoot : '') + sourcePath;
    const dirIndex = filePath.lastIndexOf('/');
    const dirPath = filePath.slice(0, dirIndex);
    // console.info(dirPath);
    try {
        await fs.stat(dirPath);
    } catch (e) {
        // console.info('mkdir',dirPath);
        await fs.mkdir(dirPath, { recursive: true, mode: 0o777 });
        return filePath;
    }
    return filePath;
}

function makeHashPath(hash: string): string {
    return `${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash.slice(4)}`.trim();
    // return `${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash.slice(4, 32)}`;
}

function makePath(
    pre: 'web' | 'local' | 'rel',
    fileType: FileType | 'temp' | string,
    hash: string,
    suffix: string,
): string {
    let root = '';
    switch (pre) {
        case "local":
            root = Config.fileRoot
            break;
        case "web":
            root = Config.webFileRoot
            break;
        default:
        case "rel":
            break;
    }
    const hashPath = makeHashPath(hash);
    return `${root}${fileType}/${hashPath}${suffix ? '.' + suffix : ''}`;
}

function getSuffixByName(fileName: string): string {
    const suffixOffset = fileName.lastIndexOf('.');
    // console.info(suffixOffset);
    let suffix = '';
    if (suffixOffset > 0) {
        suffix = fileName.slice(suffixOffset + 1);
        console.info(suffix.length);
        if (suffix.length > 5) suffix = '';
        else suffix = suffix.toLowerCase();
    }
    return suffix;
}

function getTypeBySuffix(suffix: string): FileType {
    let fileType;
    for (const type in Config.suffixRef) {
        // console.info(Config.suffixRef[type], suffix, Config.suffixRef[type].indexOf(suffix),);
        if (Config.suffixRef[type].indexOf(suffix) !== -1) {
            fileType = type;
            break;
        }
        if (fileType) break;
    }
    if (!fileType) fileType = 'binary';
    return fileType as any;
}

async function setFile(
    fileType: FileType,
    fileHash: string,
    suffix: string,
    size: number,
    //false不处理实际文件，dav用
    tmpPath: string | boolean,
    copy: boolean = false
): Promise<FileCol> {
    const rawRelPath = makePath('rel', fileType, fileHash, suffix);
    //
    const ifDupFile = await (new FileModel).where('hash', fileHash).first();
    let fileData = {} as FileCol;
    if (ifDupFile) fileData = ifDupFile;
    else {
        if (tmpPath) {
            const rawPath = await makeFileDir(rawRelPath, true);
            try {
                await fs.stat(rawPath)
            } catch (e) {
                if (copy) await fs.copyFile(tmpPath as string, rawPath);
                else await fs.rename(tmpPath as string, rawPath);
            }
        }
        fileData = {
            hash: fileHash,
            type: fileType,
            suffix: suffix,
            path: rawRelPath,
            meta: {},
            size: size,
            status: tmpPath ? 1 : 0,
        };
        const insFileResult = await (new FileModel).insert(fileData);
        fileData.id = insFileResult.insertId;
    }
    return fileData;
}

async function setNode(
    parent_id: string | number,
    fileName: string,
    fileData: FileCol,
): Promise<NodeCol> {
    let pid = parseInt(parent_id as string);
    let parentNode;
    if (pid) parentNode = await (new NodeModel()).where('type', 'directory').where('id', pid).first();
    if (!parentNode) pid = 0;
    let nodeData = {} as NodeCol;
    //重复节点，检测文件，如果是raw不同，重命名，raw相同，不管
    while (true) {
        const ifDupNode = await (new NodeModel())
            .where('id_parent', pid)
            .where('title', fileName)
            .first();
        if (!ifDupNode) break;
        // nodeData = ifDupNode;
        //同file，不管
        if (fileData.id === ifDupNode.index_file_id.raw) {
            return ifDupNode;
        }
        //重命名，继续写
        const suffixIndex = fileName.lastIndexOf('.');
        const newNameArr = Array.from(fileName);
        newNameArr.splice(suffixIndex, 0, '_');
        fileName = newNameArr.join('');
    }
    let fileIdList = {} as { [key: string]: number };
    let hasBuildFile = false;
    //如果文件已经存在，检测是否有对应的节点，如果有，复制过去
    if (fileData.time_create) {
        const dupFileNode = await (new NodeModel())
            .whereRaw("JSON_CONTAINS(index_file_id, ?, '$.raw')", fileData.id)
            .first();
        if (dupFileNode) {
            fileIdList = dupFileNode.index_file_id;
            hasBuildFile = true;
        }
    }
    if (!fileIdList.raw) {
        fileIdList.raw = fileData.id;
    }
    //
    nodeData = {
        id_parent: pid,
        // id_cover: number,
        // id_file: fid,
        type: fileData.type,
        title: fileName,
        description: '',
        sort: 0,
        // status: hasBuildFile ? 1 : 2,
        status: 1,
        building: hasBuildFile ? 0 : 1,
        list_node: parentNode ? [...parentNode.list_node, parentNode.id] : [0],
        list_tag_id: [],
        index_node: {},
        index_file_id: fileIdList,
    } as NodeCol;
    const insNodeResult = await (new NodeModel()).insert(nodeData);
    nodeData.id = insNodeResult.insertId;
    //webdav中创建文件时status=0，不处理文件
    if (!fileData.status) return nodeData;
    if (!hasBuildFile) {
        //这边要个id，所以后面再写，语法很奇怪
        await (new QueueModel).insert({
            type: 'file/build',
            status: 1,
            payload: { id: nodeData.id },
        });
    }
    await (new QueueModel).insert({
        type: 'index/node',
        status: 1,
        payload: { id: nodeData.id },
    });
    return nodeData;
}

async function setCover(parent_id: number, node_id: number) {
    const parentNode = await (new NodeModel).where('id', parent_id).first();
    if (!parentNode) throw new Error('parent not found');
    const itemNode = await (new NodeModel).where('id', node_id).first();
    let coverId = 0;
    if (itemNode && itemNode.index_file_id.cover) {
        coverId = itemNode.index_file_id.cover;
    }
    if (coverId === parentNode.index_file_id.cover) {
        coverId = 0;
    }
    parentNode.index_file_id.cover = coverId;
    await (new NodeModel).where('id', parentNode.id).update({
        index_file_id: parentNode.index_file_id,
    });
    return;
}

async function deleteFile(fromPath: string, depth: number = 2): Promise<any> {
    let ifExs: Stats | boolean;
    // console.info('0:', fromPath);
    try {
        ifExs = await fs.stat(fromPath);
    } catch (e: any) {
        ifExs = false;
    }
    // console.info('1:', ifExs);
    if (!ifExs) return;
    console.info('del', depth, fromPath);
    if (ifExs.isFile()) {
        await fs.rm(fromPath);
    } else if (ifExs.isDirectory()) {
        await fs.rmdir(fromPath);
    }
    // console.info('2:', depth);
    if (!depth) return;
    //
    let dirIndex = fromPath.lastIndexOf('/');
    // console.info('3:', dirIndex);
    if (dirIndex < 1) return;
    let dirPath = fromPath.slice(0, dirIndex);
    let subs = await fs.readdir(dirPath);
    // console.info('4:', subs);
    if (subs && subs.length) return;
    //
    // console.info('5:', subs);
    return await deleteFile(dirPath, depth - 1);
}

async function deleteForever(fileId: number) {
    const ifOrphan = await countFile(fileId);
    if (ifOrphan > 1) return;
    const file = await (new FileModel).where('id', fileId).first();
    if (!file) return;
    // console.info(file, fileId);
    const localPath = makePath('local', file.type, file.hash, file.suffix);
    await deleteFile(localPath);
    await (new FileModel).where('id', fileId).delete();
}

//判断文件被几个节点使用
async function countFile(fileId: number) {
    //永久删除的时候孤立的节点也需要删除
    const nodeCount = await (new NodeModel())
        .whereRaw("JSON_CONTAINS(index_file_id, ?, '$.raw')", fileId).or()
        .whereRaw("JSON_CONTAINS(index_file_id, ?, '$.normal')", fileId).or()
        .whereRaw("JSON_CONTAINS(index_file_id, ?, '$.preview')", fileId).or()
        .whereRaw("JSON_CONTAINS(index_file_id, ?, '$.cover')", fileId).or()
        .count();
    return nodeCount ? nodeCount : 0;
}

async function moveFile(node: NodeCol, targetDir: NodeCol, copy: boolean = false) {
    if (copy) {
        const nodeInsRes = await (new NodeModel())
            .insert({
                // id           : sub.id,
                id_parent: targetDir.id,
                type: node.type,
                title: node.title,
                description: node.description,
                sort: node.sort,
                status: node.status,
                building: node.building,
                list_node: [...targetDir.list_node, targetDir.id],
                list_tag_id: node.list_tag_id,
                index_file_id: node.index_file_id,
                index_node: node.index_node,
            });
        if (node.building) {
            if (node.type !== 'directory') {
                await (new QueueModel).insert({
                    type: 'file/build',
                    status: 1,
                    payload: { id: nodeInsRes.insertId },
                });
            }
            await (new QueueModel).insert({
                type: 'index/node',
                status: 1,
                payload: { id: nodeInsRes.insertId },
            });
        }
    } else {
        await (new NodeModel()).where('id', node.id)
            .update({
                title: node.title,
                id_parent: targetDir.id,
                list_node: [...targetDir.list_node, targetDir.id]
            });
    }
    if (node.type !== 'directory') return;
    const subs = await (new NodeModel).whereRaw('find_in_set( ? , list_node)', node.id).select();
    if (!subs || !subs.length) return;
    for (const sub of subs) {
        const pIndex = sub.list_node.indexOf(node.id);
        if (pIndex === -1) continue;
        const targetNodeList = [...targetDir.list_node, targetDir.id, ...sub.list_node.slice(pIndex)];
        if (copy) {
            const nodeInsRes = await (new NodeModel())
                .insert({
                    // id           : sub.id,
                    id_parent: sub.id_parent,
                    type: sub.type,
                    title: sub.title,
                    description: sub.description,
                    sort: sub.sort,
                    status: sub.status,
                    building: sub.building,
                    list_node: targetNodeList,
                    list_tag_id: sub.list_tag_id,
                    index_file_id: sub.index_file_id,
                    index_node: sub.index_node,
                });
            if (sub.building) {
                if (sub.type !== 'directory') {
                    await (new QueueModel).insert({
                        type: 'file/build',
                        status: 1,
                        payload: { id: nodeInsRes.insertId },
                    });
                }
                await (new QueueModel).insert({
                    type: 'index/node',
                    status: 1,
                    payload: { id: nodeInsRes.insertId },
                });
            }
        } else {
            await (new NodeModel()).where('id', sub.id)
                .update({
                    list_node: targetNodeList
                });
        }
    }
}

//这个想了一想好像真的没什么用，不少地方会有业务代码。。。
async function getFileStat(path: string): Promise<Stats | null> {
    try {
        return await fs.stat(path);
    } catch (e: any) {
        return null;
    }
}

export default {
    getFileHash,
    makeFileDir,
    makeHashPath,
    makePath,
    getSuffixByName,
    getTypeBySuffix,
    setFile,
    setNode,
    setCover,
    deleteForever,
    countFile,
    deleteFile,
    moveFile,
    getFileStat,
};
