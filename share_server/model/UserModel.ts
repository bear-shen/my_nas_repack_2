import BaseModel from "./BaseModel";
import { UserCol } from "../../share_server/Database";

class UserModel extends BaseModel<UserCol> {
    public table = 'user';
}

export default UserModel;