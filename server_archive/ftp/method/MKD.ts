import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    await fp.mkdir(session.curNode.id, buffer.toString());
    return session.socket.write(buildTemplate(250));
}