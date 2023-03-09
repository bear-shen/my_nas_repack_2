import {Fields} from 'formidable';
// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../../share/GenFunc';
import type {col_node, col_tag, col_tag_group} from '../../../share/Database';
import TagGroupModel from '../../model/TagGroupModel';
import FileModel from '../../model/FileModel';
import * as fp from "../../lib/FileProcessor";
import ORM from "../../lib/ORM";
import {ResultSetHeader} from "mysql2";
import type {api_tag_group_col, api_tag_group_del_req, api_tag_group_del_resp, api_tag_group_list_req, api_tag_group_list_resp, api_tag_group_mod_resp} from "../../../share/Api";
import {api_tag_group_mod_req} from "../../../share/Api";

export default class {
    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_tag_group_list_resp> {
        const request = data.fields as api_tag_group_list_req;
        const model = new TagGroupModel();
        if (request.keyword) {
            model.where(
                // 'index_node',
                'title',
                'like',
                `%${request.keyword}%`
            );
        }
        if (request.is_del) {
            model.where('status', 0);
        } else {
            model.where('status', 1);
        }
        model.order('id', 'desc');
        const tagGroupLs = await model.select() as api_tag_group_col[];
        //
        const nodeIdSet = new Set<number>();
        tagGroupLs.forEach(tagGroup => {
            if (tagGroup.id_node) nodeIdSet.add(tagGroup.id_node);
        })
        const nodeMap = new Map<number, col_node>();
        nodeMap.set(0, {
            id: 0,
            title: 'root',
            id_parent: -1,
            type: 'directory',
            status: 1,
            list_node: [],
        })
        if (nodeIdSet.size) {
            const nodeLs = await (new NodeModel()).whereIn('id', Array.from(nodeIdSet)).select();
            const subNodeIdLs = new Set<number>();
            nodeLs.forEach(node => {
                nodeMap.set(node.id, node);
                if (node.list_node)
                    node.list_node.forEach(nodeId => {
                        if (nodeId) subNodeIdLs.add(nodeId);
                    })
            });
            if (subNodeIdLs.size) {
                const subNodeLs = await (new NodeModel()).whereIn('id', Array.from(subNodeIdLs)).select();
                subNodeLs.forEach(subNode => {
                    nodeMap.set(subNode.id, subNode);
                })
            }
        }
        tagGroupLs.forEach(tagGroup => {
            tagGroup.node = nodeMap.get(tagGroup.id_node);
            tagGroup.node.crumb_node = [];
            if (tagGroup.node.list_node)
                tagGroup.node.list_node.forEach(nodeId => {
                    const node = nodeMap.get(nodeId);
                    tagGroup.node.crumb_node.push({
                        id: node.id,
                        title: node.title,
                    });
                });
        });
        return tagGroupLs;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_tag_group_del_resp> {
        const request = data.fields as api_tag_group_del_req;
        const model = await (new TagGroupModel()).where('id', request.id).update({status: 0});
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_tag_group_mod_resp> {
        const request = data.fields as api_tag_group_mod_req;
        if (parseInt(request.id)) {
            // const ifExs = await (new TagGroupModel()).where('id', request.id).first();
            await (new TagGroupModel()).where('id', request.id).update({
                title: request.title,
                description: request.description,
                id_node: request.id_node,
                sort: request.sort,
                status: request.status,
            });
        } else {
            const res = await (new TagGroupModel()).insert({
                title: request.title,
                description: request.description,
                id_node: request.id_node,
                sort: request.sort,
                status: request.status,
            });
            request.id = `${res.insertId}`;
        }

        return request;
    };
};