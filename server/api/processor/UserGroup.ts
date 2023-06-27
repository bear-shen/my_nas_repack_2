import {Fields} from 'formidable';
// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../../share/GenFunc';
import FileModel from '../../model/FileModel';
import * as fp from "../../lib/FileProcessor";
import ORM from "../../lib/ORM";
import {ResultSetHeader} from "mysql2";
import type {api_user_group_del_req, api_user_group_del_resp, api_user_group_list_req, api_user_group_list_resp, api_user_group_mod_req, api_user_group_mod_resp} from "../../../share/Api";
import UserGroupModel from "../../model/UserGroupModel";
import UserModel from "../../model/UserModel";

export default class {
    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_group_list_req> {
        const request = data.fields as api_user_group_list_req;
        const model = new UserGroupModel();
        if (request.keyword) {
            model.where(
                // 'index_node',
                'title',
                'like',
                `%${request.keyword}%`
            );
        }
        if (request.status) {
            model.where('status', 0);
        } else {
            model.where('status', 1);
        }
        model.order('id', 'desc');
        const userGroupLs = await model.select() as api_user_group_list_resp[];
        //
        return userGroupLs;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_group_del_resp> {
        const request = data.fields as api_user_group_del_req;
        const curGroup = await (new UserGroupModel()).where('id', request.id).first();
        if (!curGroup) return;
        const model = await (new UserGroupModel()).where('id', request.id).update({status: curGroup.status * 1 ? 0 : 1});
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_group_mod_resp> {
        const request = data.fields as api_user_group_mod_req;
        let authArr = [];
        if (request.auth)
            authArr = JSON.parse(request.auth);
        if (!authArr) authArr = [];
        if (parseInt(request.id)) {
            // const ifExs = await (new UserGroupModel()).where('id', request.id).first();
            await (new UserGroupModel()).where('id', request.id).update({
                title: request.title,
                description: request.description,
                admin: request.admin,
                status: request.status,
                auth: authArr,
            });
        } else {
            const res = await (new UserGroupModel()).insert({
                title: request.title,
                description: request.description,
                admin: request.admin,
                status: request.status,
                auth: authArr,
            });
            request.id = `${res.insertId}`;
        }

        return request;
    };
};