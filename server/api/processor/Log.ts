import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_queue_list_req, api_queue_list_resp,} from '../../../share/Api';
import QueueModel from "../../model/QueueModel";

export default class {

    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_queue_list_resp> {
        const request = data.fields as api_queue_list_req;
        const model = new QueueModel();
        const list = await model.order('id', 'desc').limit(100).select() as any[];
        const target: api_queue_list_resp = [];
        for (let i1 = 0; i1 < list.length; i1++) {
            const row = list[i1];
            row.value = JSON.stringify(list[i1].value);
        }
        return list;
    };
};