import {SessionDef} from "../types";
import {buildTemplate, fileExists, getAbsolutePath, ltrimSlash, rtrimSlash} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    const queryPath = buffer.toString();
    const isAbsolutePath = queryPath.indexOf('/') === 0;
    let prefix = '';
    if (!isAbsolutePath) {
        prefix = rtrimSlash(session.curPath);
    }
    let targetPath = prefix + '/' + ltrimSlash(queryPath);
    if (!await fileExists(getAbsolutePath(targetPath))) {
        return session.socket.write(buildTemplate(452));
    }
    session.curPath = rtrimSlash(targetPath);
    return session.socket.write(buildTemplate(250));
}