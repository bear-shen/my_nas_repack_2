import {SessionDef} from "../types";
import {buildTemplate, fileExists, getAbsolutePath, getRelPath} from "../Lib";
import fs from "node:fs/promises";

export async function execute(session: SessionDef, buffer: Buffer) {
    const filePath = getRelPath(session, buffer.toString());
    const absTargetPath = getAbsolutePath(filePath);
    if (!await fileExists(absTargetPath)) {
        return session.socket.write(buildTemplate(451));
    }
    await fs.rm(absTargetPath);
    return session.socket.write(buildTemplate(250));
}