import { Fields } from 'formidable';
import PersistentFile from 'formidable';
import { IncomingMessage, ServerResponse } from 'http';
import { ParsedForm } from '../types';
import { api_file_list_resp, api_node_col, api_file_list_req, api_user_login_req, api_user_login_resp } from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../../share/GenFunc';
import { col_node, col_tag } from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import FileModel from '../../model/FileModel';
import { makePass } from '../../lib/Auth';
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
};