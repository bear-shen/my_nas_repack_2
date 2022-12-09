import BaseModel from "./BaseModel";
import NodeModel from "./NodeModel";
import { col_tag_group } from "../../share/Database";

class TagGroupModel extends BaseModel<col_tag_group> {
    public table = 'tag_group';
}

export default TagGroupModel;
