import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    //Protection Buffer Size
    session.socket.write(buildTemplate(200, 'PBSZ 0'));
    return;
}