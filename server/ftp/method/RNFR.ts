import {SessionDef} from "../types";
import {buildTemplate, getRelPath} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    const curNode = await getRelPath(session, buffer.toString());
    if (!curNode)
        return session.socket.write(buildTemplate(451));
    session.ext_rnfr = curNode.id;
    return session.socket.write(buildTemplate(350));
}