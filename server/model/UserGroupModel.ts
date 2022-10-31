import BaseModel from "./BaseModel";
import { UserGroupCol } from "../Database";

class UserGroupModel extends BaseModel<UserGroupCol> {
    public table = 'user_group';

    _col_get_auth(input: string): { [key: string]: any } {
        if (!input) return {};
        const res = JSON.parse(input);
        return res ? res : {};
    }

    _col_set_auth(input: any): string {
        if (!input) return '{}';
        return JSON.stringify(input);
    }
}

export default UserGroupModel;