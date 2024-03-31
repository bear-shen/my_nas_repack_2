import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_queue_list_req, api_queue_list_resp,} from '../../../share/Api';
import QueueModel from "../../model/QueueModel";

export default class {

    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_queue_list_resp> {
        const request = data.fields as api_queue_list_req;
        const model = new QueueModel();
        console.info(request);
        if (request.id) {
            model.where('id', request.id);
        }
        if (request.status) {
            model.where('status', request.status);
        }
        if (request.type) {
            model.where('type', 'like', `%${request.type}%`);
        }
        model.page(parseInt(request.page ?? '1'), 100)
        const list = await model.order('id', 'desc').select() as any[];
        // const target: api_queue_list_resp = [];
        for (let i1 = 0; i1 < list.length; i1++) {
            const row = list[i1];
            row.payload = JSON.stringify(row.payload);
        }
        return list;
    };
};