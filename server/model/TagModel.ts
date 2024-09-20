import BaseModel from "./BaseModel";
import NodeModel from "./NodeModel";
import { col_tag } from "../../share/Database";

class TagModel extends BaseModel<col_tag> {
    public table = 'tag';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_group(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    // _col_get_alt(input: string): string[] {
    //     if (!input) return [];
    //     const res = input.split(',');
    //     return res ? res : [];
    // }

    _col_set_alt(input: any): string {
        if (!input) return '[]';
        return JSON.stringify(input);
    }

    // _col_get_index_tag(input: string): string[] {
    //     if (!input) return [];
    //     const res = input.split(',');
    //     return res ? res : [];
    // }

    _col_set_index_tag(input: any): string {
        if (!input) return '[]';
        return JSON.stringify(input);
    }
}

export default TagModel;
