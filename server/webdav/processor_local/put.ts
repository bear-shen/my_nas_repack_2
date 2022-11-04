import { IncomingMessage, ServerResponse } from "http";
import Lib from "../Lib";
import FileLib from "../../lib/File";
import NodeModel from "../../model/NodeModel";
import ErrorCode from "../ErrorCode";
import FileModel from "../../model/FileModel";
import * as fs from "fs/promises";
import * as fsNP from "fs";
import Config from "../../Config";
import QueueModel from "../../model/QueueModel";
import { Buffer } from "buffer";
import { ReadStream } from "fs";
import { NodeCol, FileCol } from "../../columns";

export default async function (req: IncomingMessage, bodyPath: string, res: ServerResponse) {
    const dirOffset = req.url.replace(/\/$/ig, '').lastIndexOf('/');
    const dirPath = req.url.substring(0, dirOffset);
    const fileName = decodeURIComponent(req.url.substring(dirOffset + 1));
    console.info(req.url);
    //
    const url = new URL(dirPath, `http://${req.headers.host}`);
    const dirNode = await Lib.getCurNode(url) as NodeCol;
    //
    // const hashPath = FileLib.makeHashPath(fileHash);
    let suffix = FileLib.getSuffixByName(fileName);
    //types: 'audio','video','image','binary','text'
    let fileType = FileLib.getTypeBySuffix(suffix);
    console.info(`get file ${fileType}:${suffix}:${fileName}`)
    //
    let ifNode = await (new NodeModel).where('id_parent', dirNode.id).where('title', fileName).first();
    if (ifNode && ifNode.type === 'directory')
        return Lib.respCode(res, 409);
    if (!ifNode) {
        console.info('fileType:', fileType);
        const nodeData = {
            id_parent: dirNode.id,
            // id_cover: number,
            // id_file: fid,
            type: fileType,
            title: fileName,
            description: '',
            sort: 0,
            // status: hasBuildFile ? 1 : 2,
            status: 1,
            building: 0,
            list_node: [...dirNode.list_node, dirNode.id],
            list_tag_id: [],
            index_node: {},
            index_file_id: {},
        } as NodeCol;
        const insNodeResult = await (new NodeModel).insert(nodeData);
        nodeData.id = insNodeResult.insertId;
        await (new QueueModel).insert({
            type: 'index/node',
            status: 1,
            payload: { id: nodeData.id },
        });
        ifNode = nodeData;
        if (!req.headers["content-length"])
            return Lib.respCode(res, 201);
        if (!bodyPath)
            return Lib.respCode(res, 201);
    }

    //
    if (ifNode.status !== 1) {
        await (new NodeModel).where('id', ifNode.id).update({ status: 1 });
    }
    //
    let ifFile = null as NodeCol;
    if (ifNode.index_file_id.raw) {
        ifFile = await (new FileModel).where('id', ifNode.index_file_id.raw).first();
    }
    //写入文件
    Lib.respCode(res, 204);
    // console.info('put resp send');
    if (!req.headers["content-length"])
        // return Lib.respCode(res, 204);
        return;
    if (!bodyPath)
        // return Lib.respCode(res, 204);
        return;
    //
    // const tmpFilePath = `${Config.fileRoot}temp/webdav/${(new Date).valueOf()}`;
    // await FileLib.makeFileDir(tmpFilePath, false);
    // await fs.writeFile(tmpFilePath, body);
    // console.info(`write to :${tmpFilePath}`);
    // const rs = fsNP.createReadStream(tmpFilePath);
    //@see setFile
    const fileHash = await FileLib.getFileHash(bodyPath);
    const tmpFilePath = bodyPath as string;

    const rawRelPath = FileLib.makePath('rel', fileType, fileHash, suffix);
    const rawPath = FileLib.makePath('local', fileType, fileHash, suffix);
    //查看是否重复
    ifFile = await (new FileModel).where('hash', fileHash).first();
    if (!ifFile) {
        try {
            await fs.stat(rawPath);
            FileLib.deleteFile(tmpFilePath);
        } catch (e) {
            await FileLib.makeFileDir(rawPath, false);
            await fs.rename(tmpFilePath as string, rawPath);
        }
        ifFile = {
            hash: fileHash,
            type: fileType,
            suffix: suffix,
            path: rawRelPath,
            meta: {},
            size: Number.parseInt(req.headers["content-length"]),
            status: 1,
        } as FileCol;
        const insFileResult = await (new FileModel).insert(ifFile);
        ifFile.id = insFileResult.insertId;
    }
    if (ifNode.index_file_id.raw === ifFile.id)
        // return Lib.respCode(res, 204);
        return;
    //更新文件节点
    let hasBuild = false;
    if (ifFile.time_create) {
        //如果文件已经存在，尝试从其他节点复制数据
        const dupFileNode = await (new NodeModel)
            .whereRaw("JSON_CONTAINS(index_file_id, ?, '$.raw')", ifFile.id)
            .where('building', 0)
            .first();
        if (dupFileNode) {
            await (new NodeModel).where('id', ifNode.id).update({
                index_file_id: dupFileNode.index_file_id,
            });
            hasBuild = true;
        }
    }
    //如果无法从其他节点复制，删除当前节点的build，并重新写入
    if (!hasBuild) {
        for (const fileIdKey in ifNode.index_file_id) {
            const fileId = ifNode.index_file_id[fileIdKey];
            if (!fileId) continue;
            await (new QueueModel).insert({
                type: 'file/delete_forever',
                status: 1,
                payload: { id: fileId },
            });
        }
        await (new NodeModel).where('id', ifNode.id).update({
            index_file_id: { raw: ifFile.id },
            building: 1,
        });
        await (new QueueModel).insert({
            type: 'file/build',
            status: 1,
            payload: { id: ifNode.id },
        });
    }
    // return Lib.respCode(res, 204);
    // console.info('put full end');
    return;
}

