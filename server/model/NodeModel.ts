import BaseModel from "./BaseModel";
import { NodeCol } from "../../share/Database";

class NodeModel extends BaseModel<NodeCol> {
    public table = 'node';

    _col_get_list_node(input: string): number[] {
        if (!input) return [];
        const res = input.split(',').map(value => parseInt(value));
        return res ? res : [];
    }

    _col_set_list_node(input: number[]): string {
        if (!input) return '';
        return input.join(',');
    }

    _col_get_list_tag_id(input: string): number[] {
        if (!input) return [];
        const res = input.split(',').map(value => parseInt(value));
        return res ? res : [];
    }

    _col_set_list_tag_id(input: number[]): string {
        if (!input) return '';
        return input.join(',');
    }

    _col_get_index_file_id(input: string): { [key: string]: any } {
        if (!input) return {};
        const res = JSON.parse(input);
        return res ? res : null;
    }

    _col_set_index_file_id(input: number[]): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }

    _col_get_index_node(input: string): { [key: string]: any } {
        if (!input) return {};
        const res = JSON.parse(input);
        return res ? res : null;
    }

    _col_set_index_node(input: any): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }
}

export default NodeModel;
