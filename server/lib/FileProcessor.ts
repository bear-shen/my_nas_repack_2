import * as crypto from "node:crypto";
import {get as getConfig} from "../ServerConfig";
import {col_node, type_file} from "../../share/Database";
import NodeModel from "../model/NodeModel";
import * as fs from 'fs/promises';


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

export async function put() {
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
    // return;
    const curPath = mkLocalPath(mkRelPath(cur));
    await fs.rm(curPath, {recursive: true, force: true});
    await (new NodeModel).where('id', cur.id).delete();
}

export async function mv(
    srcNode: string | number | col_node, targetDir: string | number | col_node
    , targetTitle: string = '', targetDescription: string = ''
) {
    const cur = await get(srcNode);
    if (!cur) throw new Error('node not found');
    const target = await get(targetDir);
    if (!target) throw new Error('parentNode not found');
    if (target.node_id_list.indexOf(cur.id) !== -1)
        throw new Error('cannot mv to subNode');
    //
    const localPath = mkLocalPath(mkRelPath(cur), 'raw');
    const ifExs = await ifFileExists(localPath);
    if (!ifExs) throw new Error('local node not found');
    //
    const targetDirPath = mkRelPath(target);
    const targetDirLocalPath = mkLocalPath(targetDirPath, 'raw');
    const ifTargetExs = await ifFileExists(targetDirLocalPath);
    if (!ifTargetExs) throw new Error('local target dir not found');
    //
    const upd: col_node = {
        id_parent: target.id,
        node_id_list: [...target.node_id_list, target.id],
        node_path: mkRelPath(target),
    };
    if (targetTitle.length) {
        upd.title = titleFilter(targetTitle);
        upd.description = targetDescription;
    }
    //
    let targetNodeLocalPath = mkLocalPath(upd.node_path + '/' + (upd.title ? upd.title : cur.title));
    // console.info('mv to', localPath, targetNodeLocalPath, upd);
    // return;
    let hasErr;
    try {
        await fs.rename(localPath, targetNodeLocalPath);
    } catch (e) {
        hasErr = e;
    }
    if (hasErr) {
        try {
            await fs.cp(localPath, targetNodeLocalPath, {recursive: true, force: true});
            await fs.rm(localPath, {recursive: true, force: true});
        } catch (e) {
            hasErr = false;
        }
    }
    if (hasErr) throw hasErr;
    //
    await (new NodeModel).where('id', cur.id).update(upd);
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
        parentPath.length ? parentPath + '/' + title : title,
        'raw'
    );
    //
    if (!await ifFileExists(localPath)) {
        await fs.mkdir(localPath, {recursive: true, mode: 0o666});
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
        await (new NodeModel).insert(newNode);
        const id = await (new NodeModel()).lastInsertId();
        newNode.id = id;
    } else newNode = ifExs;
    return ifExs;
}

export function mkRelPath(node: col_node) {
    const nodePath =
        //去/
        (node.node_path.length ? node.node_path + '/' : '') +
        //去root
        (node.id ? node.title : '')
    ;
    return nodePath;
}

export async function ifFileExists(localPath: string) {
    try {
        await fs.access(localPath);
        return true;
    } catch (e: any) {
        // console.info(e);
        return false;
    }
}

export function mkLocalPath(
    fullRelPath: string,
    method: 'temp' | 'preview' | 'normal' | 'cover' | 'raw' = 'raw'
) {
    let ext = '';
    const pathConfig = getConfig('path');
    switch (method) {
        case "temp":
        case "preview":
        case "normal":
        case "cover":
            ext = pathConfig[method];
            break;
    }
    return `${ext.length ? ext : pathConfig.root}/${pathFilter(fullRelPath)}`;
}

export async function ifTitleExist(parent: string | number | col_node, title: string) {
    const parentNode = await get(parent);
    if (!parentNode) throw new Error('parentNode not found');
    return await (new NodeModel).where('id_parent', parentNode.id).where('title', title).first();
}

//---------------------- helper ----------------------

const rootNode: col_node = {
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

export function getDir(filePath: string): string {
    filePath = filePath.replace(/\/$/, '');
    const lastSlash = filePath.lastIndexOf('/');
    return filePath.substring(0, lastSlash);
}

export function getFile(filePath: string): string {
    filePath = filePath.replace(/\/$/, '');
    const lastSlash = filePath.lastIndexOf('/');
    return filePath.substring(lastSlash + 1);
}

export function getSuffix(fileName: string): string {
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

function titleFilter(title: string) {
    return title.replace(/[\\\/:*?"<>|\r\n\t]/igm, ' ').trim();
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
    if (str.indexOf('/') !== 0) return str;
    return ltrimSlash(str.substring(1, str.length));
}

export function rtrimSlash(str: string) {
    if (str.lastIndexOf('/') !== str.length - 1) return str;
    return rtrimSlash(str.substring(0, str.length - 1));
}

