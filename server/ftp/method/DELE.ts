import {SessionDef} from "../types";
import {buildTemplate, getRelPath} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    const curNode = await getRelPath(session, buffer.toString());
    if (!curNode) {
        return session.socket.write(buildTemplate(451));
    }
    await fp.rm(curNode.id);
    return session.socket.write(buildTemplate(250));
}