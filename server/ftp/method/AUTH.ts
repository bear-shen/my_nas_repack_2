import {SessionDef} from "../types";
import {buildTemplate, dataProcessor} from "../Lib";
import Config from "../Config";
import * as tls from "tls";

/**
 * AUTH TLS
 * AUTH SSL
 * */
export async function execute(session: SessionDef, buffer: Buffer) {
    const crypto = buffer.toString();
    if (crypto != 'TLS' || !Config.tls) return session.socket.write(buildTemplate(504));
    session.tls = true;
    session.socket.write(buildTemplate(234));
    session.socket = new tls.TLSSocket(session.socket, Config.tlsConfig);
    session.socket.on('connect', () => {
        console.info('socket:ssl:connect');
    });
    session.socket.on('data', (data: Buffer) => {
        console.info('socket:ssl:data');
        dataProcessor(session, data);
    });
    session.socket.on('error', (err) => {
        console.info('socket:ssl:error', err);
    });
    // session.socket.on('close', () => {
    //     console.info('socket:ssl:close');
    // });
    // session.socket.on('end', () => {
    //     console.info('socket:ssl:end');
    // });
    // session.socket.on('secureConnect', () => {
    //     console.info('socket:ssl:secureConnect');
    // });
    // session.socket.on('session', () => {
    //     console.info('socket:ssl:session');
    // });
}