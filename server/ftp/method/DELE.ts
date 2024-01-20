import {SessionDef} from "../types";
import {buildTemplate, getRelPath} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    const fNode = await getRelPath(session, buffer.toString());
    //
    if (!fNode) {
        return session.socket.write(buildTemplate(451));
    }
    await fp.rm(fNode.id);
    return session.socket.write(buildTemplate(250));
}