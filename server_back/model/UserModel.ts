import BaseModel from "./BaseModel";
import { UserCol } from "../../share/database";

class UserModel extends BaseModel<UserCol> {
    public table = 'user';
}

export default UserModel;