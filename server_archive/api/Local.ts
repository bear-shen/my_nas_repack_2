import {Fields} from 'formidable';
import {PersistentFile} from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {
    api_file_list_resp, api_node_col, api_file_list_req,
    api_file_upload_resp, api_file_upload_req, api_file_mkdir_resp,
    api_file_mkdir_req, api_file_mov_req, api_file_mod_req,
    api_file_cover_req, api_file_cover_resp, api_file_delete_resp,
    api_file_delete_req, api_local_import_req, api_local_ls_req,
    api_local_rm_req, api_local_mv_req, api_local_cp_req,
} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../lib/GenFunc';
import {col_node, col_tag} from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import * as fp from "../../lib/FileProcessor";
import QueueModel from "../../model/QueueModel";

export default class {
    async ls(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_local_ls_req;
        const dt = await lfp.ls(request.path);
        return dt;
    };

    async rm(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_local_rm_req;
        const dt = await lfp.rm(request.path);
        return dt;
    };

    async mv(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_local_mv_req;
        const dt = await lfp.mv(request.from, request.to);
        return dt;
    };

    async cp(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_local_cp_req;
        const dt = await lfp.cp(request.from, request.to);
        return dt;
    };

    async upd(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_mov_req;
        return null;
    };

    async imp(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_local_import_req;
        await (new QueueModel).insert({
            type: 'import/run',
            payload: request,
            status: 1,
        });
        return null;
    };

};