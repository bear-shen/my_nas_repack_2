import {Fields} from 'formidable';
import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {api_file_list_resp, api_node_col, api_file_list_req, api_file_upload_resp, api_file_upload_req, api_file_mkdir_resp, api_file_mkdir_req, api_file_mov_req, api_file_mod_req} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../../share/GenFunc';
import {col_node, col_tag} from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import FileModel from '../../model/FileModel';
import * as fp from "../../lib/FileProcessor";
import {
    loadMeta,
    subtitleStr,
    videoStr,
    audioStr,
    imageStr,
} from '../../lib/FFMpeg';
import {getRelPathByFile} from "../../lib/FileProcessor";
import Config from "../../ServerConfig";

export default class {
    static async build(payload: { [key: string]: any }): Promise<any> {
        const nodeId = payload.id;
        const node = await (new NodeModel).where('id', nodeId).first();
        if (!node) throw new Error('node not found');
        const fileId = node.index_file_id.raw;
        if (fileId) {
            const fileRAW = await (new FileModel).where('id', fileId).first();
            if (!fileRAW) throw new Error('file not found');
            const rawFilePath = Config.path.local + getRelPathByFile(fileRAW);
            switch (node.type) {
                case 'audio':
                    loadMeta(rawFilePath);
                    break;
                case 'video':
                    break;
                case 'image':
                    break;
                case 'binary':
                    break;
                case 'text':
                    break;
                case 'subtitle':
                    break;
                case 'pdf':
                    break;
                case 'directory':
                    break;
            }
        }
        await (new NodeModel).where('id', nodeId).update({
            building: 0,
        })
        return;
    }
}