import {SessionDef} from "../types";
import {buildTemplate} from "../Lib";

export async function execute(session: SessionDef, buffer: Buffer) {
    const cmd = buffer.toString();
    const cmdArr = cmd.split(' ');
    if (!cmdArr || !cmdArr[0])
        session.socket.write(buildTemplate(504));
    switch (cmdArr[0]) {
        default:
            session.socket.write(buildTemplate(504));
            break;
        case 'UTF8':
            if (cmdArr[1] == 'ON')
                return session.socket.write(buildTemplate(202));
            return session.socket.write(buildTemplate(504));
            break;
    }

}