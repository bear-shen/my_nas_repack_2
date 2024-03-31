import {SessionDef} from "../types";
import {basename, buildTemplate, dirname, getRelPath} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    let targetPath = buffer.toString();
    let targetDirPath = dirname(targetPath);
    let targetFileName = basename(targetPath);
    //
    const targetDirNode = await getRelPath(session, targetDirPath);
    if (!targetDirNode) return session.socket.write(buildTemplate(451));
    const ifExs = await getRelPath(session, targetPath);
    if (ifExs) return session.socket.write(buildTemplate(451));
    //
    await fp.mv(session.ext_rnfr, targetDirNode, targetFileName);
    return session.socket.write(buildTemplate(250));
}