import { IncomingMessage, ServerResponse } from "http";
import { Fields, PersistentFile } from "formidable";
// import ORM from "./lib/ORM";
// import { conn } from "./lib/SQL";
import { RowDataPacket } from "mysql2";
// import UserController from "./controller/UserController";
// import DevController from "./controller/DevController";
// import FileController from "./controller/FileController";
// import TagController from "./controller/TagController";
// import TagGroupController from "./controller/TagGroupController";
// import UserGroupController from "./controller/UserGroupController";
// import LocalController from "./controller/LocalController";
// import ConfigController from "./controller/ConfigController";

const controllers = {
    file: 0,
    user: 0,
    tag: 0,
    tag_group: 0,
    user_group: 0,
    local: 0,
    config: 0,
    dev: 0,
}

export default async function (
    url: URL,
    data: { fields: Fields, files: Array<typeof PersistentFile>, uid: number },
    req: IncomingMessage, res: ServerResponse
): Promise<any> {
    console.info(url.pathname,);
    // console.info(url, data,);
    const [_, prefix, c, a] = url.pathname.split('/');
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