// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_favourite_attach_req, api_favourite_attach_resp, api_favourite_del_req, api_favourite_del_resp} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import FavouriteModel from '../../model/FavouriteModel';

export default class {
    async detach(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_del_resp> {
        const request = data.fields as api_favourite_del_req;
        const model = await (new FavouriteModel()).where('id', request.id).update({status: 0});
        return null;
    };

    async attach(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_attach_resp> {
        const request = data.fields as api_favourite_attach_req;
        const node = await (new NodeModel()).where('id', request.id_node).first();
        const group = await (new FavouriteModel()).where('id', request.id_group).first();
        if (!node) throw new Error('node not exist');
        if (!group) throw new Error('group not exist');
        const ifExs = await (new FavouriteModel())
            .where('id_node', request.id_node)
            .where('id_group', request.id_group).first();
        if (ifExs) {
            await (new FavouriteModel()).where('id', ifExs.id).update({
                status: ifExs.status * 1 ? 0 : 1
            });
        } else {
            await (new FavouriteModel()).insert({
                id_user: data.uid,
                id_group: request.id_group,
                id_node: request.id_node,
                status: 1,
            });
        }
        return;
    };
};