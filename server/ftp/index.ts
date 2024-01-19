import {DropArgument, Server, Socket} from "net";
import {SessionDef} from "./types";
import Route from "./Route";
import SessionStore from "./SessionStore";
import Config from "./Config";
import {buildTemplate, dataProcessor} from "./Lib";
import * as tls from "tls";

const net = require("node:net");


const server: Server = net.createServer({}, async (socket: Socket) => {
    console.info('server:createServer');
});
server.listen(Config.port, Config.host, async () => {
    console.info('server:listeningListener');
});
server.on('error', async (err: Error) => {
    console.info('server:error', err);
});
/**
 * socket:
 * ready -> connect -> data
 * drain
 * error
 * lookup
 * timeout
 * end -> close
 * */
server.on('connection', async (socket: Socket) => {
    console.info('server:connection');
    const session = SessionStore.build(socket);
    //@see https://nodejs.org/docs/latest/api/buffer.html
    // socket.setEncoding('binary');
    socket.write(buildTemplate(220));
    socket.on("close", async (hadError: boolean) => {
        console.info('socket:close');
        SessionStore.delete(session.id);
    });
    socket.on("connect", async () => {
        console.info('socket:connect');
    });
    socket.on("data", async (buffer: Buffer) => {
        console.info('socket:data');
        dataProcessor(session,buffer);
    });
});
server.on('drop', async (data?: DropArgument) => {
    console.info('server:drop');
});
server.on('close', async () => {
    console.info('server:close');
});
server.on('listening', async () => {
    console.info('server:listening');
});

function requestMethod(session: SessionDef, buffer: Buffer) {
}


console.info('test');

