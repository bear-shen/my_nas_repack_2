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

type t = RowDataPacket;
const controllers = {
    file: File,
    user: User,
    tag: Tag,
    tag_group: TagGroup,
    user_group: UserGroup,
    local: Local,
    log: Log,
    setting: Setting,
    dev: 0,
}

export default async function (
    url: URL,
    data: ParsedForm,
    req: IncomingMessage, res: ServerResponse
): Promise<any> {
    // console.info(url.pathname,);
    // console.info(url, data,);
    const [_, prefix, c, a] = url.pathname.split('/');
    // console.info([_, prefix, c, a]);
    // @ts-ignore
    // console.info(controllers[c], controllers[c] ? controllers[c][a] : null);
    // @ts-ignore
    if (!controllers[c]) throw new Error('controller not found');
    // @ts-ignore
    const controller = (new controllers[c]());
    // console.info(controller);
    // @ts-ignore
    if (!controller[a]) throw new Error('action not found');
    // console.info(_, c, a, FileController, controller, controller[a]);
    // @ts-ignore
    return await controller[a](data, req, res);
}