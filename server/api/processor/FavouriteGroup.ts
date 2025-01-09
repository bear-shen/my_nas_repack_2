// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import type {api_favourite_group_del_req, api_favourite_group_del_resp, api_favourite_group_list_req, api_favourite_group_list_resp, api_favourite_group_mod_req, api_favourite_group_mod_resp, api_tag_col} from "../../../share/Api";
import FavouriteGroupModel from "../../model/FavouriteGroupModel";
import NodeModel from "../../model/NodeModel";
import {col_favourite_group, col_node, col_tag_group} from "../../../share/Database";
import TagModel from "../../model/TagModel";
import TagGroupModel from "../../model/TagGroupModel";
import FavouriteModel from "../../model/FavouriteModel";

export default class {
    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_group_list_resp> {
        const request = data.fields as api_favourite_group_list_req;
        const model = new FavouriteGroupModel();
        //id在前端做
        // if (request.id) {
        //     model.where('id', request.id);
        // }
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
        model.where('id_user', data.uid);
        model.order('id', 'desc');
        const favGroupLs: api_favourite_group_list_resp = await model.select();
        //
        const tagIdSet = new Set<number>();
        const tagGroupIdSet = new Set<number>();
        for (let i1 = 0; i1 < favGroupLs.length; i1++) {
            const favGroup = favGroupLs[i1];
            if (favGroup.auto) {
                let node: col_node = null;
                if (favGroup.meta.id_dir) {
                    node = await new NodeModel().where('id', favGroup.meta.id_dir).first();
                } else {
                    node = {
                        id: 0,
                        title: 'root',
                        id_parent: -1,
                        type: 'directory',
                        status: 1,
                        node_id_list: [],
                    };
                }
                favGroup.node = node;
                favGroup.tag = [];
                // let tagLs: col_tag[] = [];
                if (favGroup.meta.id_tag) {
                    favGroup.meta.id_tag.split(',').forEach(tagId => {
                        tagIdSet.add(parseInt(tagId));
                    });
                }
            }
        }
        if (tagIdSet.size) {
            const tagLs = await (new TagModel()).whereIn('id', Array.from(tagIdSet)).select();
            tagLs.forEach(tag => tagGroupIdSet.add(tag.id_group));
            if (tagGroupIdSet.size) {
                const tagGroupLs = await (new TagGroupModel()).whereIn('id', Array.from(tagGroupIdSet)).select();
                const tagGroupMap = new Map<number, col_tag_group>();
                tagGroupLs.forEach(tagGroup => tagGroupMap.set(tagGroup.id, tagGroup));
                const tagMap = new Map<number, api_tag_col>();
                tagLs.forEach(tag => {
                    tagMap.set(tag.id, Object.assign(
                        tag, {group: tagGroupMap.get(tag.id_group)}
                    ));
                });
                //
                favGroupLs.forEach(favGroup => {
                    if (favGroup.meta.id_tag) {
                        favGroup.meta.id_tag.split(',').forEach(tagId => {
                            const id = parseInt(tagId);
                            favGroup.tag.push(tagMap.get(id));
                        });
                    }
                });
            }
        }
        return favGroupLs;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_group_del_resp> {
        const request = data.fields as api_favourite_group_del_req;
        const model = await (new FavouriteGroupModel())
            .where('id', request.id)
            .where('id_user', data.uid)
            .delete();
        //一起删除得了
        await (new FavouriteModel())
            .where('id_group', request.id)
            .delete();
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_group_mod_resp> {
        const request = data.fields as api_favourite_group_mod_req;
        if (parseInt(request.id)) {
            // const ifExs = await (new TagGroupModel()).where('id', request.id).first();
            await (new FavouriteGroupModel()).where('id', request.id).update({
                title: request.title,
                status: request.status,
                meta: request.meta ? JSON.parse(request.meta) : {},
                //
            });
        } else {
            const res = await (new FavouriteGroupModel()).insert({
                title: request.title,
                status: request.status,
                meta: request.meta ? JSON.parse(request.meta) : {},
                //
                auto: request.auto,
                id_user: data.uid,
            }) as col_favourite_group[];
            request.id = `${res[0].id}`;
        }
        return request;
    };
};
