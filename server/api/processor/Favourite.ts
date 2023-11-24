// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_favourite_attach_req, api_favourite_attach_resp, api_favourite_bath_attach_req, api_favourite_bath_attach_resp, api_favourite_del_req, api_favourite_del_resp} from '../../../share/Api';
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
        const groupArr = request.list_group.split(',');
        const node = await (new NodeModel()).where('id', request.id_node).first();
        if (!node) throw new Error('node not exist');
        await (new FavouriteModel())
            .where('id_user', data.uid)
            .where('id_node', node.id)
            .not().whereIn('id_group', groupArr).update({
                status: 0,
            });
        //
        const curFavGroupLs = await (new FavouriteModel())
            .where('id_user', data.uid)
            .where('id_node', node.id)
            .select();
        const curFavGroupMap: Map<number, number> = new Map();
        curFavGroupLs.forEach(group => {
            curFavGroupMap.set(group.id_group, group.id);
        });
        for (let i1 = 0; i1 < groupArr.length; i1++) {
            let groupId = parseInt(groupArr[i1]);
            let ifExs = curFavGroupMap.get(groupId);
            if (ifExs) {
                await (new FavouriteModel()).where('id', ifExs).update({
                    status: 1,
                });
                // curFavGroupMap.delete(ifExs);
            } else {
                await (new FavouriteModel()).insert({
                    id_user: data.uid,
                    id_group: groupId,
                    id_node: node.id,
                    status: 1,
                });
            }
        }
        return;
    };

    async bath_attach(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_favourite_bath_attach_resp> {
        const request = data.fields as api_favourite_bath_attach_req;
        const groupArr = request.list_group.split(',');
        const nodeArr = request.list_node.split(',');
        const nodeLs = await (new NodeModel()).whereIn('id', nodeArr).select();
        await (new FavouriteModel())
            .where('id_user', data.uid)
            .whereIn('id_node', nodeArr)
            .not().whereIn('id_group', groupArr).update({
                status: 0,
            });
        for (let i2 = 0; i2 < nodeLs.length; i2++) {
            const node = nodeLs[i2];
            //
            const curFavGroupLs = await (new FavouriteModel())
                .where('id_user', data.uid)
                .where('id_node', node.id)
                .select();
            const curFavGroupMap: Map<number, number> = new Map();
            curFavGroupLs.forEach(group => {
                curFavGroupMap.set(group.id_group, group.id);
            });
            for (let i1 = 0; i1 < groupArr.length; i1++) {
                let groupId = parseInt(groupArr[i1]);
                let ifExs = curFavGroupMap.get(groupId);
                if (ifExs) {
                    await (new FavouriteModel()).where('id', ifExs).update({
                        status: 1,
                    });
                    // curFavGroupMap.delete(ifExs);
                } else {
                    await (new FavouriteModel()).insert({
                        id_user: data.uid,
                        id_group: groupId,
                        id_node: node.id,
                        status: 1,
                    });
                }
            }
        }
        return;
    };
};