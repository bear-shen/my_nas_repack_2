import BaseModel from "./BaseModel";
import NodeModel from "./NodeModel";
import { col_file } from "../../share/Database";

class FileModel extends BaseModel<col_file> {
    public table = 'file';

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

export default FileModel;
