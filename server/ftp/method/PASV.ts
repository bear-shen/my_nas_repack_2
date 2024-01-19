import {SessionDef} from "../types";
import {buildTemplate, createPasvServer} from "../Lib";
import Config from "../Config";
import {Server, Socket} from "net";
import net from "node:net";

/**
 * 5:32:47    响应:    227 Entering Passive Mode (172,22,112,1,82,8)
 * 15:32:47    追踪:    CFtpRawTransferOpData::ParseResponse() in state 2
 * 15:32:47    追踪:    CControlSocket::SendNextCommand()
 * 15:32:47    追踪:    CFtpRawTransferOpData::Send() in state 4
 * 15:32:47    追踪:    Destination IP of data connection does not match peer IP of control connection. Not binding source address of data connection.
 * 15:32:47    命令:    LIST
 * 15:32:49    错误:    无法建立数据连接: ECONNREFUSED - 连接被服务器拒绝
 *
 * 15:33:13    响应:    227 Entering Passive Mode (172,22,120,170,82,8)
 * 15:33:13    追踪:    CFtpRawTransferOpData::ParseResponse() in state 2
 * 15:33:13    追踪:    CControlSocket::SendNextCommand()
 * 15:33:13    追踪:    CFtpRawTransferOpData::Send() in state 4
 * 15:33:13    追踪:    Binding data connection source IP to control connection source IP 127.0.0.1
 * 15:33:13    命令:    LIST
 * 15:33:13    错误:    无法建立数据连接: ENETUNREACH - 无法连接网络
 * */
export async function execute(session: SessionDef, buffer: Buffer) {
    await createPasvServer(session);
    let pasvParam = [
        session.socket.localAddress.replace(/\./g, ','),
        Math.floor(session.passive.port / 256),
        session.passive.port % 256
    ];
    session.socket.write(buildTemplate(227, pasvParam.join(',')));
}
