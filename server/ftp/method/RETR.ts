import {SessionDef} from "../types";
import {buildTemplate, getRelPath, readStream2Socket, syncWriteSocket, waitForPassiveSocket} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    await waitForPassiveSocket(session);
    await syncWriteSocket(session.socket, buildTemplate(150));
    const curNode = await getRelPath(session, buffer.toString());
    const rs = await fp.get(curNode);
    session.passive.socket.setNoDelay(false);
    await readStream2Socket(session.passive.socket, rs);
    rs.close();
    if (session.passive && session.passive.socket)
        session.passive.socket.end();
    session.socket.write(buildTemplate(226));
}