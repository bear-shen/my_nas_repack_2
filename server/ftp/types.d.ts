import {Server, Socket} from "net";

type SessionDef = {
    id: number,
    user: string,
    pass: string,
    login: boolean,
    socket: Socket,
    time: number,
    tls: boolean,
    mode: 'I' | 'A' | 'AN' | 'L8' | string,
    //多线程上传和下载是用多个session实现的,这边不需要set
    // passivePort: Set<number>,
    passive: {
        port: number,
        server: Server,
        socket?: Socket,
    } | null,
    curPath: string,
    ext_rnfr?: string,
    // curNode: number,
};