import Config from "../ServerConfig";
import { Connection, ConnectionOptions, Pool, PoolOptions } from "mysql2";
import { Pool as PromisePool } from "mysql2/promise";

const mysql = require('mysql2');
let pool: Pool;
let promisePool: PromisePool;

function init() {
    // console.info('init sql');
    pool = mysql.createPool({
        host: Config.db.host,
        user: Config.db.account,
        database: Config.db.database,
        password: Config.db.password,
        port: Config.db.port,
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