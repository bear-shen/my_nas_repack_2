import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    return session.socket.write(buildTemplate(200));
}
