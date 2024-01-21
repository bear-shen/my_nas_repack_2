import {SessionDef} from "../types";
import {buildTemplate, syncWriteSocket, waitForPassiveSocket} from "../Lib";
import {Stats} from "fs";
import * as fp from "../../lib/FileProcessor";

/**
 * 如果整个目录已成功传输，则接受代码为 226 的 LIST 或 NLST 请求；
 * 如果未建立 TCP 连接，则拒绝 LIST 或 NLST 请求，代码为 425；
 * 如果 TCP 连接已建立但随后被客户端或网络故障中断，则拒绝 LIST 或 NLST 请求，代码为 426；或者
 * 如果服务器在从磁盘读取目录时遇到问题，则拒绝 LIST 或 NLST 请求，代码为 451。
 * */
type fType = {
    type: 'dir' | 'file',
    size?: number,
    modify: string,
    perm: string,
    // name: string,
};

export async function execute(session: SessionDef, buffer: Buffer) {
    // console.info(session);
    // return;
    if (!session.passive)
        return session.socket.write(buildTemplate(425));
    await waitForPassiveSocket(session);
    await syncWriteSocket(session.socket, buildTemplate(150));
    //
    let withCDir = false;
    let extPath = buffer.toString();
    let curNode = session.curNode;
    if (extPath.length) {
        withCDir = true;
        let nodeArr = await fp.relPath2node(extPath, [curNode]);
        if (!nodeArr)
            return session.socket.write(buildTemplate(451));
        curNode = nodeArr[nodeArr.length - 1];
    }
    const subLs = await fp.ls(curNode.id);
    for (let i = 0; i < subLs.length; i++) {
        const isDir = subLs[i].type == 'directory';
        const f: fType = {
            type: isDir ? 'dir' : 'file',
            perm: isDir ? 'cdeflmp' : 'dfr',
            modify: subLs[i].time_create.replace(/[T\s\:\-]/, ''),
        }
        if (!isDir) {
            const size = subLs[i]?.file?.raw?.size;
            if (size)
                f.size = size;
        }
        await syncWriteSocket(
            session.passive.socket,
            fType2Str(subLs[i].title, f) + "\r\n"
        );
    }
    session.passive.socket.end(() => {
        session.socket.write(buildTemplate(226));
    });
}


function fType2Str(fName: string, fType: fType) {
    let str = '';
    for (const code in fType) {
        const val = fType[code as keyof fType];
        str += code + '=' + val + ';';
    }
    str += ' ' + fName;
    return str;
}

function stat2FType(stat: Stats, dirMode?: 'c' | 'p'): fType | null {
    let timeArr: (number | string)[] = [
        stat.mtime.getUTCFullYear(),
        stat.mtime.getUTCMonth() + 1,
        stat.mtime.getUTCDate(),
        stat.mtime.getUTCHours(),
        stat.mtime.getUTCMinutes(),
        stat.mtime.getUTCSeconds(),
    ];
    let timeStr = '';
    timeArr.forEach(s => {
        const ss = s.toString();
        timeStr += ss.length < 2 ?
            '0' + ss : ss
    })
    if (stat.isFile()) {
        /**
         * a    APPE    追加+创建
         * d    DELE    删除
         * f    RNFR    重命名
         * r    RETR    下载
         * w    STOR    续传
         * */
        let permStr = 'rf';
        return {
            type: 'file',
            size: stat.size,
            modify: timeStr,
            perm: 'dfr',
            // name: fileName,
        }
    } else if (stat.isDirectory()) {
        let permStr = '';
        /**
         * c    STOU STOR AAPE RNTE 可创建
         * d    DELE    删除
         * e    CWD CDUP    定位
         * f    RNFR    重命名
         * l    LIST NLST MLSD  列表
         * m    MKD 创建文件夹
         * p    RMD 删除文件夹
         * */
        switch (dirMode) {
            default:
                permStr = 'cdeflmp';
                break;
            case 'c':
                permStr = 'el';
                break;
            case 'p':
                permStr = 'e';
                break;
        }
        return {
            type: 'dir',
            modify: timeStr,
            perm: permStr,
            // name: fileName,
        }
    } else {
        return null;
    }

}