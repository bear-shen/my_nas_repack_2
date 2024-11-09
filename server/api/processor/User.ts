import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_user_del_req, api_user_del_resp, api_user_list_req, api_user_list_resp, api_user_login_req, api_user_login_resp, api_user_mod_req, api_user_mod_resp,} from '../../../share/Api';
import {makePass} from '../../lib/Auth';
import UserModel from '../../model/UserModel';
import crypto from 'node:crypto';
import AuthModel from '../../model/AuthModel';
import UserGroupModel from "../../model/UserGroupModel";
import * as Config from "../../Config";
import * as fp from "../../lib/FileProcessor";
import userGroupModel from "../../model/UserGroupModel";
import {col_user} from "../../../share/Database";

export default class {
    async login(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_login_resp> {
        const request = data.fields as api_user_login_req;
        const pass = makePass(request.password);

        const ifUser = await (new UserModel)
            .where('name', request.username)
            .where('password', pass).first();
        if (!ifUser) throw new Error('invalid username or password');
        const result = ifUser as api_user_login_resp;
        const group = await (new UserGroupModel).where('id', result.id_group).first();
        result.group = group;
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
        if (request.id_group) {
            model.where('id_group', request.id_group);
        }
        // if (request.status) {
        //     model.where('status', 0);
        // } else {
        //     model.where('status', 1);
        // }
        model.order('id', 'desc');
        const userLs = await model.select() as api_user_list_resp;
        userLs.forEach(user => {
            user.password = '';
        })
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
        const modReq = {
            id_group: request.id_group,
            name: request.name,
            mail: request.mail,
            status: request.status,
        } as api_user_mod_req;
        if (request.password) {
            modReq.password = makePass(request.password);
        }
        if (parseInt(request.id)) {
            // const ifExs = await (new UserModel()).where('id', request.id).first();
            await (new UserModel()).where('id', request.id).update(modReq);
        } else {
            const res = await (new UserModel()).insert(modReq) as col_user[];
            request.id = `${res[0].id}`;
        }
        return request;
    };

    async auth(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<void> {
        // console.info('auth');
        // console.info(req.headers.cookie);
        if (!req.headers.cookie) {
            // console.info('if (!req.headers.cookie) {');
            res.statusCode = 401;
            return null;
        }
        //
        const tokenReg = req.headers.cookie.match(/\btoken=(\w+)/);
        if (!tokenReg) {
            // console.info('if (!tokenReg) {');
            res.statusCode = 401;
            return null;
        }
        const token = tokenReg[1];
        const auth = await (new AuthModel).where('token', token).first(['uid']);
        if (!auth) {
            // console.info('if (!auth) {');
            res.statusCode = 401;
            return null;
        }
        //
        const user = await (new UserModel).where('id', auth.uid).first();
        if (!user) {
            // console.info('if (!user) {');
            res.statusCode = 401;
            return null;
        }
        //
        const userGroup = await (new userGroupModel).where('id', user.id_group).first();
        if (!userGroup) {
            // console.info('if (!userGroup) {');
            res.statusCode = 401;
            return null;
        }
        const userAuth = userGroup.auth;
        //
        if (!req.headers['x-original-uri']) {
            // console.info('if (!req.headers[\'x-original-uri\']) {');
            res.statusCode = 401;
            return null;
        }
        let uri = req.headers['x-original-uri'];
        if (typeof uri !== 'string') uri = uri[0];
        //
        // const urlInfo = new URL(uri);
        // console.info(urlInfo);
        const pathDef = Config.get('path');
        // console.info(pathDef, uri, pathDef.root_web);
        if (uri.indexOf(pathDef.root_web) !== 0) {
            uri = decodeURIComponent(uri);
        }
        if (uri.indexOf(pathDef.root_web) !== 0) {
            // console.info('if (uri.indexOf(pathDef.root_web) !== 0) {');
            res.statusCode = 403;
            return null;
        }
        let relPath = uri.substring(pathDef.root_web.length);
        // console.info(relPath);
        //
        let nodeType = 'raw';
        let subLs = [
            'temp',
            'preview',
            'normal',
            'cover',
        ];
        for (let i1 = 0; i1 < subLs.length; i1++) {
            let subName = pathDef['prefix_' + subLs[i1]];
            if (relPath.indexOf('/' + subName + '/') !== 0) continue;
            nodeType = subLs[i1];
            relPath = relPath.substring(subName.length + 1);
        }
        //预览和封面一类的文件后缀会被修改，所以只针对目录进行判断
        relPath = fp.dirname(relPath);
        // console.info(nodeType, relPath);
        let nodeDir = await fp.get(relPath);
        // console.info(nodeDir);
        if (!nodeDir) {
            relPath = decodeURIComponent(relPath);
            nodeDir = await fp.get(relPath);
        }
        // console.info(nodeDir, relPath);
        if (!nodeDir) {
            // console.info('if (!nodeDir) {');
            res.statusCode = 403;
            return null;
        }
        // console.info(nodeDir, relPath);
        //
        if (userAuth && userAuth.deny) {
            // console.info(userAuth.deny);
            let allow = true;
            userAuth.deny.forEach(node => {
                if (nodeDir.id == node.id) {
                    allow = false;
                    return;
                }
                if (nodeDir.node_id_list.indexOf(node.id) != -1) {
                    allow = false;
                    return;
                }
            });
            if (!allow) {
                // console.info('if (!nodeDir) {');
                res.statusCode = 401;
                return null;
            }
        }
        // console.info(ifNodeExs);
        res.statusCode = 200;
        return null;
    };
};