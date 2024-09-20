import BaseModel from "./BaseModel";
import {col_auth} from "../../share/Database";


class AuthModel extends BaseModel<col_auth> {
    table = 'auth';

    _col_get_id(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }

    _col_get_uid(input: string): number {
        if (!input) return null;
        return parseInt(input);
    }
}

export default AuthModel;