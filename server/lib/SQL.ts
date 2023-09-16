import {get_sync as getConfigSync} from "../ServerConfig";
import {Pool, PoolOptions} from "mysql2";
import {Pool as PromisePool} from "mysql2/promise";

const mysql = require('mysql2');
let pool: Pool;
let promisePool: PromisePool;

function init() {
    const config = getConfigSync();
    // console.info('init sql');
    pool = mysql.createPool({
        host: config.db.host,
        user: config.db.account,
        database: config.db.database,
        password: config.db.password,
        port: config.db.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    } as PoolOptions);
    promisePool = pool.promise();
}

function conn(): PromisePool {
    if (promisePool) return promisePool;
    init();
    return promisePool;
}


export {
    conn,
}