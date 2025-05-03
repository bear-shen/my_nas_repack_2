const fs = require('fs');
import pg from "pg";

const {Pool} = pg;

const envDef = {
    onlyoffice_enabled: process.env?.onlyoffice_enabled ?? 'false',
    onlyoffice_origin: process.env?.onlyoffice_origin ?? 'http://127.0.0.1',
    onlyoffice_jwt_secret: process.env?.onlyoffice_jwt_secret ?? 'YOUR_JWT_SECRET',
    //
    pg_host: process.env?.pg_host ?? '127.0.0.1',
    pg_port: parseInt(process.env?.pg_port) ?? 5432,//NaN??0=NaN
    pg_account: process.env?.pg_account ?? 'postgres',
    pg_password: process.env?.pg_password ?? 'postgres',
    pg_database: process.env?.pg_database ?? 'toshokandev',
};
envDef.pg_port = envDef.pg_port ? envDef.pg_port : 5432;

initConfig().then(() => {
    initDatabase()
        .then(() => {
            console.info('init complete');
            process.exit(0);
        })
});

async function initConfig() {
    //-----------------------------------
    //onlyoffice随着配置导入，因此不能写在init
    const ifUseOnlyoffice = envDef.onlyoffice_enabled;
    const onlyofficeConf: { [key: string]: string } = {
        onlyofficeHost: '127.0.0.1',
        onlyofficePort: '8000',
        onlyofficeScheme: 'http',
    };
    if (ifUseOnlyoffice === 'true') {
        const onlyofficeOrigin = (envDef.onlyoffice_origin ?? 'http://127.0.0.1').replace(/^[\s=/'"]+|[\s=/"']+$/g, '');
        if (onlyofficeOrigin) {
            try {
                const originMeta = new URL(onlyofficeOrigin);
                if (originMeta) {
                    if (originMeta.hostname) onlyofficeConf.onlyofficeHost = originMeta.hostname;
                    if (originMeta.port) onlyofficeConf.onlyofficePort = originMeta.port;
                    if (originMeta.protocol) onlyofficeConf.onlyofficeScheme = originMeta.protocol.replace(':', '');
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    //-----------------------------------
    //直接读取源文件以后覆盖当前nginx配置
    let ngConf = fs.readFileSync(__dirname + '/../../system/nginx_default.conf').toString();
    for (const key in onlyofficeConf) {
        let val = (onlyofficeConf as unknown as { [key: string]: string })[key];
        ngConf = ngConf.replace(`{{${key}}}`, val);
    }
    fs.writeFileSync('/etc/nginx/sites-enabled/default.conf', ngConf, {
        flag: 'w+',
    });

    //-----------------------------------
    //写入数据库配置
    let confStr = fs.readFileSync(__dirname + '/../config.base.toml').toString();
    for (const key in envDef) {
        let val = (envDef as unknown as { [key: string]: string })[key];
        confStr = confStr.replace(`{{${key}}}`, val);
    }
    fs.writeFileSync(__dirname + '/../config.toml', confStr, {
        flag: 'w+',
    });
}

async function initDatabase() {
    const baseConn: pg.Pool = new Pool(
        {
            host: envDef.pg_host,
            port: envDef.pg_port,
            user: envDef.pg_account,
            password: envDef.pg_password,
            database: 'postgres',
        });
    const ifDBExs = await baseConn.query(
        `SELECT datname
         FROM pg_database
         where datname = '${envDef.pg_database}';`
    );
    if (!ifDBExs.rows || !ifDBExs.rows.length) {
        await baseConn.query(`CREATE DATABASE "${envDef.pg_database}"
WITH ENCODING = 'UTF8' ;`);
        const ddlConn: pg.Pool = new Pool(
            {
                host: envDef.pg_host,
                port: envDef.pg_port,
                user: envDef.pg_account,
                password: envDef.pg_password,
                database: envDef.pg_database,
            });
        const buildSql = fs.readFileSync(__dirname + '/../../init.postgres.sql').toString();
        await ddlConn.query(buildSql);
        const confSql = fs.readFileSync(__dirname + '/../../init.base.sql').toString();
        await ddlConn.query(confSql);
    }
}



























