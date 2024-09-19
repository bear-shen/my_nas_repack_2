import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import {api_setting_col, api_setting_del_req, api_setting_del_resp, api_setting_list_req, api_setting_list_resp, api_setting_mod_req, api_setting_mod_resp,} from '../../../share/Api';
import SettingModel from "../../model/SettingModel";
import {loadConfig} from "../../ServerConfig";

import QueueModel from "../../model/QueueModel";
import ORM from "../../lib/ORM";
import CacheModel from "../../model/CacheModel";

export default class {

    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_setting_list_resp> {
        const request = data.fields as api_setting_list_req;
        const model = new SettingModel();
        const list = await model.order('id', 'desc').select();
        const target: api_setting_col & { value: string }[] = [];
        for (let i1 = 0; i1 < list.length; i1++) {
            const row = list[i1];
            // console.info(row);
            if (row.name.indexOf('_t_') === 0) continue;
            target.push(Object.assign(
                row,
                {value: JSON.stringify(row.value)}
            ))
        }
        return target;
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
            //这样会导致直接赋值为null或者false的报错，但是eval直接写值容易出问题
            value: JSON.parse(request.value) ?? {},
            // value: eval(request.value),
        } as api_setting_mod_req;

        if (parseInt(request.id)) {
            // const ifExs = await (new settingModel()).where('id', request.id).first();
            await (new SettingModel()).where('id', request.id).update(modReq);
        } else {
            const res = await (new SettingModel()).insert(modReq);
            request.id = `${res[0].id}`;
        }
        // const curTimeStamp = Math.round((new Date().valueOf()) / 60 * 1000).toString();
        const curTimeStamp = new Date().valueOf().toString();
        const ifExs = await (new CacheModel).where('code', 'config_stamp').first();
        if (ifExs) await (new CacheModel).where('code', 'config_stamp').delete();
        await (new CacheModel).insert({
            code: 'config_stamp',
            val: curTimeStamp,
        });
        loadConfig();
        //@todo 后端队列的数据到时候要记得更新，重启或者重新加载
        return request;
    };

    async sync_local_file() {
        const ifExs = await (new QueueModel).where('type', 'sync/run').whereIn('status', [1, 2]).first();
        if (ifExs) throw new Error('sync job running');
        (new QueueModel).insert({
            type: 'sync/run',
            payload: {},
            status: 1,
        });
    }

    async set_node_stat() {
        (new QueueModel).insert({
            type: 'statistics/node',
            payload: {},
            status: 1,
        });
    }


    async check_local_file() {
        const ifExs = await (new QueueModel).where('type', 'sync/check').whereIn('status', [1, 2]).first();
        if (ifExs) throw new Error('chk job running');
        (new QueueModel).insert({
            type: 'sync/check',
            payload: {},
            status: 1,
        });
    }

    async check_local_file_result() {
        const res = await new SettingModel().where('name', '_t_file_check_result')
            .order('id', 'desc').first();
        return res;
    }


};