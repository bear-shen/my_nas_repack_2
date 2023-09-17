import BaseModel from "./BaseModel";
import {col_setting} from "../../share/Database";

class SettingModel extends BaseModel<col_setting> {
    public table = 'settings';

    _col_get_value(input: string): { [key: string]: any } {
        let tVal = null;
        try {
            tVal = JSON.parse(input);
        } catch (e) {
            // console.info(e);
            tVal = {};
        }
        return tVal;
    }

    _col_set_value(input: any): string {
        let tVal = '{}';
        try {
            tVal = JSON.stringify(input);
        } catch (e) {
            // console.info(e);
            tVal = '{}';
        }
        return tVal;
    }
}

export default SettingModel;