import BaseModel from "./BaseModel";
import {col_cache, col_setting} from "../../share/Database";

class CacheModel extends BaseModel<col_cache> {
    public table = 'cache';

}

export default CacheModel;