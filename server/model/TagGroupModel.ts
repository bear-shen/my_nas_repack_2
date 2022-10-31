import BaseModel from "./BaseModel";
import NodeModel from "./NodeModel";
import { TagGroupCol } from "../../share/Database";

class TagGroupModel extends BaseModel<TagGroupCol> {
    public table = 'tag_group';
}

export default TagGroupModel;
