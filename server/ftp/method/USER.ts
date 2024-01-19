import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    session.user = buffer.toString();
    session.socket.write(buildTemplate(331));
}