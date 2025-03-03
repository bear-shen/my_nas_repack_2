import BaseModel from "./BaseModel";
import {col_rate, col_share} from "../../share/Database";

class ShareModel extends BaseModel<col_share> {
    public table = 'share';

    _col_get_id_user(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_set_node_id_list(input: number[]): string {
        if (!input) return '[]';
        return JSON.stringify(input);
    }
}

export default ShareModel;
