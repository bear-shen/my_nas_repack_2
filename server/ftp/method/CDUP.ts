import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    if (!session.curNode.id) {
        return session.socket.write(buildTemplate(250));
    }
    const pNode = await fp.getNodeByIdOrNode(session.curNode.id_parent);
    session.curNode = pNode;
    return session.socket.write(buildTemplate(250));
}