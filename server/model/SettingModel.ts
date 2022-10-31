import BaseModel from "./BaseModel";
import { SettingCol } from "../../share/Database";

class SettingModel extends BaseModel<SettingCol> {
    public table = 'settings';

    _col_get_value(input: string): { [key: string]: any } {
        if (!input) return {};
        const res = JSON.parse(input);
        return res ? res : {};
    }

    _col_set_value(input: any): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }
}

export default SettingModel;