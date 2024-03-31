import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";
import * as fp from "../../lib/FileProcessor";

export async function execute(session: SessionDef, buffer: Buffer) {
    let curNode = session.curNode;
    // console.info(curNode);
    // console.info(await fp.node2relPath(curNode));
    session.socket.write(buildTemplate(257, await fp.node2relPath(curNode)));
}