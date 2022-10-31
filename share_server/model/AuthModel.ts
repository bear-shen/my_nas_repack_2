import BaseModel from "./BaseModel";
import { AuthCol } from "../../share_server/Database";


class AuthModel extends BaseModel<AuthCol> {
    table = 'auth';
}

export default AuthModel;