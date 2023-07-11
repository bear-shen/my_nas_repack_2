import {Fields} from 'formidable';
import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_user_del_req, api_user_del_resp, api_user_list_req, api_user_list_resp, api_user_login_req, api_user_login_resp, api_user_mod_req, api_user_mod_resp,} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../../share/GenFunc';
import {col_node, col_tag} from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import FileModel from '../../model/FileModel';
import {makePass} from '../../lib/Auth';
import UserModel from '../../model/UserModel';
import crypto from 'node:crypto';
import AuthModel from '../../model/AuthModel';

export default class {
    async login(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_login_resp> {
        const request = data.fields as api_user_login_req;
        const pass = makePass(request.password);
        const ifUser = await (new UserModel)
            .where('name', request.username)
            .where('password', pass).first();
        if (!ifUser) throw new Error('invalid username or password');
        const result = ifUser as api_user_login_resp;
        const token = crypto.randomBytes(32).toString("hex").toLowerCase();
        (new AuthModel).insert({
            token: token,
            uid: ifUser.id,
        });
        result.token = token;
        delete result.password;
        return result;
    };


    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_list_req> {
        const request = data.fields as api_user_list_req;
        const model = new UserModel();
        if (request.keyword) {
            model.where(function (model: UserModel) {
                model.where(
                    // 'index_node',
                    'name',
                    'like',
                    `%${request.keyword}%`
                ).or().where(
                    // 'index_node',
                    'mail',
                    'like',
                    `%${request.keyword}%`
                );
            });
        }
        if (request.status) {
            model.where('status', 0);
        } else {
            model.where('status', 1);
        }
        model.order('id', 'desc');
        const userLs = await model.select() as api_user_list_resp[];
        //
        return userLs;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_del_resp> {
        const request = data.fields as api_user_del_req;
        const curUser = await (new UserModel()).where('id', request.id).first();
        if (!curUser) return;
        const model = await (new UserModel()).where('id', request.id).update({status: curUser.status * 1 ? 0 : 1});
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_mod_resp> {
        const request = data.fields as api_user_mod_req;
        if (parseInt(request.id)) {
            // const ifExs = await (new UserModel()).where('id', request.id).first();
            await (new UserModel()).where('id', request.id).update({
                id_group: request.id_group,
                name: request.name,
                mail: request.mail,
                password: request.password,
                status: request.status,
            });
        } else {
            const res = await (new UserModel()).insert({
                id_group: request.id_group,
                name: request.name,
                mail: request.mail,
                password: request.password,
                status: request.status,
            });
            request.id = `${res.insertId}`;
        }
        return request;
    };
};