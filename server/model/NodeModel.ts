import BaseModel from "./BaseModel";
import {col_node} from "../../share/Database";

class NodeModel extends BaseModel<col_node> {
    public table = 'node';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_parent(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_rel_node_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    // _col_get_node_id_list(input: string): number[] {
    //     if (!input) return [];
    //     const res = input.split(',').map(value => parseInt(value));
    //     return res ? res : [];
    // }

    _col_set_node_id_list(input: number[]): string {
        if (!input) return '[]';
        return JSON.stringify(input);
    }

    // _col_get_file_index(input: string): { [key: string]: any } {
    //     if (!input) return {};
    //     const res = JSON.parse(input);
    //     return res ? res : null;
    // }

    _col_set_file_index(input: { [key: string]: any }): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }

    // _col_get_tag_id_list(input: string): number[] {
    //     if (!input) return [];
    //     const res = input.split(',').map(value => parseInt(value));
    //     return res ? res : [];
    // }

    _col_set_tag_id_list(input: number[]): string {
        if (!input) return '[]';
        return JSON.stringify(input);
    }

    _col_get_node_index(input: string): { [key: string]: any } {
        if (!input) return {};
        const res = JSON.parse(input);
        return res ? res : null;
    }

    _col_set_node_index(input: { [key: string]: any }): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }

}

export default NodeModel;
