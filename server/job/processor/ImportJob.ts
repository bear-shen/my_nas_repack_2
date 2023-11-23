import NodeModel from '../../model/NodeModel';
import {col_node} from '../../../share/Database';
import * as fp from "../../lib/FileProcessor";
import * as lfp from "../../lib/LocalFileProcessor";
import util from "util";
import {api_local_file_statement} from "../../../share/Api";
import QueueModel from "../../model/QueueModel";

const exec = util.promisify(require('child_process').exec);

export default class {
    static async run(payload: { [key: string]: any }): Promise<any> {
        const src = payload.sourceDir.replace(/\/$/, '');
        const targetId = payload.targetNodeId;
        let importRoot = await (new NodeModel).where('id', targetId).first();
        if (!importRoot) importRoot = {
            id: 0,
            title: '',
        };
        const fileList = await scanLoop(src);
        // console.info(fileList);
        // for (let i1 = 0; i1 < fileList.length; i1++) {
        //     const item = fileList[i1];
        //     if (!item.isDir) continue;
        //     console.info(['dir:', item.path]);
        // }
        // return ;
        nodeMap = new Map<string, col_node>;
        //导入的时候连根目录一起创建
        //先创建目录再创建文件
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
            const targetNode = await fp.mkdir(parentNode.id, item.name);
            if (!targetNode) continue;
            (new QueueModel).insert({
                type: 'file/buildIndex',
                payload: {id: targetNode.id},
                status: 1,
            });
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
            // const ifDup = (new NodeModel()).where('id_parent', parentNode.id).where('title', item.name).first();
            // if (ifDup) continue;
            const targetNode = await fp.put(item.path, parentNode, item.name, true);
            if (!targetNode) continue;
            (new QueueModel).insert({
                type: 'file/build',
                payload: {id: targetNode.id},
                status: 1,
            });
            (new QueueModel).insert({
                type: 'file/buildIndex',
                payload: {id: targetNode.id},
                status: 1,
            });
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
        //直接查询判断会有一些问题，写入时会过滤掉一些特殊字符
        const curNode = await (new NodeModel).where('id_parent', lastNode.id)
            .where('title', fp.titleFilter(tree[i1]))
            .first();
        if (!curNode) {
            const node = await fp.mkdir(lastNode.id, tree[i1], true);
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