import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    let prePath = session.curPath;
    if (!prePath.length)
        prePath = '/';
    session.socket.write(buildTemplate(257, prePath));
}