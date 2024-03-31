import {SessionDef} from "./types";

const Route: { [key: string]: (session: SessionDef, buffer: Buffer) => any } = {
    //写入用户名
    USER: require('./method/USER').execute,
    //二进制标志，实际上只做了I
    TYPE: require('./method/TYPE').execute,
    //写入用户密码并登录
    PASS: require('./method/PASS').execute,
    //进入文件夹
    CWD: require('./method/CWD').execute,
    //回到上级
    CDUP: require('./method/CDUP').execute,
    //输出当前的文件夹
    PWD: require('./method/PWD').execute,
    //
    XPWD: require('./method/PWD').execute,
    //进入被动模式
    PASV: require('./method/PASV').execute,
    //获取文件列表 需要被动端口
    MLSD: require('./method/MLSD').execute,
    // 传统文件列表 需要被动端口
    LIST: require('./method/LIST').execute,
    //读取文件内容 需要被动端口
    RETR: require('./method/RETR').execute,
    //上传文件 需要被动端口
    STOR: require('./method/STOR').execute,
    //创建文件夹
    MKD: require('./method/MKD').execute,
    //删除文件夹
    RMD: require('./method/RMD').execute,
    //删除文件 实际等于RMD
    DELE: require('./method/DELE').execute,
    //重命名指定文件
    RNFR: require('./method/RNFR').execute,
    //重命名到目标名称
    RNTO: require('./method/RNTO').execute,
    //启用SSL支持
    AUTH: require('./method/AUTH').execute,
    //获取缓存大小 只有0
    PBSZ: require('./method/PBSZ').execute,
    //获取保护等级
    PROT: require('./method/PROT').execute,
    //返回当前系统信息和二进制标志
    SYST: require('./method/SYST').execute,
    //获取功能列表
    FEAT: require('./method/FEAT').execute,
    //设置功能 只支持UTF8 ON
    OPTS: require('./method/OPTS').execute,
    //无操作
    NOOP: require('./method/NOOP').execute,
    //
    SITE: require('./method/SITE').execute,
    // APPE: require('./method/APPE').execute,
    // STOU: require('./method/STOU').execute,
    // ALLO: require('./method/ALLO').execute,
    // STAT: require('./method/STAT').execute,
    // HELP: require('./method/HELP').execute,
    // QUIT: require('./method/QUIT').execute,
    // REST: require('./method/REST').execute,
    // PORT: require('./method/PORT').execute,
    // NLST: require('./method/NLST').execute,
    // STRU: require('./method/STRU').execute,
    // MODE: require('./method/MODE').execute,
};

export default Route;
