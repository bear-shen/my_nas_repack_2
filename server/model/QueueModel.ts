import BaseModel from "./BaseModel";
import { QueueCol } from "../../share/Database";

class QueueModel extends BaseModel<QueueCol> {
    table = 'queue';

    _col_get_payload(input: string): { [key: string]: any } {
        if (!input) return {};
        const res = JSON.parse(input);
        return res ? res : {};
    }

    _col_set_payload(input: any): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }
}

export default QueueModel;