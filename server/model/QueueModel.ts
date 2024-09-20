import BaseModel from "./BaseModel";
import { col_queue } from "../../share/Database";

class QueueModel extends BaseModel<col_queue> {
    table = 'queue';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    // _col_get_payload(input: string): { [key: string]: any } {
    //     if (!input) return {};
    //     const res = JSON.parse(input);
    //     return res ? res : {};
    // }

    _col_set_payload(input: any): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }
}

export default QueueModel;