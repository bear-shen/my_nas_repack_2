// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import type {api_favourite_group_del_req, api_favourite_group_del_resp, api_favourite_group_list_req, api_favourite_group_list_resp, api_favourite_group_mod_req, api_favourite_group_mod_resp} from "../../../share/Api";
import FavouriteGroupModel from "../../model/FavouriteGroupModel";
import NodeModel from "../../model/NodeModel";
import {col_node, col_tag} from "../../../share/Database";

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
        for (let i1 = 0; i1 < favGroupLs.length; i1++) {
            const favGroup = favGroupLs[i1];
            if (favGroup.auto) {
                let node: col_node = null;
                if (favGroup.meta.pid) {
                    node = await new NodeModel().where('id', favGroup.meta.pid).first();
                } else {
                    node = {
                        id: 0,
                        title: 'root',
                        id_parent: -1,
                        type: 'directory',
                        status: 1,
                        list_node: [],
                    };
                }
                favGroup.node = node;
                let tagLs: col_tag[] = [];
                if(favGroup.meta.tag_id){

                }
            }
        }
        return favGroupLs;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_group_del_resp> {
        const request = data.fields as api_favourite_group_del_req;
        const model = await (new FavouriteGroupModel())
            .where('id', request.id)
            .where('id_user', data.uid)
            .update({status: 0});
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_group_mod_resp> {
        const request = data.fields as api_favourite_group_mod_req;

        if (parseInt(request.id)) {
            // const ifExs = await (new TagGroupModel()).where('id', request.id).first();
            await (new FavouriteGroupModel()).where('id', request.id).update({
                title: request.title,
                status: request.status,
                // id_user: data.uid,
            });
        } else {
            const res = await (new FavouriteGroupModel()).insert({
                title: request.title,
                status: request.status,
                id_user: data.uid,
            });
            request.id = `${res.insertId}`;
        }
        return request;
    };
};