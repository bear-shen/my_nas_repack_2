import * as Config from "../Config";
import {init} from "../startServer";
import * as fp from "../lib/FileProcessor";
import fsNp from "node:fs";
import fs from "node:fs/promises";
import {col_node} from "../../share/Database";
import QueueModel from "../model/QueueModel";
import NodeModel from "../model/NodeModel";

const evtMap: Map<string, number> = new Map<string, number>();
const sleepTime = 5000;
const queueSize = 100;

init().then(() => {
    const rootPath = Config.get('path.root');
    const pathConf = Config.get('path');
    const ignoreConf = Config.get('import_ignore');
    const isWindows = Config.get('windows');
    console.info('server now listen localPath:', rootPath);
    fsNp.watch(rootPath, {
        persistent: true,
        recursive: true,
    }, function (event, filename) {
        // console.info(event, filename);
        if (isWindows) filename = filename.replace(/\\/g, '/');
        // if (evtMap.has(filename)) return;
        if (filename.indexOf(pathConf.prefix_temp + '/') == 0) return;
        if (filename.indexOf(pathConf.prefix_preview + '/') == 0) return;
        if (filename.indexOf(pathConf.prefix_normal + '/') == 0) return;
        if (filename.indexOf(pathConf.prefix_cover + '/') == 0) return;
        if (filename == pathConf.prefix_temp) return;
        if (filename == pathConf.prefix_preview) return;
        if (filename == pathConf.prefix_normal) return;
        if (filename == pathConf.prefix_cover) return;
        if (ignoreConf.indexOf(fp.basename(filename)) != -1) return;
        //忽略tmp
        if (fp.extension(filename) == 'tmp') return;
        // console.info(pathConf);
        console.info(filename);
        //拷文件的时候会一直change到拷完，所以用覆盖
        evtMap.set(filename, (new Date()).valueOf());
    });
    queueLoop();
});

async function queueLoop() {
    const now = (new Date()).valueOf();
    const before = now - sleepTime;
    const sub = new Set<string>();
    //
    const rootPath = Config.get('path.root');
    //
    evtMap.forEach((evtTime, path) => {
        if (evtTime > before) return;
        if (sub.size > queueSize) return;
        sub.add(path);
    });
    sub.forEach(path => evtMap.delete(path));
    try {
        //文件在数据库中存在则更新
        //文件在数据库中不存在则创建
        const subArr = Array.from(sub);
        for (let i1 = 0; i1 < subArr.length; i1++) {
            const relPath = subArr[i1];
            const localPath = fp.mkLocalPath(relPath);
            console.info(localPath);
            let ifLocalExs = await fp.ifLocalFileExists(localPath);
            console.info('ifLocalExs', ifLocalExs);
            if (ifLocalExs) {
                const localStats = await fs.stat(localPath);
                if (!(localStats.isDirectory() || localStats.isFile())) continue;
                //文件存在 检测数据库
                const ifNodeExs = await fp.get(relPath);
                console.info('ifNodeExs', ifNodeExs);
                if (ifNodeExs) {
                    //存在，仅更新
                    const noUpd = localStats.mtime.valueOf() < (new Date(ifNodeExs.time_update)).valueOf();
                    if (noUpd) continue;
                    await (new QueueModel).insert({
                        type: 'file/rebuild',
                        payload: {id: ifNodeExs.id},
                        status: 1,
                    });
                    await (new QueueModel).insert({
                        type: 'file/rebuildIndex',
                        payload: {id: ifNodeExs.id},
                        status: 1,
                    });
                } else {
                    //不存在，创建
                    //@todo windows未测
                    const relArr = relPath.split('/');
                    const orgFTitle = relArr.pop();
                    const fTitle = fp.titleFilter(orgFTitle);
                    // console.info(orgFTitle, fTitle);
                    let parentNode = fp.rootNode;
                    for (let i2 = 0; i2 < relArr.length; i2++) {
                        const nodeTitle = fp.titleFilter(relArr[i2]);
                        if (nodeTitle != relArr[i2]) {
                            const relParentPath = fp.mkRelPath(parentNode);
                            const localParentPath = fp.mkLocalPath(relParentPath);
                            await fp.rename(
                                localParentPath + '/' + relArr[i2],
                                localParentPath + '/' + nodeTitle
                            );
                        }
                        const ifSubExs = await fp.ifTitleExist(parentNode, nodeTitle);
                        if (!ifSubExs) {
                            parentNode = await fp.mkdir(parentNode, nodeTitle);
                            await (new QueueModel).insert({type: 'file/buildIndex', payload: {id: parentNode.id}, status: 1,});
                        } else {
                            parentNode = ifSubExs;
                        }
                    }
                    //
                    if (orgFTitle != fTitle) {
                        const relParentPath = fp.mkRelPath(parentNode);
                        const localParentPath = fp.mkLocalPath(relParentPath);
                        await fp.rename(
                            localParentPath + '/' + orgFTitle,
                            localParentPath + '/' + fTitle
                        );
                    }
                    const ins: col_node = {
                        id_parent: parentNode.id,
                        title: fTitle,
                        description: '',
                        node_id_list: [...parentNode.node_id_list, parentNode.id],
                        node_path: fp.mkRelPath(parentNode),
                        status: 1,
                        building: 0,
                        file_index: {},
                    };
                    if (localStats.isDirectory()) {
                        ins.type = 'directory';
                    }
                    if (localStats.isFile()) {
                        ins.type = fp.getType(fp.extension(fTitle));
                        ins.file_index = {
                            raw: {size: 0, checksum: [],},
                        };
                    }
                    const insRes = await (new NodeModel).insert(ins) as col_node[];
                    ins.id = insRes[0].id;
                    await (new QueueModel).insert({type: 'file/build', payload: {id: ins.id}, status: 1,});
                    await (new QueueModel).insert({type: 'file/buildIndex', payload: {id: ins.id}, status: 1,});
                }
            } else {
                //文件不存在 删除
                const ifNodeExs = await fp.get(relPath);
                if (!ifNodeExs) continue;
                await (new QueueModel).insert({
                    type: 'file/deleteForever',
                    payload: {id: ifNodeExs.id},
                    status: 1,
                });
            }
        }
    } catch (e) {
        console.error(e);
    }
    //
    setTimeout(queueLoop, sleepTime);
}
