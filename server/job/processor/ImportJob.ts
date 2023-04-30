import NodeModel from '../../model/NodeModel';
import {col_file, col_node, col_tag, col_tag_group} from '../../../share/Database';
import FileModel from '../../model/FileModel';
import * as fs from 'fs/promises';
import * as fp from "../../lib/FileProcessor";
import * as lfp from "../../lib/LocalFileProcessor";
import * as FFMpeg from '../../lib/FFMpeg';
import Config from "../../ServerConfig";
import util from "util";
import TagModel from "../../model/TagModel";
import TagGroupModel from "../../model/TagGroupModel";
import {api_local_file_statement} from "../../../share/Api";

const exec = util.promisify(require('child_process').exec);

export default class {
    static async run(payload: { [key: string]: any }): Promise<any> {
        const src = payload.source.replace(/\/$/, '');
        const targetId = payload.id;
        let importRoot = await (new NodeModel).where('id', targetId).first();
        if (!importRoot) importRoot = {
            id: 0,
            title: '',
        };
        const fileList = await scanLoop(src);
        nodeMap = new Map<string, col_node>;
        //导入的时候连根目录一起创建
        for (let i1 = 0; i1 < fileList.length; i1++) {
            const item = fileList[i1];
            if (!item.isDir) continue;
            console.info(['dir:', item.path]);
            // await fp.mkdir(targetId, item.name);
            // const relPath = item.path.substring(src.length + 1);
            const dirname = item.path.substring(src.lastIndexOf('/'));
            // console.info([item.path, relPath]);
            const parentDirname = dirname.substring(0, dirname.lastIndexOf('/'));
            const parentNode = await mkParentNode(parentDirname, importRoot);
            fp.mkdir(parentNode.id, item.name);
        }
        for (let i1 = 0; i1 < fileList.length; i1++) {
            const item = fileList[i1];
            if (!item.isFile) continue;
            console.info(['file:', item.path]);
            // await fp.mkdir(targetId, item.name);
            // const relPath = item.path.substring(src.length + 1);
            const dirname = item.path.substring(src.lastIndexOf('/'));
            // console.info([item.path, relPath]);
            const parentDirname = dirname.substring(0, dirname.lastIndexOf('/'));
            const parentNode = await mkParentNode(parentDirname, importRoot);
            await fp.put(item.path, parentNode, item.name, true);
        }
    }
}

let nodeMap = new Map<string, col_node>;


async function mkParentNode(path: string, root: col_node): Promise<col_node> {
    // console.info('=================================================');
    if (nodeMap.get(path)) return nodeMap.get(path);
    // console.info('create new');
    const tree = path.split('/').filter(val => {
        return val.length;
    });
    // const nodeTree = [] as col_node;
    let lastNode = root;
    for (let i1 = 0; i1 < tree.length; i1++) {
        // console.info([path, root.id, root.title, lastNode.id, lastNode.title, tree[i1],]);
        const curNode = await (new NodeModel).where('id_parent', lastNode.id).where('title', tree[i1]).first();
        if (!curNode) {
            const node = await fp.mkdir(lastNode.id, tree[i1]);
            if (!node) throw new Error('error on cascade mkdir');
            lastNode = node;
            continue;
        }
        lastNode = curNode;
    }
    nodeMap.set(path, lastNode);
    return lastNode;
    // console.info(tree);
    // const dirNameArr = [];
}

async function scanLoop(src: string): Promise<api_local_file_statement[]> {
    const curLs = await lfp.ls(src);
    const subTLs = [] as api_local_file_statement[];
    const targetLs = [];
    for (let i1 = 0; i1 < curLs.length; i1++) {
        if (curLs[i1].isDir) {
            const subLs = await scanLoop(curLs[i1].path);
            subLs.forEach(item => subTLs.push(item));
        }
    }
    subTLs.forEach(item => curLs.push(item));
    return curLs;
}