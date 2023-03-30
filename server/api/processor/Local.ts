import {Fields} from 'formidable';
import {PersistentFile} from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_file_list_resp, api_node_col, api_file_list_req, api_file_upload_resp, api_file_upload_req, api_file_mkdir_resp, api_file_mkdir_req, api_file_mov_req, api_file_mod_req, api_file_cover_req, api_file_cover_resp, api_file_delete_resp, api_file_delete_req} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../../share/GenFunc';
import {col_node, col_tag} from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import FileModel from '../../model/FileModel';
import * as fp from "../../lib/FileProcessor";
import Config from "../../ServerConfig";

export default class {
    async ls(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_list_req;
        return null;
    };

    async rm(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        return null;
    };

    async mv(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_mov_req;
        return null;
    };

    async upd(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_mov_req;
        return null;
    };

    async imp(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_mov_req;
        return null;
    };

};