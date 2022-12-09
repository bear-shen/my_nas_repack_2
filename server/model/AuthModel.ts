import BaseModel from "./BaseModel";
import { col_auth } from "../../share/Database";


class AuthModel extends BaseModel<col_auth> {
    table = 'auth';
}

export default AuthModel;