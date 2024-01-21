import {SessionDef} from "../types";
import {basename, buildTemplate, dirname, getRelPath, socket2writeStream, syncWriteSocket, waitForPassiveSocket} from "../Lib";
import fsNP from "fs";
import * as fp from "../../lib/FileProcessor";
import QueueModel from "../../model/QueueModel";
import {get as getConfig} from "../../ServerConfig";

export async function execute(session: SessionDef, buffer: Buffer) {
    await waitForPassiveSocket(session);
    await syncWriteSocket(session.socket, buildTemplate(150));
    const config = getConfig();
    //
    const targetPath = buffer.toString();
    const targetFileName = basename(targetPath);
    const targetDir = await getRelPath(session, dirname(targetPath));
    //
    const reqTmpFilePath = `${config.path.temp}/${(new Date()).valueOf()}_${Math.random()}`;
    const ws = fsNP.createWriteStream(reqTmpFilePath, {
        autoClose: true,
        // encoding: "binary",
        flags: 'w+',
        mode: 0o666,
    });
    await socket2writeStream(session.passive.socket, ws);
    ws.close();
    const putRes = await fp.put(reqTmpFilePath, targetDir, targetFileName);
    if (putRes) {
        (new QueueModel()).insert({
            type: 'file/build',
            payload: {id: putRes.id},
            status: 1,
        });
        (new QueueModel()).insert({
            type: 'file/buildIndex',
            payload: {id: putRes.id},
            status: 1,
        });
    }
    if (session.passive && session.passive.socket)
        session.passive.socket.end();
    session.socket.write(buildTemplate(226));
}

