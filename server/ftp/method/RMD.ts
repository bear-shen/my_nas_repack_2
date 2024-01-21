import {SessionDef} from "../types";
import {buildTemplate, getRelPath} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    const curNode = await getRelPath(session, buffer.toString());
    await fp.rm(curNode.id);
    return session.socket.write(buildTemplate(250));
}