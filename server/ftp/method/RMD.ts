import {SessionDef} from "../types";
import {buildTemplate, fileExists, getAbsolutePath, getRelPath} from "../Lib";
import fs from "node:fs/promises";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    const curNode = await getRelPath(session, buffer.toString());
    await  fp.rm(curNode.id);
    return session.socket.write(buildTemplate(250));
}