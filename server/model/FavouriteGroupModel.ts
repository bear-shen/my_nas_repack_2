import BaseModel from "./BaseModel";
import {col_favourite_group} from "../../share/Database";

class FavouriteGroupModel extends BaseModel<col_favourite_group> {
    public table = 'favourite_group';
}

export default FavouriteGroupModel;
