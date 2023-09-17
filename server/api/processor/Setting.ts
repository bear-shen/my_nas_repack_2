import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_setting_del_req, api_setting_del_resp, api_setting_list_req, api_setting_list_resp, api_setting_mod_req, api_setting_mod_resp,} from '../../../share/Api';
import SettingModel from "../../model/SettingModel";

export default class {

    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_setting_list_resp> {
        const request = data.fields as api_setting_list_req;
        const model = new SettingModel();
        const list = await model.order('id', 'desc').select() as any[];
        const target: api_setting_list_resp = [];
        for (let i1 = 0; i1 < list.length; i1++) {
            const row = list[i1];
            row.value = JSON.stringify(list[i1].value);
        }
        return list;
    };

    async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_setting_del_resp> {
        const request = data.fields as api_setting_del_req;
        const curSetting = await (new SettingModel()).where('id', request.id).first();
        if (!curSetting) return;
        const model = await (new SettingModel()).where('id', request.id).update({status: curSetting.status * 1 ? 0 : 1});
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_setting_mod_resp> {
        const request = data.fields as api_setting_mod_req;
        // console.info(eval(request.value));

        const modReq = {
            name: request.name,
            //这样会导致直接赋值为null或者false的报错
            value: JSON.parse(request.value) ?? {},
            // value: eval(request.value),
        } as api_setting_mod_req;

        if (parseInt(request.id)) {
            // const ifExs = await (new settingModel()).where('id', request.id).first();
            await (new SettingModel()).where('id', request.id).update(modReq);
        } else {
            const res = await (new SettingModel()).insert(modReq);
            request.id = `${res.insertId}`;
        }
        return request;
    };
};