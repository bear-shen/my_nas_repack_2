// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_tag_attach_req, api_tag_attach_resp, api_tag_col, api_tag_del_req, api_tag_del_resp, api_tag_list_req, api_tag_list_resp, api_tag_mod_req, api_tag_mod_resp} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import {col_tag_group} from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import QueueModel from "../../model/QueueModel";

export default class {
    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_tag_list_resp> {
        const request = data.fields as api_tag_list_req;
        const model = new TagModel();
        if (request.keyword) {
            model.where(
                // 'index_node',
                'title',
                'like',
                `%${request.keyword}%`
            );
        }
        if (request.id_group) {
            model.where('id_group', request.id_group);
        }
        if (request.is_del) {
            model.where('status', 0);
        } else {
            model.where('status', 1);
        }
        if (request.size) {
            model.limit(parseInt(request.size));
        }
        model.order('id', 'asc');
        const tagLs: api_tag_col[] = await model.select() as api_tag_col[];
        //
        const groupIdSet = new Set<number>();
        tagLs.forEach(tag => {
            groupIdSet.add(tag.id_group);
        });
        if (groupIdSet.size) {
            const groupLs = await (new TagGroupModel())
                .whereIn('id', Array.from(groupIdSet))
                .select();
            const groupMap = new Map<number, col_tag_group>();
            groupLs.forEach(group => {
                groupMap.set(group.id, group);
            })
            tagLs.forEach(tag => {
                const group = groupMap.get(tag.id_group);
                if (group)
                    tag.group = group;
            });
        }
        return tagLs;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_tag_del_resp> {
        const request = data.fields as api_tag_del_req;
        const model = await (new TagModel()).where('id', request.id).update({status: 0});
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_tag_mod_resp> {
        const request = data.fields as api_tag_mod_req;
        // request.alt = request.alt.split(/,/i);
        if (parseInt(request.id)) {
            // const ifExs = await (new TagModel()).where('id', request.id).first();
            await (new TagModel()).where('id', request.id).update({
                id_group: request.id_group,
                title: request.title,
                alt: request.alt.split(/,/i),
                description: request.description,
                status: request.status,
            });
        } else {
            const res = await (new TagModel()).insert({
                id_group: request.id_group,
                title: request.title,
                alt: request.alt,
                description: request.description,
                status: request.status,
            });
            request.id = `${res.insertId}`;
        }
        return request;
    };

    async attach(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_tag_attach_resp> {
        const request = data.fields as api_tag_attach_req;
        const tagList = request.tag_list.split(',');
        const tagSet = new Set<string>();
        tagList.forEach(tag => {
            if (!tag) return;
            tagSet.add(tag);
        })
        await (new NodeModel()).where('id', request.id_node).update({
            tag_id_list: Array.from(tagSet),
        });
        await (new QueueModel).insert({
            type: 'file/rebuildIndex',
            payload: {id: parseInt(request.id_node)},
            status: 1,
        });
        return;
    };
};