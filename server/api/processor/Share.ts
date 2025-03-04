// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {
    api_node_col,
    api_share_del_req, api_share_get_req,
    api_share_list_req, api_share_list_resp,
    api_share_node_list_req, api_share_node_list_resp, api_share_set_req
} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import RateModel from "../../model/RateModel";
import ShareModel from "../../model/ShareModel";
import UserModel from "../../model/UserModel";
import {col_node, col_share, col_user} from "../../../share/Database";
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
        if (request.time_to) {
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
        const selNodeDef: (keyof col_node)[] = [
            'id',
            'id_parent',
            'type',
            'title',
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
        //
        // await fp.buildWebPath(nodeLs);
        //
        const user = await new UserModel().where('id', share.id_user).first(['id', 'name']);
        return {
            id: request.id,
            user: user,
            node: nodeLs,
            cur: curNode,
            parent: parentNode,
        };
    }

    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<null> {
        const request = data.fields as api_share_get_req;
        // const user = await new UserModel().where('id', data.uid).first();
        const share = await new ShareModel().where('id', request.id).where('status', '<>', 0).first();
        if (!share) throw new Error('share data not found');
        if (share.status == 1 && new Date(share.time_to).valueOf() < new Date().valueOf()) throw new Error('expired');
        const node = await new NodeModel().where('id', request.id_node).first();
        if (!node) throw new Error('node not found');
        const raw = node.file_index.raw;
        //
        let bufFrom = 0;
        let bufTo = raw.size;
        // console.info(req.headers);
        //@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range
        if (req.headers.range) {
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
        const rawPath = fp.mkLocalPath(fp.mkRelPath(node));
        // console.info(rawPath);
        res.setHeader("content-type", "application/octet-stream");
        const rs = fsNp.createReadStream(rawPath, {
            autoClose: true,
            start: bufFrom, end: bufTo
        });
        await setResponseFile(rs, res);
        return;
    }
}

function setResponseFile(rs: ReadStream, res: ServerResponse): Promise<null> {
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
}

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
