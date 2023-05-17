import {Fields} from 'formidable';
import {PersistentFile} from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_file_list_resp, api_node_col, api_file_list_req, api_file_upload_resp, api_file_upload_req, api_file_mkdir_resp, api_file_mkdir_req, api_file_mov_req, api_file_mod_req, api_file_cover_req, api_file_cover_resp, api_file_delete_resp, api_file_delete_req} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../../share/GenFunc';
import {col_node, col_tag} from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import FileModel from '../../model/FileModel';
import * as fp from "../../lib/FileProcessor";
import Config from "../../ServerConfig";
import QueueModel from "../../model/QueueModel";

export default class {
    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_list_resp> {
        const request = data.fields as api_file_list_req;
        const treeLs = [];
        const listLs = [];
        const target = {
            path: [] as col_node[],
            list: [] as api_node_col[],
        };
        if (request.pid && request.pid !== '0') {
            const model = new NodeModel();
            const curNode = await model.where('id', request.pid).first();
            //tree这个是.path下面的，with_crumb是单独节点的
            const treeNodeIdLs = curNode.list_node;
            const treeNodeLs = await (new NodeModel).whereIn('id', treeNodeIdLs).select();
            const treeNodeMap = GenFunc.toMap(treeNodeLs, 'id');
            treeNodeIdLs.forEach(id => {
                if (id === 0) {
                    target.path.push({
                        id: 0,
                        title: 'root',
                        id_parent: -1,
                        type: 'directory',
                        status: 1,
                        list_node: [],
                    });
                } else {
                    const node = treeNodeMap.get(id);
                    if (node) {
                        target.path.push(node);
                    }
                }
            });
            target.path.push(curNode);
        }
        const model = new NodeModel();
        if (request.keyword) {
            model.where(
                // 'index_node',
                'title',
                'like',
                `%${request.keyword.trim()}%`
            );
        }
        if (request.pid) {
            model.where('id_parent', request.pid);
        }
        if (request.tid) {
            model.whereRaw('find_in_set(?,list_tag_id)', request.tid);
        }
        if (!(
            request.keyword ||
            request.type ||
            request.pid ||
            request.tid ||
            false
        )) {
            console.info('file/get: no querydata, set id_parent=0')
            model.where('id_parent', 0);
        }
        if (request.type) {
            model.where('type', request.type);
        }
        if (request.deleted) {
            model.where('status', 0);
        } else {
            model.where('status', 1);
        }
        if (request.sort) {
            switch (request.sort) {
                case 'id_asc':
                    model.order('id', 'asc');
                    break;
                case 'id_desc':
                    model.order('id', 'desc');
                    break;
                case 'name_asc':
                    model.order('title', 'asc');
                    break;
                case 'name_desc':
                    model.order('title', 'desc');
                    break;
                case 'crt_asc':
                    model.order('time_create', 'asc');
                    break;
                case 'crt_desc':
                    model.order('time_create', 'desc');
                    break;
                case 'upd_asc':
                    model.order('time_update', 'asc');
                    break;
                case 'upd_desc':
                    model.order('time_update', 'desc');
                    break;
            }
        }
        if (request.limit) {
            model.limit(parseInt(request.limit));
        }
        const nodeLs: api_node_col[] = await model.select();
        // console.info(nodeLs);
        //
        const tagIdSet = new Set<number>();
        const fileIdSet = new Set<number>();
        const parentIdSet = new Set<number>();
        nodeLs.forEach(node => {
            node.list_tag_id.forEach(tagId => {
                tagIdSet.add(tagId);
            });
            for (const type in node.index_file_id) {
                if (!Object.prototype.hasOwnProperty.call(node.index_file_id, type)) continue;
                const fileId = node.index_file_id[type];
                fileIdSet.add(fileId);
            }
            node.list_node.forEach(nodeId => {
                if (nodeId) parentIdSet.add(nodeId);
            });
            node.is_file = node.type === 'directory' ? 0 : 1;
        });
        if (!request.no_tag && tagIdSet.size) {
            const tagLs = await (new TagModel).whereIn('id', Array.from(tagIdSet)).select();
            const tagGroupIdSet = new Set<number>();
            const tagMap = GenFunc.toMap(tagLs, 'id', (tag) => {
                tagGroupIdSet.add(tag.id_group);
            });
            const tagGroupLs = await (new TagGroupModel).whereIn('id', Array.from(tagGroupIdSet)).select();
            const tagGroupMap = GenFunc.toMap(tagGroupLs, 'id');
            nodeLs.forEach(node => {
                node.tag = [];
                const iTagGroupIdSet = new Set<number>();
                node.list_tag_id.forEach(tagId => {
                    const tag = tagMap.get(tagId);
                    iTagGroupIdSet.add(tag.id_group);
                });
                iTagGroupIdSet.forEach(groupId => {
                    const tagGroup = tagGroupMap.get(groupId);
                    const tagLs: col_tag[] = [];
                    tagMap.forEach(tag => {
                        if (tag.id_group === tagGroup.id) {
                            tagLs.push(tag);
                        }
                    });
                    node.tag.push(Object.assign(tagGroup, {sub: tagLs}));
                });
            });
        }
        if (!request.no_file && fileIdSet.size) {
            const fileLs = await (new FileModel).whereIn('id', Array.from(fileIdSet)).select();
            const fileMap = GenFunc.toMap(fileLs, 'id');
            // const tagGroupIdSet = new Set();
            nodeLs.forEach(node => {
                node.file = {};
                for (const key in node.index_file_id) {
                    if (!Object.prototype.hasOwnProperty.call(node.index_file_id, key)) continue;
                    const fileId = node.index_file_id[key];
                    const file = fileMap.get(fileId)
                    node.file[key] = file;
                    node.file[key].path = Config.path.api + fp.getRelPathByFile(file);
                }
            });
        }
        //
        const parentMap = new Map<number, col_node>();
        if (request.with_crumb) {
            if (parentIdSet.size) {
                const parentLs = await new NodeModel()
                    .whereIn('id', Array.from(parentIdSet))
                    .select([
                        'id', 'title', 'status', 'type',
                    ]);
                parentLs.forEach(node => {
                    parentMap.set(node.id, node);
                });
            }
            parentMap.set(0, {
                id: 0, title: 'root', status: 1, type: 'directory'
            });
            nodeLs.forEach(node => {
                node.crumb_node = [];
                node.list_node.forEach(nodeId => {
                    const parentNode = parentMap.get(nodeId);
                    if (parentNode) {
                        node.crumb_node.push(parentNode);
                    }
                });
            });
        }
        target.list = nodeLs;
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        //
        return target;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        return null;
    };

    async mov(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_mov_req;
        const fromNode = await (new NodeModel()).where('id', request.node_id).first();
        await fp.mv(parseInt(request.node_id), parseInt(request.target_id));
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_mod_req;
        const fromNode = await (new NodeModel()).where('id', request.id).first();
        await fp.mv(fromNode.id, fromNode.id_parent, request.title, request.description);
        return null;
    };

    async upd(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_upload_resp> {
        const request = data.fields as api_file_upload_req;
        const files = data.files;
        // console.info(request);
        // console.info(files);
        // return null;
        const resultLs = [] as col_node[];
        for (const filesKey in files) {
            const file = files[filesKey];
            const fileInfo = await fp.put(
                (file as any).filepath,
                parseInt(request.pid) ?? 0,
                (file as any).originalFilename
            );
            if (!fileInfo) continue;
            resultLs.push(fileInfo);
            // console.info(filesKey);
            // console.info(file);
        }
        return resultLs;
    };

    async mkdir(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<false | api_file_mkdir_resp> {
        const request = data.fields as api_file_mkdir_req;
        const dir = await fp.mkdir(parseInt(request.pid) ?? 0, request.title);
        return dir;
    }

    async cover(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<false | api_file_cover_resp> {
        const request = data.fields as api_file_cover_req;
        const curNode = await new NodeModel().where('id', request.id).first();
        if (!curNode) return;
        const curPNode = await new NodeModel().where('id', curNode.id_parent).first();
        if (!curPNode) return;
        const coverId = curNode.index_file_id.cover;
        if (!coverId) return;
        await new NodeModel().where('id', curNode.id_parent).update({
            index_file_id: {
                cover: coverId,
            },
        });
        return curNode;
    }

    async delete(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<false | api_file_delete_resp> {
        const request = data.fields as api_file_delete_req;
        const curNode = await new NodeModel().where('id', request.id).first();
        if (!curNode) return;
        await new NodeModel().where('id', curNode.id).update({
            status: 0
        });
        return curNode;
    }

    async delete_forever(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<false | api_file_delete_resp> {
        const request = data.fields as api_file_delete_req;
        const curNode = await new NodeModel().where('id', request.id).first();
        if (!curNode) return;
        if (curNode.status != 0) throw new Error('node is not deleted');
        await new NodeModel().where('id', request.id).update({status: -1});
        (new QueueModel).insert({
            type: 'file/deleteForever',
            payload: {list: curNode.id},
            status: 1,
        });
        // const fileIdSet = new Set<number>();
        // for (const type in curNode.index_file_id) {
        //     fileIdSet.add(curNode.index_file_id[type]);
        // }
        // if (curNode.type === 'directory') {
        //     const cascadeNode = await (new NodeModel).whereRaw('find_in_set( ? ,list_node)', curNode.id).select([
        //         'id',
        //         'title',
        //         'type',
        //         'index_file_id',
        //     ]);
        //     cascadeNode.forEach(node => {
        //         for (const type in node.index_file_id) {
        //             fileIdSet.add(node.index_file_id[type]);
        //         }
        //     });
        // }
        // const fileList = await (new FileModel).whereIn('id', Array.from(fileIdSet)).select();
        return;
    }

};