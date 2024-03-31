import {SessionDef} from "../types";
import {buildTemplate, dataProcessor} from "../Lib";
import * as tls from "tls";
import {get as getConfig} from "../../ServerConfig";

/**
 * AUTH TLS
 * AUTH SSL
 * */
export async function execute(session: SessionDef, buffer: Buffer) {
    const crypto = buffer.toString();
    const config = getConfig();
    if (crypto != 'TLS' || !config.ftp.tls) return session.socket.write(buildTemplate(504));
    const certConfig = getConfig('ftp.cert');
    session.tls = true;
    session.socket.write(buildTemplate(234));
    session.socket = new tls.TLSSocket(session.socket, certConfig);
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