import {SessionDef} from "../types";
import {buildTemplate, getRelPath} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    const queryPath = buffer.toString();
    const relNode = await getRelPath(session, queryPath);
    // console.info(queryPath, relNode);
    if (!relNode) {
        return session.socket.write(buildTemplate(452));
    }
    session.curNode = relNode;
    return session.socket.write(buildTemplate(250));
}