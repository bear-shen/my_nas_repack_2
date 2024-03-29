import {SessionDef} from "./types";
import MessageDef from "./MessageDef";
import {Server, Socket} from "net";
import {ReadStream, WriteStream} from "fs";
import net from "node:net";
import Route from "./Route";
import * as tls from "tls";
import * as fp from "../lib/FileProcessor";
import {relPath2node} from "../lib/FileProcessor";
import {col_node} from "../../share/Database";
import UserModel from "../model/UserModel";
import {get as getConfig} from "../ServerConfig";

const md5 = require('md5');

function dataProcessor(session: SessionDef, buffer: Buffer) {
    if (typeof buffer == 'string') {
        buffer = Buffer.from(buffer);
    }
    // console.info(data.toString());
    let methodName = '';
    // let st = 0;
    // console.info(buffer.toString());
    // console.info(typeof buffer);
    // console.info(buffer.length);
    for (let i = 0; i < 5; i++) {
        let char = buffer.readInt8(i);
        // st = i;
        if (char == 0x20 || char == 0x0d || char == 0x0a) break;
        methodName += String.fromCharCode(char);
    }
    methodName=methodName.toUpperCase();
    console.info(methodName);
    if (!Route[methodName]) {
        session.socket.write(buildTemplate(504));
        return;
    }
    // console.info(methodName, methodName.length);
    const sBuffer = buffer.subarray(methodName.length + 1, buffer.length - 2);
    Route[methodName](session, sBuffer);
}

async function login(session: SessionDef) {
    const name = session.user;
    const pass = session.pass;
    let matchUn = false;
    let matchPw = false;
    // console.info(name, pass);

    const ifExs = await (new UserModel).where('name', name).or().where('mail', name).first();
    // console.info(ifExs, md5(md5(pass)));
    if (!ifExs) return false;
    if (ifExs.password !== md5(md5(pass))) return false;
    session.login = true;
    return true;
}


function buildTemplate(code: number, ...param: (string | number)[]) {
    const key = '_' + code;
    if (!MessageDef[key]) {
        console.error('invalid msg code:', code, 'param:', param.join(' , '));
        return '';
    }
    let s = MessageDef[key];
    if (!param.length) return s;
    param.forEach((p, i) => s = s.replace('{' + i + '}', p.toString()));
    return s;
}

function ltrimSlash(str: string) {
    if (str.indexOf('/') !== 0) return str;
    return str.substring(1, str.length);
}

function rtrimSlash(str: string) {
    if (str.lastIndexOf('/') !== str.length - 1) return str;
    return str.substring(0, str.length - 1);
}

function dirname(str: string) {
    str = rtrimSlash(str);
    let offset = str.lastIndexOf('/');
    if (offset === -1) return '';
    return str.substring(0, offset);
}

function basename(str: string) {
    str = rtrimSlash(str);
    let offset = str.lastIndexOf('/');
    if (offset === -1) return str;
    return str.substring(offset + 1, str.length);
}

function syncWriteSocket(socket: Socket, str: string) {
    if (!socket) return;
    return new Promise(resolve => {
        socket.write(
            str, err => resolve(null)
        );
    })
}

const pasvPortSet = new Set<number>;

const sessionStore = new Map<Buffer, Buffer>();

function createPasvServer(session: SessionDef) {
    return new Promise<any>(async (resolve, reject) => {
        if (session.passive && session.passive.server) session.passive.server.close();
        const config = getConfig();
        let validPort = 0;
        for (let i = config.ftp.pasv[0]; i <= config.ftp.pasv[1]; i++) {
            if (pasvPortSet.has(i)) continue;
            if (!await isPortAvailable(i)) continue;
            validPort = i;
            break;
        }
        pasvPortSet.add(validPort);
        console.info(session.tls);
        const server: Server = session.tls ? tls.createServer(config.ftp.tlsConfig, async (socket: Socket) => {
            console.info('PASV:server.createServer', validPort);
        }) : net.createServer({}, async (socket: Socket) => {
            console.info('PASV:server.createServer', validPort);
        });
        // const server: Server = net.createServer({}, async (socket: Socket) => {
        //     console.info('PASV:server.createServer', validPort);
        // });
        session.passive = {
            port: validPort,
            server: server,
        };
        // server.on('connection', async (socket: Socket) => {
        server.on(session.tls ? 'secureConnection' : 'connection', async (socket: Socket) => {
            console.info('PASV:server.connection');
            // socket = new tls.TLSSocket(session.socket, Config.tlsConfig);

            // console.info(session.tls);
            // if (session.tls) {
            //     socket = new tls.TLSSocket(socket, Config.tlsConfig);
            // }
            socket.setNoDelay(true);
            //@see https://nodejs.org/docs/latest/api/buffer.html
            // socket.setEncoding('binary');
            socket.on("close", async (hadError: boolean) => {
                console.info('PASV:socket:close', hadError);
                // console.info(new Error().stack);
                session.passive.server.close((err) => {
                    pasvPortSet.delete(session.passive.port);
                    session.passive = null;
                });
            });
            socket.on("connect", async () => {
                console.info('PASV:socket:connect');
            });
            // socket.on("data", async (buffer: Buffer) => {
            //     console.info('PASV:socket:data');
            // });
            session.passive.socket = socket;
        });
        //注意如果用resumeSession需要把回调写全，不然没server hello
        // server.on('keylog', (...args) => {
        //     console.info('PASV:server:keylog', args ? args[0] : null);
        // })
        server.on('newSession', (id: Buffer, data: Buffer, cb: () => any) => {
            console.info('PASV:server:newSession');
            sessionStore.set(id, data);
            cb();
            // tls.connect(Object.assign({
            //     session: args[0]
            // }, Config.tlsConfig));
        })
        // server.on('OCSPRequest', (...args) => {
        //     console.info('PASV:server:OCSPRequest', args ? args[0] : null);
        // })
        // server.on('OCSPResponse', (...args) => {
        //     console.info('PASV:server:OCSPResponse', args ? args[0] : null);
        // })
        server.on('resumeSession', (id: Buffer, cb: (err: Error, data: Buffer) => any) => {
            console.info('PASV:server:resumeSession');
            // console.info(args[0].toString());
            cb(null, sessionStore.get(id) || null);
        })
        // server.on('secureConnection', (...args) => {
        // console.info('PASV:server:secureConnection', args ? args[0] : null);
        // })
        server.on('tlsClientError', (...args) => {
            console.info('PASV:server:tlsClientError', args ? args[0] : null);
        })
        server.listen(validPort, config.ftp.host, async () => {
            console.info('PASV:server.listeningListener', validPort);
            resolve(true);
        });
    });
}

function waitForPassiveSocket(session: SessionDef) {
    return new Promise((resolve, reject) => {
        // console.info(session.passive?.socket);
        if (session.passive && session.passive.socket) return resolve(true);
        let timer = setInterval(() => {
            // console.info(session.passive?.socket);
            if (session.passive && session.passive.socket) {
                clearInterval(timer);
                resolve(true);
            }
        }, 5);
    })
}

/**
 * @see https://github.com/colxi/is-port-available/blob/master/index.js
 * */
function isPortAvailable(port: number): Promise<boolean> {
    return new Promise(resolve => {
        // if port is not a number or is not an integet or is out of range block
        if (isNaN(port) || port < 0 || port > 65536) {
            resolve(false);
        }
        const tester: Server = net.createServer()
            // catch errors, and resolve false
            .once('error', (err: Error) => {
                resolve(false);
            })
            // return true if succed
            .once('listening', () =>
                tester.once('close', () =>
                    resolve(true)
                ).close()
            )
            .listen(port);
    });
}

function readStream2Socket(socket: Socket, readStream: ReadStream) {
    return new Promise(resolve => {
        readStream.on('data', chunk => {
                // console.info('rs:data')
                // console.info(chunk.toString());
                socket.write(chunk);
            }
        );
        readStream.on('close', () => {
            // console.info('rs:close')
            resolve(true);
        })
    });
}

function socket2writeStream(socket: Socket, writeStream: WriteStream) {
    return new Promise(resolve => {
        socket.on('data', chunk => {
                // console.info(chunk.toString());
                writeStream.write(chunk);
            }
        );
        socket.on('close', () => {
            resolve(true);
        })
    });
}

async function fileExists(path: string) {
    // await fs.access(path);
    const nodeLs = await fp.relPath2node(path);
    if (!nodeLs) return false;
}

async function getRelPath(session: SessionDef, fileName: string): Promise<col_node | null> {
    const isAbsolutePath = fileName.indexOf('/') === 0;
    let nodeLs: col_node[] | false = [];
    // console.info(session.curNode);
    if (!isAbsolutePath) {
        nodeLs = await relPath2node(fileName, [session.curNode]);
    } else {
        nodeLs = await relPath2node(fileName);
    }
    // console.info(nodeLs);
    if (!nodeLs || !nodeLs.length) return null;
    return nodeLs[nodeLs.length - 1];
}

// function getAbsolutePath(relPath: string) {
//     return rtrimSlash(MessageDef.root) + '/' + ltrimSlash(relPath);
// }

export {
    dataProcessor,
    login,
    buildTemplate,
    ltrimSlash,
    rtrimSlash,
    dirname,
    basename,
    syncWriteSocket,
    createPasvServer,
    readStream2Socket,
    waitForPassiveSocket,
    socket2writeStream,
    fileExists,
    getRelPath,
    // getAbsolutePath,
};
