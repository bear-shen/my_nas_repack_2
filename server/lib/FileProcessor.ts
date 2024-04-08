import * as crypto from "node:crypto";
import {get as getConfig} from "../ServerConfig";
import {col_node, type_file} from "../../share/Database";
import NodeModel from "../model/NodeModel";
import * as fs from 'fs/promises';
import util from "util";

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
) {
    const parentNode = await get(parent);
    if (!parentNode) throw new Error('parentNode not found');
    if (parentNode.type !== 'directory') throw new Error('parentNode is not a directory');
    //
    const title = titleFilter(fileName);
    const type = getType(extension(title))
    //
    const ifExs = await ifTitleExist(parentNode, title);
    //
    const targetLocalPath = mkLocalPath(mkRelPath({
        title: title,
        node_path: mkRelPath(parentNode),
    }, fileKey));
    console.info(tmpLocalFilePath, targetLocalPath);
    await rename(tmpLocalFilePath, targetLocalPath);

    //
    let res: col_node;
    if (ifExs) {
        const targetFileIndex = ifExs.file_index;
        targetFileIndex[fileKey] = {size: 0, checksum: [],};
        await (new NodeModel).where('id', ifExs.id).update({
            file_index: targetFileIndex
        });
        res = ifExs;
    } else {
        //
        const ins: col_node = {
            type: type,
            title: title,
            description: '',
            id_parent: parentNode.id,
            node_id_list: [...parentNode.node_id_list, parentNode.id],
            node_path: mkRelPath(parentNode),
            file_index: {
                raw: {size: 0, checksum: []}
            },
            status: 1,
            building: 1,
        };
        const insRes = await (new NodeModel).insert(ins);
        ins.id = insRes.insertId;
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
        const pathArr = ['preview', 'normal', 'cover', 'raw',];
        for (let i = 0; i < pathArr.length; i++) {
            const localPath = mkLocalPath(mkRelPath(cur, <'preview' | 'normal' | 'cover' | 'raw'>pathArr[i]));
            if (await ifLocalFileExists(localPath)) {
                await fs.rm(localPath, {recursive: true, force: true});
            }
        }
    } else {
        for (const key in cur.file_index) {
            switch (key) {
                case 'preview':
                case 'normal':
                case 'cover':
                case 'raw':
                    const localPath = mkLocalPath(mkRelPath(cur, key));
                    if (!await ifLocalFileExists(localPath)) break;
                    await fs.rm(localPath, {recursive: true, force: true});
                    break;
            }
        }
    }
    await (new NodeModel).where('id', cur.id).delete();
    //cls rel
    const relLs = await (new NodeModel)
        .whereRaw("JSON_VALUE(file_index, '$.rel') = ?", cur.id)
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
    const localPath = mkLocalPath(mkRelPath(node, fileKey));
    await fs.rm(localPath, {
        // recursive:true,
        force: true,
    });
}

export async function mv(
    srcNode: string | number | col_node, targetDir: string | number | col_node
    , targetTitle: string = '', targetDescription: string = ''
) {
    const cur = await get(srcNode);
    if (!cur) throw new Error('node not found');
    //
    const localPath = mkLocalPath(mkRelPath(cur, 'raw'));
    const ifExs = await ifLocalFileExists(localPath);
    // console.info(localPath, ifExs);
    if (!ifExs) throw new Error('local node not found');
    //不输入target的时候只进行重命名，这个用于批量处理
    if (targetDir == -1) {
        if (!targetTitle) throw new Error('no title');
        //
        const upd: col_node = {
            title: titleFilter(targetTitle),
            // node_path: cur.node_path,
        };
        if (upd.title == cur.title) return;
        if (await ifTitleExist(cur.id_parent, upd.title)) throw new Error('file already exists');
        // let targetNodeLocalPath = mkLocalPath(mkRelPath(upd));
        // console.info('mv to', localPath, targetNodeLocalPath, upd);
        // return;
        for (const key in cur.file_index) {
            switch (key) {
                case 'preview':
                case 'normal':
                case 'cover':
                case 'raw':
                    let curNodeLocalPath = mkLocalPath(mkRelPath(cur, key));
                    let targetNodeLocalPath = mkLocalPath(mkRelPath(upd, key));
                    await rename(curNodeLocalPath, targetNodeLocalPath);
                    break;
            }
        }
        // await rename(localPath, targetNodeLocalPath);
        //
        await (new NodeModel).where('id', cur.id).update(upd);
        return;
    }
    const targetDirNode = await get(targetDir);
    if (!targetDirNode) throw new Error('parentNode not found');
    if (targetDirNode.node_id_list.indexOf(cur.id) !== -1)
        throw new Error('cannot mv to subNode');
    //
    const targetDirPath = mkRelPath(targetDirNode);
    const targetDirLocalPath = mkLocalPath(targetDirPath);
    const ifTargetExs = await ifLocalFileExists(targetDirLocalPath);
    if (!ifTargetExs) throw new Error('local target dir not found');
    //
    const upd: col_node = {
        id_parent: targetDirNode.id,
        node_id_list: [...targetDirNode.node_id_list, targetDirNode.id],
        node_path: mkRelPath(targetDirNode),
    };
    if (targetTitle.length) {
        upd.title = titleFilter(targetTitle);
        if (!upd.title) throw new Error('invalid title');
        upd.description = targetDescription;
    } else {
        upd.title = cur.title;
    }
    //
    for (const key in cur.file_index) {
        switch (key) {
            case 'preview':
            case 'normal':
            case 'cover':
            case 'raw':
                let curNodeLocalPath = mkLocalPath(mkRelPath(cur, key));
                let targetNodeLocalPath = mkLocalPath(mkRelPath(upd, key));
                await rename(curNodeLocalPath, targetNodeLocalPath);
                break;
        }
    }
    //
    await (new NodeModel).where('id', cur.id).update(upd);
}

export async function cp(
    srcNode: string | number | col_node, targetDir: string | number | col_node
    , targetTitle: string = '', targetDescription: string = ''
) {
    const cur = await get(srcNode);
    if (!cur) throw new Error('node not found');
    //
    const localPath = mkLocalPath(mkRelPath(cur, 'raw'));
    const ifExs = await ifLocalFileExists(localPath);
    // console.info(localPath, ifExs);
    if (!ifExs) throw new Error('local node not found');
    //不输入target的时候只进行重命名，这个用于批量处理
    if (targetDir == -1) {
        if (!targetTitle) throw new Error('no title');
        //
        const ins: col_node = cur;
        delete ins.id;
        cur.title = titleFilter(targetTitle);
        if (ins.title == cur.title) return;
        if (await ifTitleExist(cur.id_parent, ins.title)) throw new Error('file already exists');
        // let targetNodeLocalPath = mkLocalPath(mkRelPath(upd));
        // console.info('mv to', localPath, targetNodeLocalPath, upd);
        // return;
        for (const key in ins.file_index) {
            switch (key) {
                case 'preview':
                case 'normal':
                case 'cover':
                case 'raw':
                    let curNodeLocalPath = mkLocalPath(mkRelPath(cur, key));
                    let targetNodeLocalPath = mkLocalPath(mkRelPath(ins, key));
                    await copy(curNodeLocalPath, targetNodeLocalPath);
                    break;
            }
        }
        // await rename(localPath, targetNodeLocalPath);
        //
        const insRes = await (new NodeModel).insert(ins);
        ins.id = insRes.insertId;
        return ins;
    }
    const targetDirNode = await get(targetDir);
    if (!targetDirNode) throw new Error('parentNode not found');
    if (targetDirNode.node_id_list.indexOf(cur.id) !== -1)
        throw new Error('cannot mv to subNode');
    //
    const targetDirPath = mkRelPath(targetDirNode);
    const targetDirLocalPath = mkLocalPath(targetDirPath);
    const ifTargetExs = await ifLocalFileExists(targetDirLocalPath);
    if (!ifTargetExs) throw new Error('local target dir not found');
    //
    const ins: col_node = cur;
    delete ins.id;
    Object.assign(ins, {
        id_parent: targetDirNode.id,
        node_id_list: [...targetDirNode.node_id_list, targetDirNode.id],
        node_path: mkRelPath(targetDirNode),
    });
    if (targetTitle.length) {
        ins.title = titleFilter(targetTitle);
        if (!ins.title) throw new Error('invalid title');
        ins.description = targetDescription;
    } else {
        ins.title = cur.title;
    }
    //
    for (const key in ins.file_index) {
        switch (key) {
            case 'preview':
            case 'normal':
            case 'cover':
            case 'raw':
                let curNodeLocalPath = mkLocalPath(mkRelPath(cur, key));
                let targetNodeLocalPath = mkLocalPath(mkRelPath(ins, key));
                await copy(curNodeLocalPath, targetNodeLocalPath);
                break;
        }
    }
    //
    const insRes = await (new NodeModel).insert(ins);
    ins.id = insRes.insertId;
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
    let newNode: col_node = {}
    if (!ifExs) {
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

        const id = (await (new NodeModel).insert(newNode)).insertId;
        newNode.id = id;
    } else newNode = ifExs;
    return ifExs;
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

export function mkRelPath(node: col_node, withPrefix?: 'temp' | 'preview' | 'normal' | 'cover' | 'raw') {
    const pathConfig = getConfig('path');
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
        node.title
    ;
    return nodePath;
}

export function mkLocalPath(fullRelPath: string) {
    let ext = '';
    const pathConfig = getConfig('path');
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
        const relNodeLs = await (new NodeModel).whereIn('id', Array.from(relNodeIdSet)).select();
        relNodeLs.forEach(relNode => {
            relNodeMap.set(relNode.id, relNode);
        });
    }
    const pathConf = getConfig('path');
    for (let i1 = 0; i1 < nodeList.length; i1++) {
        const node = nodeList[i1];
        for (const typeKey in node.file_index) {
            switch (typeKey) {
                case 'rel':
                    const relNodeId = <number>node.file_index.rel;
                    if (!relNodeMap.has(relNodeId)) break;
                    const relNode = relNodeMap.get(relNodeId)
                    for (const relTypeKey in relNode.file_index) {
                        switch (relTypeKey) {
                            case 'cover':
                            case 'preview':
                            case 'normal':
                            case 'raw':
                                relNode.file_index[relTypeKey].path = pathConf.root_web + '/' + mkRelPath(relNode, relTypeKey);
                                break;
                        }
                    }
                    node.file_index = relNode.file_index;
                    break;
                case 'cover':
                case 'preview':
                case 'normal':
                case 'raw':
                    node.file_index[typeKey].path = pathConf.root_web + '/' + mkRelPath(node, typeKey);
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
        if (node.file_index.preview && !node.file_index.cover) {
            node.file_index.cover = node.file_index.preview;
        }
        if (node.file_index.cover && !node.file_index.preview) {
            node.file_index.preview = node.file_index.cover;
        }
    }
    return nodeList;
}

/**
 * 文件夹不存在时会自动创建文件夹
 * */
export async function rename(srcPath: string, targetPath: string) {
    let hasErr;
    const targetDir = dirname(targetPath);
    const ifDirExs = await ifLocalFileExists(targetDir);
    if (!ifDirExs) {
        await fs.mkdir(targetDir, {recursive: true, mode: 0o777,});
    }
    //
    hasErr = null;
    try {
        await fs.rename(srcPath, targetPath);
        await fs.chmod(targetPath, 0o666);
        return true;
    } catch (e) {
        hasErr = e;
    }
    //
    hasErr = null;
    try {
        await fs.cp(srcPath, targetPath, {recursive: true, force: true});
        await fs.rm(srcPath, {recursive: true, force: true});
        await fs.chmod(targetPath, 0o666);
        return true;
    } catch (e) {
        hasErr = e;
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
    return getConfig().path.temp + '/' + uuidFN + '.' + suffix;
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
    for (const key in getConfig().suffix) {
        ifHit = getConfig().suffix[key].indexOf(suffix);
        if (ifHit === -1) continue;
        return key as type_file;
    }
    return 'binary';
}

export function titleFilter(title: string) {
    return title.replace(/[\\\/:*?"<>|\r\n\t\s]+/igm, ' ').trim();
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
    str = str.trim();
    if (str.indexOf('/') !== 0) return str;
    return ltrimSlash(str.substring(1, str.length));
}

export function rtrimSlash(str: string) {
    str = str.trim();
    if (str.lastIndexOf('/') !== str.length - 1) return str;
    return rtrimSlash(str.substring(0, str.length - 1));
}

export function bashTitleFilter(str: string) {
    if(getConfig('windows'))return str;
    return str.replaceAll('`', '\\`');
}

export async function checksum(localPath: string): Promise<string[]> {
    const checksumExecLs = getConfig('checksum');
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