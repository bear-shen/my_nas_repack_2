import BaseModel from "./BaseModel";
import {col_favourite} from "../../share/Database";

class FavouriteModel extends BaseModel<col_favourite> {
    public table = 'favourite';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_user(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_group(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_node(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }
}

export default FavouriteModel;
