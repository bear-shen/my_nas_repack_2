import BaseModel from "./BaseModel";
import { AuthCol } from "../../share/database";


class AuthModel extends BaseModel<AuthCol> {
    table = 'auth';
}

export default AuthModel;