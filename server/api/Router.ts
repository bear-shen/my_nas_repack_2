import {IncomingMessage, ServerResponse} from "http";
// import ORM from "./lib/ORM";
// import { conn } from "./lib/SQL";
import {type RowDataPacket} from "mysql2";
import {ParsedForm} from './types';
import File from "./processor/File";
import User from "./processor/User";
import Tag from "./processor/Tag";
import TagGroup from "./processor/TagGroup";
import Local from "./processor/Local";
import UserGroup from "./processor/UserGroup";
import Setting from "./processor/Setting";
import Log from "./processor/Log";
import Favourite from "./processor/Favourite";
import FavouriteGroup from "./processor/FavouriteGroup";
import Rate from "./processor/Rate";

type t = RowDataPacket;
const controllers: { [key: string]: any } = {
    file: File,
    tag: Tag,
    tag_group: TagGroup,
    favourite: Favourite,
    favourite_group: FavouriteGroup,
    user: User,
    user_group: UserGroup,
    local: Local,
    log: Log,
    setting: Setting,
    rate: Rate,
    dev: 0,
}

export default async function (
    url: URL,
    data: ParsedForm,
    req: IncomingMessage, res: ServerResponse
): Promise<any> {
    // console.info(url.pathname,);
    // console.info(url, data,);
    const [origin, prefix, c, a] = url.pathname.split('/');
    // console.info([_, prefix, c, a]);
    // console.info(controllers[c], controllers[c] ? controllers[c][a] : null);
    if (!controllers[c]) throw new Error('controller not found');
    const controller = (new controllers[c]());
    // console.info(controller);
    if (!controller[a]) throw new Error('action not found');
    // console.info(_, c, a, FileController, controller, controller[a]);
    return await controller[a](data, req, res);
}