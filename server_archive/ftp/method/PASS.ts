import {SessionDef} from "../types";
import {buildTemplate, login} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    session.pass = buffer.toString();
    const ifSuccess = await login(session);
    if(ifSuccess){
        session.socket.write(buildTemplate(230));
    }else{
        session.socket.write(buildTemplate(430));
    }
}