import BaseModel from "./BaseModel";
import {col_favourite_group} from "../../share/Database";

class FavouriteGroupModel extends BaseModel<col_favourite_group> {
    public table = 'favourite_group';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_user(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

/*    _col_get_meta(input: string): { [key: string]: any } {
        if (!input) return {};
        const res = JSON.parse(input);
        return res ? res : null;
    }

    _col_set_meta(input: any): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }*/
}

export default FavouriteGroupModel;
