import * as crypto from "node:crypto";
import * as Config from "../Config";
import {col_node, col_node_file_index, type_file} from "../../share/Database";
import NodeModel from "../model/NodeModel";
import FavouriteModel from "../model/FavouriteModel";
import * as fs from 'fs/promises';
import util from "util";
import QueueModel from "../model/QueueModel";
import ORM from "./ORM";

const exec = util.promisify(require('child_process').exec);

export const selNodeCol = [
    'id',
    'id_parent',
    'type',
    'title',
    'description',
    'node_id_list',
    'node_path',
    'file_index',
    'status',
    'building',
    'tag_id_list',
    'time_create',
    'time_update',
];

/**
 * 已存在文件时会根据 fileKey 自动替换文件
 * 主要用于生成文件
 * */
export async function put(
    tmpLocalFilePath: string,
    parent: string | number | col_node, fileName: string,
    fileKey: 'preview' | 'normal' | 'cover' | 'raw' = 'raw'
    , ext?: string
) {
    const parentNode = await get(parent);
    if (!parentNode) throw new Error('parentNode not found');
    if (parentNode.type !== 'directory') throw new Error('parentNode is not a directory');
    //
    const title = titleFilter(fileName);
    const type = getType(extension(title));
    //
    const ifExs = await ifTitleExist(parentNode, title);
    //
    const targetLocalPath = mkLocalPath(mkRelPath({
        title: title,
        node_path: mkRelPath(parentNode),
    }, fileKey, ext));
    console.info(tmpLocalFilePath, targetLocalPath);
    await rename(tmpLocalFilePath, targetLocalPath);

    //
    let res: col_node;
    if (ifExs) {
        const targetFileIndex = ifExs.file_index;
        targetFileIndex[fileKey] = {size: 0, checksum: [], ext: ext};
        await (new NodeModel).where('id', ifExs.id).update({
            file_index: targetFileIndex
        });
        res = ifExs;
    } else {
        const ins: col_node = {
            type: type,
            title: title,
            description: '',
            id_parent: parentNode.id,
            node_id_list: [...parentNode.node_id_list, parentNode.id],
            node_path: mkRelPath(parentNode),
            file_index: {
                raw: {size: 0, checksum: [], ext: ext}
            },
            cascade_status: 1,
            status: 1,
            building: 1,
        };
        const insRes = await (new NodeModel).insert(ins) as col_node[];
        ins.id = insRes[0].id;
        res = ins;
    }
    //
    return res;
}

export async function ls(input: string | number | col_node) {
    const cur = await get(input);
    const ls = await (new NodeModel).where('id_parent', cur.id).select(selNodeCol);
    return ls;
}

export async function get(input: string | number | col_node): Promise<null | col_node> {
    switch (typeof input) {
        case 'bigint':
        case 'number':
            if (input == 0) return rootNode;
            const node = await (new NodeModel).where('id', input).first(selNodeCol);
            return node;
            break;
        case 'string':
            const path = pathFilter(input);
            if (!path.length) return rootNode;
            const pathArr = path.split('/');
            let curNode = rootNode;
            for (let i1 = 0; i1 < pathArr.length; i1++) {
                curNode = await (new NodeModel)
                    .where('title', titleFilter(pathArr[i1]))
                    .where('id_parent', curNode.id)
                    .first(selNodeCol);
                if (!curNode) return null;
            }
            return curNode;
            break;
        default:
            return input;
            break;
    }
    return null;
}

export async function rm(srcNode: string | number | col_node) {
    const cur = await get(srcNode);
    if (!cur) throw new Error('node not found');
    await (new NodeModel).where('id', cur.id).update({
        status: cur.status ? 0 : 1,
    });
}

export async function rmReal(srcNode: string | number | col_node) {
    const cur = await get(srcNode);
    if (!cur) throw new Error('node not found');
    // console.info(cur);
    if (cur.type === "directory") {
        const subLs = await ls(cur);
        // console.info(subLs);
        // return;
        for (let i1 = 0; i1 < subLs.length; i1++) {
            await rmReal(subLs[i1]);
        }
    }
    // if (cur.file_index)
    //无论是否存在都遍历一次
    const fIndexKeyArr = [
        'preview',
        'normal',
        'cover',
        'raw',
    ];
    for (let i1 = 0; i1 < fIndexKeyArr.length; i1++) {
        const fIndexKey = fIndexKeyArr[i1] as any;
        const fIndex = cur?.file_index;
        let ext: string = null;
        if (fIndex && fIndex[fIndexKey]) {
            if ((fIndex[fIndexKey] as col_node_file_index).ext) {
                ext = (fIndex[fIndexKey] as col_node_file_index).ext;
            }
        }
        const localPath = mkLocalPath(mkRelPath(cur, fIndexKey, ext));
        if (!await ifLocalFileExists(localPath)) break;
        await fs.rm(localPath, {recursive: true, force: true});
    }
    await (new NodeModel).where('id', cur.id).delete();
    //收藏夹也要删除
    await (new FavouriteModel).where('id_node', cur.id).delete();
    //cls rel
    const relLs = await (new NodeModel)
        .where('rel_node_id', cur.id)
        // .where('status', '<>', -1)
        .select();
    if (relLs.length)
        for (let i1 = 0; i1 < relLs.length; i1++) {
            const curFileIndex = relLs[i1].file_index;
            if (!curFileIndex.rel) continue;
            delete curFileIndex.rel;
            await (new NodeModel).where('id', relLs[i1].id).update({file_index: curFileIndex});
        }
}

export async function rmFile(srcNode: string | number | col_node, fileKey: 'preview' | 'normal' | 'cover' | 'raw') {
    const node = await get(srcNode);
    const fileIndex = node.file_index[fileKey];
    const localPath = mkLocalPath(mkRelPath(node, fileKey, fileIndex.ext));
    await fs.rm(localPath, {
        // recursive:true,
        force: true,
    });
}

export async function mv(
    srcNode: string | number | col_node, targetDir: string | number | col_node
    , targetTitle: string = '', targetDescription: string = ''
): Promise<col_node[]> {
    const cur = await get(srcNode);
    if (!cur) throw new Error('node not found');
    //
    const localPath = mkLocalPath(mkRelPath(cur, 'raw'));
    const ifExs = await ifLocalFileExists(localPath);
    // console.info(localPath, ifExs, targetDir);
    if (!ifExs) throw new Error('local node not found');
    //
    const upd: col_node = {
        // title: titleFilter(targetTitle),
        // id_parent: targetDirNode.id,
        // node_id_list: [...targetDirNode.node_id_list, targetDirNode.id],
        // node_path: mkRelPath(targetDirNode),
    };
    if (targetDir == -1) {
        //纯改名
        if (!targetTitle || !targetTitle.length) throw new Error('no title');
    } else {
        //移动
        const targetDirNode = await get(targetDir);
        if (!targetDirNode) throw new Error('parentNode not found');
        //不能移动到子目录
        if (targetDirNode.node_id_list.indexOf(cur.id) !== -1)
            throw new Error('cannot mv to subNode');
        //检查一下新的上级
        const targetDirPath = mkRelPath(targetDirNode);
        const targetDirLocalPath = mkLocalPath(targetDirPath);
        const ifTargetExs = await ifLocalFileExists(targetDirLocalPath);
        if (!ifTargetExs) throw new Error('local target dir not found');
        //
        upd.id_parent = targetDirNode.id;
        upd.node_id_list = [...targetDirNode.node_id_list, targetDirNode.id];
        upd.node_path = mkRelPath(targetDirNode);
    }
    //
    if (targetTitle && targetTitle.length) {
        upd.title = titleFilter(targetTitle);
        if (!upd.title) throw new Error('invalid title');
        if (upd.title == cur.title) return [cur];
        if (await ifTitleExist(cur.id_parent, upd.title)) throw new Error('file already exists');
        //
        upd.description = targetDescription;
    } else {
        //这边主要是方便移动文件
        upd.title = cur.title;
    }
    //先移动文件，再修改数据
    const typeLs = [
        'preview', 'normal', 'cover', 'raw',
    ];
    for (let i1 = 0; i1 < typeLs.length; i1++) {
        const type = typeLs[i1];
        let ext = null;
        if (cur.file_index[type]) {
            const curFileIndex = cur.file_index[type] as col_node_file_index;
            if (curFileIndex.ext) {
                ext = curFileIndex.ext;
            }
        }
        let curNodeLocalPath = mkLocalPath(mkRelPath(cur, type as any, ext));
        if (!await ifLocalFileExists(curNodeLocalPath)) continue;
        let targetNodeLocalPath = mkLocalPath(mkRelPath(upd, type as any, ext));
        // console.info(curNodeLocalPath, targetNodeLocalPath);
        await rename(curNodeLocalPath, targetNodeLocalPath);
    }
    //
    await (new NodeModel).where('id', cur.id).update(upd);
    if (cur.type === 'directory') {
        await (new QueueModel).insert({
            type: 'file/cascadeMoveFile',
            payload: {id: cur.id},
            status: 1,
        });
    }
    //清理封面
    if (cur.node_id_list && cur.node_id_list.length) {
        const parentLs = await new NodeModel().whereIn('id', cur.node_id_list).select([
            'id', 'rel_node_id', 'file_index'
        ]);
        if (parentLs.length) {
            // console.info(parentLs);
            for (let i1 = 0; i1 < parentLs.length; i1++) {
                const parentNode = parentLs[i1];
                if (!parentNode.rel_node_id) continue;
                const coverNode = await new NodeModel().where('id', parentNode.rel_node_id).first([
                    'id',
                    'node_id_list',
                ]);
                if (!coverNode.node_id_list || !coverNode.node_id_list.length) continue;
                if (
                    !(coverNode.node_id_list.indexOf(cur.id) !== -1 || coverNode.id === cur.id)
                ) continue;
                const parentNodeFileIndex = parentNode.file_index;
                delete parentNodeFileIndex.rel;
                await new NodeModel().where('id', parentNode.id).update({
                    file_index: parentNodeFileIndex,
                });
            }
        }
    }
    //
    return [cur];
}

/**
 * 旧版主要是用于webdav的，目前不用了，所以根据web版本重新适配
 * */
export async function cp(
    srcNode: string | number | col_node, targetDir: string | number | col_node
    , targetTitle: string = '', targetDescription: string = ''
) {
    const cur = await get(srcNode);
    if (!cur) throw new Error('node not found');
    //
    const localPath = mkLocalPath(mkRelPath(cur, 'raw'));
    const ifExs = await ifLocalFileExists(localPath);
    // console.info(localPath, ifExs, targetDir);
    if (!ifExs) throw new Error('local node not found');
    let targetDirNode: col_node;
    if (targetDir == -1) {
        targetDirNode = await get(cur.id_parent);
    } else {
        targetDirNode = await get(targetDir);
    }
    if (!targetDirNode) throw new Error('parentNode not found');
    //
    const ins: col_node = {
        type: cur.type,
        title: cur.title,
        description: cur.description,
        id_parent: targetDirNode.id,
        node_id_list: [...targetDirNode.node_id_list, targetDirNode.id],
        node_path: mkRelPath(targetDirNode),
        file_index: cur.file_index,
        tag_id_list: cur.tag_id_list,
        node_index: cur.node_index,
        status: cur.status,
        cascade_status: cur.cascade_status,
        building: cur.building,
    };
    //删掉关联文件，去索引里面重建
    if (ins.file_index.rel) delete ins.file_index.rel;
    //
    if (targetTitle && targetTitle.length) {
        ins.title = titleFilter(targetTitle);
        if (!ins.title) throw new Error('invalid title');
        ins.description = targetDescription;
    } else {
        //这边主要是方便移动文件
        ins.title = cur.title;
    }
    //检测文件名重复
    const neighbourNodeLs = await new NodeModel()
        .where('id_parent', ins.id_parent)
        .select(['id', 'title'])
    ;
    const neighbourTitleSet = new Set<string>();
    neighbourNodeLs.forEach(node => neighbourTitleSet.add(node.title));
    if (neighbourTitleSet.has(ins.title)) {
        let insTitleInd = 0;
        const fileName = filename(ins.title);
        const suffix = extension(ins.title);
        do {
            insTitleInd += 1;
            let tTitle = titleFilter(`${fileName} (${insTitleInd})${suffix.length ? '.' + suffix : ''}`);
            if (!neighbourTitleSet.has(tTitle)) {
                ins.title = tTitle;
                break;
            }
        } while (true);
    }
    //
    const typeLs = [
        'preview', 'normal', 'cover', 'raw',
    ];
    for (let i1 = 0; i1 < typeLs.length; i1++) {
        const type = typeLs[i1];
        let ext = null;
        if (cur.file_index[type]) {
            const curFileIndex = cur.file_index[type] as col_node_file_index;
            if (curFileIndex.ext) {
                ext = curFileIndex.ext;
            }
        }
        let curNodeLocalPath = mkLocalPath(mkRelPath(cur, type as any, ext));
        if (!await ifLocalFileExists(curNodeLocalPath)) continue;
        let targetNodeLocalPath = mkLocalPath(mkRelPath(ins, type as any, ext));
        // console.info(type, curNodeLocalPath, targetNodeLocalPath);
        await copy(curNodeLocalPath, targetNodeLocalPath);
    }
    //
    const insNode = await (new NodeModel).insert(ins) as col_node[];
    ins.id = insNode[0].id;
    if (cur.type === 'directory') {
        await (new QueueModel).insert({
            type: 'file/cascadeCopyFile',
            payload: {src: cur.id, target: ins.id},
            status: 1,
        });
    }
    return ins;
}

export async function mkdir(
    parent: string | number | col_node
    , title: string, description: string = ''
): Promise<null | col_node> {
    const parentNode = await get(parent);
    if (!parentNode) throw new Error('parentNode not found');
    title = titleFilter(title);
    const ifExs = await ifTitleExist(parentNode, title);
    const parentPath = mkRelPath(parentNode);
    const localPath = mkLocalPath(
        parentPath.length ? parentPath + '/' + title : title
    );
    //
    if (!await ifLocalFileExists(localPath)) {
        //mkdir至少需要0755，否则nginx报错
        await fs.mkdir(localPath, {recursive: true, mode: 0o777});
    }
    if (ifExs) return ifExs;
    let newNode: col_node = {}
    newNode = {
        id_parent: parentNode.id,
        type: 'directory',
        title: title,
        description: description,
        node_id_list: [...parentNode.node_id_list, parentNode.id],
        node_path: parentPath,
        file_index: {},
        status: 1,
        building: 0,
    };
    const res = (await (new NodeModel).insert(newNode)) as col_node[];
    const id = parseInt(res[0].id as unknown as string);
    newNode.id = id;
    return newNode;
}

export async function ifLocalFileExists(localPath: string) {
    try {
        await fs.access(localPath);
        return true;
    } catch (e: any) {
        // console.info(e);
        return false;
    }
}

export function mkRelPath(node: col_node,
                          withPrefix?: 'temp' | 'preview' | 'normal' | 'cover' | 'raw',
                          ext?: string
) {
    const pathConfig = Config.get('path');
    let pathPrefix = '';
    switch (withPrefix) {
        default:
            break;
        case 'preview':
        case 'normal':
        case 'cover':
            pathPrefix = pathConfig['prefix_' + withPrefix] + '/';
            break;
    }
    //root单独做一下
    if (node.id === 0) {
        return pathPrefix;
    }
    const nodePath =
        pathPrefix +
        //去/
        (node.node_path.length ? node.node_path + '/' : '') +
        node.title +
        (ext ? '.' + ext : '')
    ;
    return nodePath;
}

export function mkLocalPath(fullRelPath: string) {
    let ext = '';
    const pathConfig = Config.get('path');
    /*switch (method) {
        case "temp":
        case "preview":
        case "normal":
        case "cover":
            ext = pathConfig[method];
            break;
    }*/
    return `${pathConfig.root}/${pathFilter(fullRelPath)}`;
}

export async function ifTitleExist(parent: string | number | col_node, title: string) {
    const parentNode = await get(parent);
    if (!parentNode) throw new Error('parentNode not found');
    return await (new NodeModel).where('id_parent', parentNode.id).where('title', title).first();
}

export async function buildWebPath(nodeList: col_node[]) {
    const relNodeIdSet = new Set<number>();
    for (let i1 = 0; i1 < nodeList.length; i1++) {
        const node = nodeList[i1];
        if (node.file_index.rel) relNodeIdSet.add(node.file_index.rel);
    }
    const relNodeMap = new Map<number, col_node>();
    if (relNodeIdSet.size) {
        const relNodeLs = await (new NodeModel).whereIn('id', Array.from(relNodeIdSet)).select([
            'id', 'node_path', 'title', 'file_index',
        ]);
        relNodeLs.forEach(relNode => {
            relNodeMap.set(relNode.id, relNode);
        });
    }
    const pathConf = Config.get('path');
    for (let i1 = 0; i1 < nodeList.length; i1++) {
        const node = nodeList[i1];
        for (const typeKey in node.file_index) {
            switch (typeKey) {
                case 'rel':
                    const relNodeId = <number>node.file_index.rel;
                    if (!relNodeMap.has(relNodeId)) break;
                    const relNode = relNodeMap.get(relNodeId);
                    //rel只映射cover
                    for (const relTypeKey in relNode.file_index) {
                        const fileIndex = relNode.file_index[relTypeKey];
                        if (!fileIndex || typeof fileIndex === 'number') continue;
                        switch (relTypeKey) {
                            case 'cover':
                                // case 'preview':
                                // case 'normal':
                                // case 'raw':
                                // relNode.file_index[relTypeKey].path = pathConf.root_web + '/' + mkRelPath(relNode, relTypeKey, fileIndex.ext);
                                node.file_index[relTypeKey] = relNode.file_index[relTypeKey];
                                node.file_index[relTypeKey].path = pathConf.root_web + '/' + mkRelPath(relNode, relTypeKey, fileIndex.ext);
                                break;
                        }
                    }
                    // node.file_index = relNode.file_index;
                    break;
                case 'cover':
                case 'preview':
                case 'normal':
                case 'raw':
                    const fileIndex = node.file_index[typeKey];
                    if (!fileIndex || typeof fileIndex === 'number') continue;
                    node.file_index[typeKey].path = pathConf.root_web + '/' + mkRelPath(node, typeKey, fileIndex.ext);
                    break;
            }
        }
        if (node.file_index.raw && !node.file_index.normal) {
            node.file_index.normal = node.file_index.raw;
        }
        if (node.type === 'image' && node.file_index.normal && !node.file_index.preview) {
            node.file_index.preview = node.file_index.normal;
        }
        // if (node.type === 'image' && node.file_index.preview && !node.file_index.cover) {
        //     node.file_index.cover = node.file_index.preview;
        // }
        if (!node.file_index.rel) {
            if (node.file_index.preview && !node.file_index.cover) {
                node.file_index.cover = node.file_index.preview;
            }
            if (node.file_index.cover && !node.file_index.preview) {
                node.file_index.preview = node.file_index.cover;
            }
        }
    }
    return nodeList;
}

/**
 * 文件夹不存在时会自动创建文件夹，文件重复时会自动覆盖
 * */
export async function rename(srcPath: string, targetPath: string) {
    let hasErr;
    if (srcPath == targetPath) return true;
    const targetDir = dirname(targetPath);
    const ifDirExs = await ifLocalFileExists(targetDir);
    if (!ifDirExs) {
        await fs.mkdir(targetDir, {recursive: true, mode: 0o777,});
    }
    const ifTargetExs = await ifLocalFileExists(targetPath);
    if (ifTargetExs) {
        await fs.rm(targetPath, {recursive: true, force: true});
    }
    //
    hasErr = null;
    try {
        await fs.rename(srcPath, targetPath);
        await fs.chmod(targetPath, 0o777);
        return true;
    } catch (e) {
        hasErr = e;
        console.info(hasErr);
    }
    //
    hasErr = null;
    try {
        await fs.cp(srcPath, targetPath, {recursive: true, force: true});
        await fs.rm(srcPath, {recursive: true, force: true});
        await fs.chmod(targetPath, 0o777);
        return true;
    } catch (e) {
        hasErr = e;
        console.info(hasErr);
    }
    //
    if (hasErr) throw hasErr;
    return true;
}

export async function copy(srcPath: string, targetPath: string) {
    let hasErr;
    const targetDir = dirname(targetPath);
    const ifDirExs = await ifLocalFileExists(targetDir);
    if (!ifDirExs) {
        await fs.mkdir(targetDir, {recursive: true, mode: 0o777,});
    }
    //
    hasErr = null;
    try {
        await fs.cp(srcPath, targetPath, {recursive: true, force: true});
        // await fs.chmod(targetPath, 0o666);
        return true;
    } catch (e) {
        hasErr = e;
    }
    if (hasErr) throw hasErr;
    return true;
}

export function genTmpPath(suffix: string) {
    const uuidFN = uuid();
    return Config.get().path.temp + '/' + uuidFN + '.' + suffix;
}

//---------------------- helper ----------------------

export const rootNode: col_node = {
    id: 0,
    id_parent: 0,
    type: 'directory',
    title: 'root',
    description: '',
    node_id_list: [],
    node_path: '',
    file_index: {},
    status: 1,
    building: 0,
    tag_id_list: [],
    node_index: {
        title: '',
        description: '',
        tag: [],
    },
    time_create: '1919-08-10 11:45:14',
    time_update: '1919-08-10 11:45:14',
};

export function uuid(): string {
    return crypto.randomBytes(24).toString("base64url");
}

export function dirname(filePath: string): string {
    filePath = rtrimSlash(filePath);
    const lastSlash = filePath.lastIndexOf('/');
    return filePath.substring(0, lastSlash);
}

export function basename(filePath: string): string {
    filePath = rtrimSlash(filePath);
    const lastSlash = filePath.lastIndexOf('/');
    return filePath.substring(lastSlash + 1);
}

export function filename(filePath: string): string {
    const fileName = basename(filePath);
    const suffixOffset = fileName.lastIndexOf('.');
    //
    return fileName.slice(0, suffixOffset);
}

export function extension(filePath: string): string {
    const fileName = basename(filePath);
    const suffixOffset = fileName.lastIndexOf('.');
    //
    let suffix = '';
    if (suffixOffset > 0) {
        suffix = fileName.slice(suffixOffset + 1);
        if (suffix.length > 6) suffix = '';
        else suffix = suffix.toLowerCase();
    }
    return suffix;
}

export function getType(suffix: string): type_file {
    let ifHit = -1;
    // console.info(suffix);
    for (const key in Config.get().suffix) {
        ifHit = Config.get().suffix[key].indexOf(suffix);
        if (ifHit === -1) continue;
        return key as type_file;
    }
    return 'binary';
}

export function titleFilter(title: string) {
    return title.replace(/[`\\\/:*?"<>|#%　\s]+/igm, ' ').trim();
}

export function pathFilter(path: string) {
    return path
        .replace(/^[\.\/\s]*\//g, '')
        .replace(/\/[\.\/\s]*$/g, '')
        .replace(/\/\.*\//g, '/')
        ;
}

export function trimSlash(str: string) {
    return ltrimSlash(rtrimSlash(str));
}

export function ltrimSlash(str: string) {
    if (!str || !str.length) return '';
    str = str.trim();
    if (str.indexOf('/') !== 0) return str;
    return ltrimSlash(str.substring(1, str.length));
}

export function rtrimSlash(str: string) {
    if (!str || !str.length) return '';
    str = str.trim();
    if (str.lastIndexOf('/') !== str.length - 1) return str;
    return rtrimSlash(str.substring(0, str.length - 1));
}

export function bashTitleFilter(str: string) {
    if (Config.get('windows')) return str;
    return str.replaceAll('`', '\\`');
}

export async function checksum(localPath: string): Promise<string[]> {
    const checksumExecLs = Config.get('checksum');
    //
    let hashArr: string[] = [];
    for (let i1 = 0; i1 < checksumExecLs.length; i1++) {
        let hash = ''
        try {
            const cmd = `${checksumExecLs[i1]} "${bashTitleFilter(localPath)}"`;
            const {stdout, stderr} = await exec(cmd);
            hash = stdout.substring(0, stdout.indexOf(' '));
            // console.info(stdout);
            // console.info(stdout.split(/\s/));
            // console.info(stdout.indexOf(' '));
            // console.info(stdout.indexOf('\t'));
        } catch (e) {
            console.info(e);
        }
        hashArr.push(hash);
    }
    return hashArr;
}
