import {SessionDef} from "../types";
import {buildTemplate, getRelPath} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    const ifExs = await getRelPath(session, buffer.toString());
    if (!ifExs)
        return session.socket.write(buildTemplate(451));
    session.ext_rnfr = ifExs.id;
    return session.socket.write(buildTemplate(350));
}