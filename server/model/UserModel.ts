import BaseModel from "./BaseModel";
import { col_user } from "../../share/Database";

class UserModel extends BaseModel<col_user> {
    public table = '"user"';
}

export default UserModel;