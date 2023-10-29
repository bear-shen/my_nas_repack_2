import BaseModel from "./BaseModel";
import {col_favourite} from "../../share/Database";

class FavouriteModel extends BaseModel<col_favourite> {
    public table = 'favourite';
}

export default FavouriteModel;
