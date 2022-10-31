import BaseModel from "./BaseModel";
import { UserCol } from "../Database";

class UserModel extends BaseModel<UserCol> {
    public table = 'user';
}

export default UserModel;