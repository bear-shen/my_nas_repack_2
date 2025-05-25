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
import {col_node, col_node_file_index, col_user} from "../../../share/Database";
import NodeModel from '../../model/NodeModel';
import ShareModel from '../../model/ShareModel';

const {
    compareSync,
} = require("bcrypt-ts/node");
export default class {
    async login(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_user_login_resp> {
        const request = data.fields as api_user_login_req;
        // const pass = makePass(request.password);

        const ifUser = await (new UserModel)
            .where('name', request.username).first();
        if (!ifUser) throw new Error('invalid username or password');
        const ifMatch = compareSync(request.password, ifUser.password);
        if (!ifMatch) throw new Error('invalid username or password');
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
        // console.info(req.url);
        // console.info(req.rawHeaders);
        //-------------------------------------------------------------
        if (!req.headers['x-original-uri']) {
            res.statusCode = 400;
            return null;
        }
        let uri = req.headers['x-original-uri'];
        if (typeof uri !== 'string') uri = uri[0];
        let uriInfo = new URL('http://0.0.0.0' + uri);
        if (!uriInfo) {
            res.statusCode = 400;
            return null;
        }
        uri = uriInfo.pathname;
        //-------------------------------------------------------------
        //分享的权限
        //最开始分享做的是在api里校验文件然后传输，这样就不必暴露完整的文件路径
        //但是这样就遇到一个问题，无论怎么照抄nginx返回的响应头都没法做到正常的视频预加载，会产生两倍流量。。。
        //所以还是回到这边做授权认证了。。。
        if(uriInfo.searchParams.has('shareId')){
            // const isValidShare=await checkShare(uriInfo.searchParams.get('shareId'),uri);
            const shareId=uriInfo.searchParams.get('shareId');
            let ifErr=null;
            const share=await new ShareModel().where('id',shareId).first().catch(()=>{
                ifErr=true;
            });
            if(ifErr){
                res.statusCode = 401;
                return null;
            }
            if(!share){
                res.statusCode = 401;
                return null;
            }
            const getNode=await locateNode(uri,true);
            if(getNode[0]!=='success'){
                res.statusCode = 401;
                return null;
            }
            const node=getNode[1];
            let inShare=false;
            share.node_id_list.forEach(shareNodeId=>{
                if(node.node_id_list.indexOf(shareNodeId)!==-1){
                    inShare=true;
                    return;
                }
                if(node.id==shareNodeId){
                    inShare=true;
                    return;
                }
            });
            if(!inShare){
                res.statusCode = 401;
                return null;
            }
            res.statusCode = 200;
            return null;
        }
        //-------------------------------------------------------------
        let token: string;
        if (uriInfo.searchParams && uriInfo.searchParams.has('tosho_token')) {
            token = uriInfo.searchParams.get('tosho_token');
        }
        if (!token && req.headers.cookie) {
            const cookiesArr = req.headers.cookie.split(';');
            cookiesArr.forEach(cookie => {
                const cookieArr = cookie.trim().split('=');
                if (cookieArr[0] !== 'tosho_token') return;
                cookieArr.shift();
                const cookieVal = cookieArr.join('=');
                token = cookieVal;
            });
        }
        if (!token) {
            // console.info('if (!tokenReg) {');
            res.statusCode = 401;
            return null;
        }
        //-------------------------------------------------------------
        const auth = await (new AuthModel).where('token', token).first(['uid']);
        if (!auth) {
            // console.info('if (!auth) {');
            res.statusCode = 401;
            return null;
        }
        //
        const user = await (new UserModel).where('id', auth.uid).first(['id', 'id_group']);
        if (!user) {
            // console.info('if (!user) {');
            res.statusCode = 401;
            return null;
        }
        //
        const userGroup = await (new userGroupModel).where('id', user.id_group).first(['id', 'auth']);
        if (!userGroup) {
            // console.info('if (!userGroup) {');
            res.statusCode = 401;
            return null;
        }
        const userAuth = userGroup.auth;
        //-------------------------------------------------------------
        // const urlInfo = new URL(uri);
        // console.info(urlInfo);
        // const getNodeDir=await locateNode(uri,true);
        const getNodeDir=await locateNode(uri,false);
        // console.info(getNodeDir);
        if(getNodeDir[0]!=='success'){
            res.statusCode = 401;
            return null;
        }
        const nodeDir=getNodeDir[1];
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

async function locateNode(uri:string,detailNode?:boolean):Promise<[string,col_node|null]>{
    const pathDef = Config.get('path');
    // console.info(pathDef, uri, pathDef.root_web);
    if (uri.indexOf(pathDef.root_web) !== 0) {
        uri = decodeURIComponent(uri);
    }
    if (uri.indexOf(pathDef.root_web) !== 0) {
        return ['not web root',null];
    }
    //
    let relPath = uri.substring(pathDef.root_web.length);
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
        break;
    }
    relPath = fp.dirname(relPath);
    let nodeDir = await fp.get(relPath);
    if (!nodeDir) {
        relPath = decodeURIComponent(relPath);
        nodeDir = await fp.get(relPath);
    }
    if(!detailNode){
        return ['success',nodeDir];
    }
    let tNode:null|col_node=null;
    const sNodeLs=await (new NodeModel().where('id_parent',nodeDir.id).select(['id','title','file_index']));
    const fileName=decodeURIComponent(fp.basename(uri));
    sNodeLs.forEach(sNode=>{
        if(tNode)return;
        if(!sNode.file_index[nodeType])return;
        // console.info(sNode.title,nodeType,fileName);
        const tFileIndex=sNode.file_index[nodeType] as col_node_file_index;
        if(tFileIndex.ext){
            if(fileName==(sNode.title+'.'+tFileIndex.ext)){
                return tNode=sNode;
            }
        }else{
            if(fileName==sNode.title){
                return tNode=sNode;
            }
        }
    });
    if(!tNode){
        return ['node not found',null];
    }
    const tNodeDetail=await (new NodeModel()).where('id',tNode.id).first();
    return ['success',tNodeDetail];
}