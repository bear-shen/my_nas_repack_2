import {SessionDef} from "../types";
import {buildTemplate, getAbsolutePath, getRelPath, socket2writeStream, syncWriteSocket, waitForPassiveSocket} from "../Lib";
import fsNp from "node:fs";

export async function execute(session: SessionDef, buffer: Buffer) {
    await waitForPassiveSocket(session);
    await syncWriteSocket(session.socket, buildTemplate(150));
    //
    const filePath = getRelPath(session, buffer.toString());
    //
    const ws = fsNp.createWriteStream(
        getAbsolutePath(filePath), {
            autoClose: true,
            // encoding: 'binary',
            flags: 'w+',
            mode: 0o666,
        });
    await socket2writeStream(session.passive.socket, ws);
    ws.close();
    if (session.passive && session.passive.socket)
        session.passive.socket.end();
    session.socket.write(buildTemplate(226));
}