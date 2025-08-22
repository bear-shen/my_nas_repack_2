import {IncomingMessage, ServerResponse} from "http";
// import ORM from "./lib/ORM";
// import { conn } from "./lib/SQL";
// import {type RowDataPacket} from "mysql2";
import {ParsedForm} from './types';
import File from "./processor/File";
import User from "./processor/User";
import Tag from "./processor/Tag";
import TagGroup from "./processor/TagGroup";
// import Local from "./processor/Local";
import UserGroup from "./processor/UserGroup";
import Setting from "./processor/Setting";
import Log from "./processor/Log";
import Favourite from "./processor/Favourite";
import FavouriteGroup from "./processor/FavouriteGroup";
import Rate from "./processor/Rate";
import OnlyOffice from "./processor/OnlyOffice";
import Share from "./processor/Share";

// type t = RowDataPacket;
const controllers: { [key: string]: any } = {
    file: new File,
    tag: new Tag,
    tag_group: new TagGroup,
    favourite: new Favourite,
    favourite_group: new FavouriteGroup,
    user: new User,
    user_group: new UserGroup,
    // local: Local,
    log: new Log,
    setting: new Setting,
    rate: new Rate,
    onlyoffice: new OnlyOffice,
    share: new Share,
    dev: false,
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
    const controller = controllers[c];
    // console.info(controller);
    if (!controller[a]) throw new Error('action not found');
    // console.info(_, c, a, FileController, controller, controller[a]);
    return await controller[a](data, req, res);
}
