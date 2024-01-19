import {SessionDef} from "../types";
import {buildTemplate, dirname, rtrimSlash} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    session.curPath = dirname(rtrimSlash(session.curPath));
    if (!session.curPath.length) {
        session.curPath = '/';
    }
    return session.socket.write(buildTemplate(250));
}