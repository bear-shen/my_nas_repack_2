import {SessionDef} from "../types";
import {buildTemplate, syncWriteSocket, waitForPassiveSocket} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    // console.info(session);
    // return;
    if (!session.passive)
        return session.socket.write(buildTemplate(425));
    await waitForPassiveSocket(session);
    await syncWriteSocket(session.socket, buildTemplate(150));
    //
    let withCDir = false;
    let extPath = buffer.toString();
    let curNode = session.curNode;
    if (extPath.length) {
        withCDir = true;
        let nodeArr = await fp.relPath2node(extPath, [curNode]);
        if (!nodeArr)
            return session.socket.write(buildTemplate(451));
        curNode = nodeArr[nodeArr.length - 1];
    }
    const subLs = await fp.ls(curNode.id);
    //
    for (let i1 = 0; i1 < subLs.length; i1++) {
        let sArr = [];
        if (subLs[i1].type == 'directory') {
            sArr.push('drwxrwxrwx');
        } else {
            sArr.push('-rw-rw-rw-');
        }
        sArr.push('ftp ftp');
        let size = subLs[i1]?.file?.raw?.size;
        size = size ? size : 0;
        sArr.push(size.toString().padStart(15, ' '));
        sArr.push((new Date(subLs[i1].time_update)).toDateString().substring(4));
        sArr.push(subLs[i1].title);
        await syncWriteSocket(
            session.passive.socket,
            sArr.join(' ') + "\r\n"
        );
    }
    session.passive.socket.end(() => {
        session.socket.write(buildTemplate(226));
    });

}