import {SessionDef} from "../types";
import {buildTemplate, fileExists, getAbsolutePath, getRelPath} from "../Lib";
import fs from "node:fs/promises";

export async function execute(session: SessionDef, buffer: Buffer) {
    const filePath = getRelPath(session, buffer.toString());
    const absTargetPath = getAbsolutePath(filePath);
    if (await fileExists(absTargetPath)) {
        return session.socket.write(buildTemplate(250));
    }
    await fs.mkdir(absTargetPath, {
        mode: 0o666,
        recursive: true,
    });
    return session.socket.write(buildTemplate(250));
}