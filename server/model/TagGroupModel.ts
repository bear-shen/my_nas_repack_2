import BaseModel from "./BaseModel";
import NodeModel from "./NodeModel";
import {col_tag_group} from "../../share/Database";

class TagGroupModel extends BaseModel<col_tag_group> {
    public table = 'tag_group';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_sort(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_node(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }
}

export default TagGroupModel;
