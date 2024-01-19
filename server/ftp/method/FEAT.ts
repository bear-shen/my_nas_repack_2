import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";
import Route from "../Route";

export async function execute(session: SessionDef, buffer: Buffer) {
    const features = Object.keys(Route);
    features.push('UTF8');
    features.push('MLST type*;size*;modify*;');
    return session.socket.write(
        buildTemplate(211,
            features.join('\r\n')
            + '\r\n211 End\r\n'
        ));
}
