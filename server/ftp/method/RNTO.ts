import {SessionDef} from "../types";
import {buildTemplate, dirname, fileExists, getAbsolutePath, getRelPath} from "../Lib";
import fs from "node:fs/promises";

export async function execute(session: SessionDef, buffer: Buffer) {
    const filePath = getRelPath(session, buffer.toString());
    const absTargetPath = getAbsolutePath(filePath);
    const absSourcePath = getAbsolutePath(session.ext_rnfr);
    if (await fileExists(absTargetPath)) {
        return session.socket.write(buildTemplate(451));
    }
    if (!await fileExists(dirname(absTargetPath))) {
        await fs.mkdir(
            dirname(absTargetPath),
            {
                recursive: true,
                mode: 0o666,
            }
        );
    }
    let renameSuccess = false;
    try {
        await fs.rename(
            absSourcePath,
            absTargetPath
        )
        renameSuccess = true;
    } catch (e) {
        renameSuccess = false;
    }
    if (!renameSuccess) {
        try {
            await fs.cp(
                absSourcePath,
                absTargetPath,
                {recursive: true,}
            )
            await fs.rm(absSourcePath);
        } catch (e) {
            return session.socket.write(buildTemplate(451));
        }
    }
    return session.socket.write(buildTemplate(250));
}