import BaseModel from "./BaseModel";
import { col_user } from "../../share/Database";

class UserModel extends BaseModel<col_user> {
    public table = '"user"';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_id_group(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }
}

export default UserModel;