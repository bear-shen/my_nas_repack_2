import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    let curNode = session.curNode;
    session.socket.write(buildTemplate(257, await fp.node2relPath(curNode)));
}