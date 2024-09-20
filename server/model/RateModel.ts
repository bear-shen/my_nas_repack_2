import BaseModel from "./BaseModel";
import {col_rate} from "../../share/Database";

class RateModel extends BaseModel<col_rate> {
    public table = 'rate';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_user(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_node(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    /*_col_get_meta(input: string): { [key: string]: any } {
        if (!input) return {};
        const res = JSON.parse(input);
        return res ? res : null;
    }

    _col_set_meta(input: any): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }*/
}

export default RateModel;
