// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import type {api_favourite_group_del_req, api_favourite_group_del_resp, api_favourite_group_list_req, api_favourite_group_list_resp, api_favourite_group_mod_req, api_favourite_group_mod_resp} from "../../../share/Api";
import FavouriteGroupModel from "../../model/FavouriteGroupModel";

export default class {
    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_group_list_resp> {
        const request = data.fields as api_favourite_group_list_req;
        const model = new FavouriteGroupModel();
        if (request.id) {
            model.where('id', request.id);
        }
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
        const favGroupLs = await model.select();
        //
        return favGroupLs;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_group_del_resp> {
        const request = data.fields as api_favourite_group_del_req;
        const model = await (new FavouriteGroupModel()).where('id', request.id).update({status: 0});
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_group_mod_resp> {
        const request = data.fields as api_favourite_group_mod_req;
        if (parseInt(request.id)) {
            // const ifExs = await (new TagGroupModel()).where('id', request.id).first();
            await (new FavouriteGroupModel()).where('id', request.id).update({
                title: request.title,
                status: request.status,
            });
        } else {
            const res = await (new FavouriteGroupModel()).insert({
                title: request.title,
                status: request.status,
            });
            request.id = `${res.insertId}`;
        }
        return request;
    };
};