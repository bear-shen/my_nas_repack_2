// import PersistentFile from 'formidable';
import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_rate_attach_req, api_rate_attach_resp} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import RateModel from "../../model/RateModel";

export default class {
    async attach(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<null | api_rate_attach_resp> {
        const request = data.fields as api_rate_attach_req;
        const nodeIdArr = request.node_id_list.split(',');
        // console.info(nodeIdArr);
        for (let i1 = 0; i1 < nodeIdArr.length; i1++) {
            const id = nodeIdArr[i1];
            const node = await (new NodeModel()).where('id', id).first();
            if (!node) throw new Error('node not exist');
            const ifExs = await (new RateModel())
                .where('id_user', data.uid)
                .where('id_node', node.id)
                .first();
            if (ifExs) {
                await (new RateModel()).where('id', ifExs.id).update({
                    rate: request.rate,
                })
            } else {
                await (new RateModel()).insert({
                    id_user: data.uid,
                    id_node: id,
                    rate: request.rate,
                })
            }
        }
        return null;
    }
}