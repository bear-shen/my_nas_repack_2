import { Fields } from 'formidable';
import PersistentFile from 'formidable';
import { IncomingMessage, ServerResponse } from 'http';
import { ParsedForm } from '../types';
import { api_file_list_resp, api_node_col, api_file_list_req } from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../../share/GenFunc';
import { col_node, col_tag } from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import FileModel from '../../model/FileModel';
export default {
    ls: async function (data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_list_resp> {
        const request = data.fields as api_file_list_req;
        const treeLs = [];
        const listLs = [];
        const target = {
            path: [] as col_node[],
            list: [] as api_node_col[],
        };
        if (request.pid) {
            const model = new NodeModel();
            const curNode = await model.where('id', request.pid).first();
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
        }
        const model = new NodeModel();
        if (request.keyword) {
            model.where('index_node', 'like', `%${request.keyword}%`);
        }
        if (request.pid) {
            model.where('id_parent', request.pid);
        }
        if (request.tid) {
            model.whereRaw('find_in_set(?,list_tag_id)', request.tid);
        }
        if (request.type) {
            model.where('type', request.type);
        }
        if (request.sort) {
            switch (request.sort) {
                case 'id_asc': model.order('id', 'asc'); break;
                case 'id_desc': model.order('id', 'desc'); break;
                case 'name_asc': model.order('title', 'asc'); break;
                case 'name_desc': model.order('title', 'desc'); break;
                case 'crt_asc': model.order('time_create', 'asc'); break;
                case 'crt_desc': model.order('time_create', 'desc'); break;
                case 'upd_asc': model.order('time_update', 'asc'); break;
                case 'upd_desc': model.order('time_update', 'desc'); break;
            }
        }
        const nodeLs: api_node_col[] = await model.select();
        //
        const tagIdSet = new Set<number>();
        const fileIdSet = new Set<number>();
        nodeLs.forEach(node => {
            node.list_tag_id.forEach(tagId => {
                tagIdSet.add(tagId);
            });
            for (const type in node.index_file_id) {
                if (!Object.prototype.hasOwnProperty.call(node.index_file_id, type)) continue;
                const fileId = node.index_file_id[type];
                fileIdSet.add(fileId);
            }

        });
        if (tagIdSet.size) {
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
                    node.tag.push(Object.assign(tagGroup, { sub: tagLs }));
                });
            });
        }
        if (fileIdSet.size) {
            const fileLs = await (new FileModel).whereIn('id', Array.from(fileIdSet)).select();
            const fileMap = GenFunc.toMap(fileLs, 'id');
            // const tagGroupIdSet = new Set();
            nodeLs.forEach(node => {
                node.file = {};
                for (const key in node.index_file_id) {
                    if (!Object.prototype.hasOwnProperty.call(node.index_file_id, key)) continue;
                    const fileId = node.index_file_id[key];
                    const file = fileMap.get(fileId);
                    node.file[key] = file;
                }
            });
        }
        //
        return target;
    },
    del: async function (data: ParsedForm, req: IncomingMessage, res: ServerResponse) { },
    mov: async function (data: ParsedForm, req: IncomingMessage, res: ServerResponse) { },
    mod: async function (data: ParsedForm, req: IncomingMessage, res: ServerResponse) { },
    upd: async function (data: ParsedForm, req: IncomingMessage, res: ServerResponse) { },
};