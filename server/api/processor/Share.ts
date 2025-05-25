// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {
    api_node_col,
    api_share_del_req, api_share_get_req,
    api_share_list_req, api_share_list_resp,
    api_share_node_list_req, api_share_node_list_resp, api_share_node_type, api_share_set_req
} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import RateModel from "../../model/RateModel";
import ShareModel from "../../model/ShareModel";
import UserModel from "../../model/UserModel";
import {col_node, col_node_file_index, col_share, col_user} from "../../../share/Database";
import * as fp from "../../lib/FileProcessor";
import fsNp, {ReadStream} from "node:fs";

export default class {
    async list(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<null | api_share_list_resp[]> {
        const request = data.fields as api_share_list_req;
        const user = await new UserModel().where('id', data.uid).first();
        const model = new ShareModel();
        if (user.id_group !== 1) {
            model.where('id_user', user.id);
        }
        if (request.status) {
            model.where('status', request.status);
        } else {
            model.where('status', '<>', 0);
        }
        model.page(parseInt(request.page ?? '1'), 100);
        const ls: api_share_list_resp[] = await model.order('time_create', 'desc').select();
        if (!ls.length) return [];
        const nodeIdSet = new Set<number>;
        const userIdSet = new Set<number>;
        ls.forEach(l => {
            l.node_id_list.forEach(id => nodeIdSet.add(id));
            userIdSet.add(l.id_user);
        });
        const nodeMap = new Map<number, col_node>;
        const userMap = new Map<number, col_user>;
        const nodeArr = await (new NodeModel).whereIn('id', Array.from(nodeIdSet))
            .where('cascade_status', 1)
            .where('status', 1)
            .select();
        nodeArr.forEach(r => nodeMap.set(r.id, r))
        const userArr = await (new UserModel).whereIn('id', Array.from(userIdSet)).select();
        userArr.forEach(r => userMap.set(r.id, r))
        //
        ls.forEach(l => {
            l.node = [];
            l.node_id_list.forEach(id => {
                if (nodeMap.get(id))
                    l.node.push(nodeMap.get(id));
            });
            l.user = userMap.get(l.id_user);
        });
        return ls;
    }

    async set(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<null | api_share_list_resp> {
        const request = data.fields as api_share_set_req;
        //
        if (!request.node_id_list) throw new Error('no data');
        const nodeArr = request.node_id_list.split(',');
        const nodeLs = await (new NodeModel()).whereIn('id', nodeArr)
            .where('cascade_status', 1)
            .where('status', 1).select();
        if (!nodeLs.length) throw new Error('no data');
        const nodeIdSet = new Set<number>();
        nodeLs.forEach(node => nodeIdSet.add(node.id));
        //
        const insVal: col_share = {
            id_user: data.uid || 0,
            node_id_list: Array.from(nodeIdSet),
            status: 2,
        };
        if (request.status === '1') {
            insVal.status = 1;
            insVal.time_to = request.time_to;
        }
        const insRes = await new ShareModel().insert(insVal) as col_share[];
        return insRes[0];
    }

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<null> {
        const request = data.fields as api_share_del_req;
        // const user = await new UserModel().where('id', data.uid).first();
        const share = await new ShareModel().where('id', request.id).first();
        if (!share) throw new Error('share data not found');
        if (share.id_user != data.uid) throw new Error('not owner');
        await new ShareModel().where('id', request.id).update({status: 0});
        return;
    }

    async node_list(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<null | api_share_node_list_resp> {
        const request = data.fields as api_share_node_list_req;
        if (!request.id) throw new Error('no share id');
        const selNodeDef: (keyof col_node)[] = [
            'id',
            'id_parent',
            'type',
            'title',
            'node_path',
            'node_id_list',
            'file_index',
            'rel_node_id',
        ];
        // const user = await new UserModel().where('id', data.uid).first();
        const share = await new ShareModel().where('id', request.id).where('status', '<>', 0).first();
        if (!share) throw new Error('share data not found');
        if (share.status == 1 && new Date(share.time_to).valueOf() < new Date().valueOf()) throw new Error('expired');
        //
        const rootLs = await new NodeModel().whereIn('id', share.node_id_list)
            .where('cascade_status', 1)
            .where('status', 1)
            .select(selNodeDef);
        let pid = parseInt(request.id_node);
        let nodeLs: api_node_col[];
        let curNode: col_node;
        let parentNode: col_node;
        //
        if (pid) {
            curNode = await new NodeModel().where('id', pid)
                .where('cascade_status', 1)
                .where('status', 1).first(selNodeDef);
            if (!curNode) throw new Error('node not found');
            if (curNode.type !== 'directory') throw new Error('invalid node');
            //
            if (!inShare(share.node_id_list, curNode)) throw new Error('unauthorized node');
            //
            const curParent = await new NodeModel().where('id', curNode.id_parent).first(selNodeDef);
            if (curParent && inShare(share.node_id_list, curParent)) {
                parentNode = curParent;
            }
            //
            nodeLs = await new NodeModel().where('id_parent', curNode.id)
                .where('cascade_status', 1)
                .where('status', 1).select(selNodeDef);
        } else {
            nodeLs = rootLs;
        }
        nodeLs=await fp.buildWebPath(nodeLs);
        //
        // await fp.buildWebPath(nodeLs);
        //
        const user = await new UserModel().where('id', share.id_user).first(['id', 'name']);
        return {
            id: request.id,
            user: user,
            node: nodeLs as api_share_node_type[],
            cur: curNode as api_share_node_type,
            parent: parentNode as api_share_node_type,
        };
    }

    /*async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<null> {
        //搞不定。。。
        let uriInfo = new URL('http://0.0.0.0' + req.url);
        if (!uriInfo||!uriInfo.searchParams) throw new Error('invalid URL');
        const request:api_share_get_req={
            id:uriInfo.searchParams.get('id'),
            id_node:uriInfo.searchParams.get('id_node'),
            index:uriInfo.searchParams.get('index'),
        };
        if (!request.id) throw new Error('no data');
        // const user = await new UserModel().where('id', data.uid).first();
        const share = await new ShareModel().where('id', request.id).where('status', '<>', 0).first();
        if (!share) throw new Error('share data not found');
        if (share.status == 1 && new Date(share.time_to).valueOf() < new Date().valueOf()) throw new Error('expired');
        const node = await new NodeModel().where('id', request.id_node).first();
        if (!node) throw new Error('node not found');
        if (node.type==='directory') throw new Error('invalid node');
        //
        let tIndexName='raw';
        let tIndex = node.file_index.raw;
        switch(request.index){
            case 'cover':
                if(node.file_index.cover){
                    tIndex=node.file_index.cover;
                    tIndexName='cover';
                }
                break;
            case 'preview':
                if(node.file_index.preview){
                    tIndex=node.file_index.preview;
                    tIndexName='preview';
                }
                break;
            case 'normal':
                if(node.file_index.normal){
                    tIndex=node.file_index.normal;
                    tIndexName='normal';
                }
                break;
        }
        if (!tIndex) throw new Error('node file not found');
        //
        let bufFrom = 0;
        let bufTo = tIndex.size;
        // console.info(req.headers);
        //@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range
        let useRange=false;
        if (req.headers.range) {
            useRange=true;
            const rngArr = req.headers.range.split('=');
            if (rngArr.length > 1) {
                const byteArr = rngArr[1].split('-');
                if (byteArr.length == 2) {
                    if (byteArr[0] === '') {
                        bufFrom = bufTo - parseInt(byteArr[1]);
                    } else {
                        bufFrom = parseInt(byteArr[0]);
                    }
                    if (byteArr[1] !== '') {
                        bufTo = parseInt(byteArr[1]);
                    }
                }
            }
        }
        //
        const fIndex=node.file_index[tIndexName] as col_node_file_index;
        const fPath = fp.mkLocalPath(fp.mkRelPath(node,tIndexName,fIndex.ext));
        const ifFileExs=await fp.ifLocalFileExists(fPath);
        // console.info(fPath);
        if(!ifFileExs)throw new Error('file not found');
        // if(useRange)res.statusCode=206;
        // res.setHeader("Content-Range", `bytes ${bufFrom}-${bufTo}/${fIndex.size}`);
        // res.setHeader("Content-Length", fIndex.size);
        // res.setHeader("ETag", `"${node.id}"`);
        // res.setHeader("Content-Type", `${node.type}/${fIndex.ext}`);
        // res.setHeader("content-type", "application/octet-stream");
        // res.setHeader("Content-Disposition", `attachment; filename="${fp.basename(fPath)}"`);
        const rs = fsNp.createReadStream(fPath, {
            autoClose: true,
            start: bufFrom, end: bufTo
        });
        await setResponseFile(rs, res);
        return;
    }*/
}

/*function setResponseFile(rs: ReadStream, res: ServerResponse): Promise<null> {
    return new Promise(resolve => {
        rs.on('data', (chunk) => {
            // console.info(chunk.length);
            res.write(chunk);
        })
        rs.on('end', () => {
            rs.close();
            res.end();
            resolve(null);
        });
    });
}*/

function inShare(shareNodeIdList: number[], node: col_node) {
    let inShare = false;
    if (shareNodeIdList.indexOf(node.id) !== -1) {
        inShare = true;
    } else {
        node.node_id_list.forEach(nodeId => {
            if (!nodeId) return;
            if (shareNodeIdList.indexOf(nodeId) !== -1)
                inShare = true;
        });
    }
    return inShare;
}
