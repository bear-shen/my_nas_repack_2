import {Socket} from "net";
import {SessionDef} from "./types";

const sessionStore = new Map<number, SessionDef>();

function genKey(): number {
    const key = (new Date().valueOf() % 10E8) + Math.floor(Math.random() * 10E8);
    if (sessionStore.get(key)) return genKey();
    return key;
}

export default {
    build: function (socket: Socket) {
        const idKey = genKey();
        const session: SessionDef = {
            id: idKey,
            user: '',
            pass: '',
            login: false,
            socket: socket,
            mode: 'I',
            time: (new Date()).valueOf(),
            tls: false,
            passive: null,
            // curPath: '/',
            curNode: {
                id: 0, title: 'root', status: 1, type: 'directory', list_node: [],
            },
            // curNode: 0,
        };
        sessionStore.set(idKey, session);
        return session;
    },
    get: function (sessionId: number) {
        return sessionStore.get(sessionId);
    },
    delete: function (sessionId: number) {
        return sessionStore.delete(sessionId);
    },
}