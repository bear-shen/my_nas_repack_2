import * as tls from "tls";
import {ConnectionOptions} from "tls";
import fs from "node:fs";

const Config = {
    root: 'E:/t',
    account: [
        {name: 'loli', password: 'con'},
    ],
    tls: true,
    tlsConfig: {
        key: fs.readFileSync(`${__dirname}/../../../../cert/cirno_ftp.key`),
        cert: fs.readFileSync(`${__dirname}/../../../../cert/cirno_ftp.crt`),
        ca: [fs.readFileSync(`${__dirname}/../../../../cert/rootCA.crt`),],
        isServer: true,
        // requestCert: true,
        // requestOCSP: true,
        // rejectUnauthorized: false,
        checkServerIdentity: () => {
            return null;
        },
    } as tls.TlsOptions & ConnectionOptions,
    port: 2121,
    host: '0.0.0.0',
    pasv_min: 12000,
    pasv_max: 15000,
    messageTemplate: {
        //https://en.wikipedia.org/wiki/List_of_FTP_server_return_codes
        _220: '220-A FTP Server\r\n220 Welcome\r\n',
        // _220: '220-FileZilla Server 1.4.0\r\n220 Please visit https://filezilla-project.org/\r\n',
        _331: '331 Please, specify the password.\r\n',
        _430: '430 invalid username or password.\r\n',
        _230: '230 Login successful.\r\n',
        _257: '257 "{0}" is current directory.\r\n',
        _200: '200 Type set to {0}\r\n',
        _227: '227 Entering Passive Mode ({0})\r\n',
        _150: '150 Starting data transfer.\r\n',
        _226: '226 Operation successful.\r\n',
        _250: '250 Command successful.\r\n',
        _550: '550 Permission denied.\r\n',
        _504: '504 Command not implemented for that parameter.\r\n',
        _425: '425 Can\'t open data connection.\r\n',
        _215: '215 UNIX Type: I\r\n',
        _211: '211-Features:\r\n{0}',
        _202: '202 UTF8 mode is always enabled. No need to send this command.\r\n',
        _350: '350 File Exists, ready for destination.\r\n',
        _451: '451 Requested action aborted. Local error in processing.\r\n',
        _452: '452 Requested action not taken. Insufficient storage space in system. File unavailable.\r\n',
        _503: '503 Bad sequence of commands.\r\n',
        _234: '234 Using authentication type TLS.\r\n',
    } as { [key: string]: string },
};

export default Config;
