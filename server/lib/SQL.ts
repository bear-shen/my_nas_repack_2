import {get as getConfig} from "../ServerConfig";
import {Pool, PoolOptions, QueryResult, ResultSetHeader, RowDataPacket} from "mysql2";
import {Pool as PromisePool} from "mysql2/promise";
import {ExecutableBase} from "mysql2/typings/mysql/lib/protocol/sequences/promise/ExecutableBase";

const mysql = require('mysql2');
let pool: Pool;
let promisePool: PromisePool;
type ExecuteResult = {
    insertId?: number,
};

function init() {
    const config = getConfig();
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

async function query(sql: string, binds: Array<any>): Promise<RowDataPacket[][]> {
    const [rows, fields] = await conn().execute(sql, binds);
    return rows as RowDataPacket[][];
}

async function execute(sql: string, binds: Array<any>): Promise<ExecuteResult> {
    const [rows, fields] = await conn().execute(sql, binds);
    const res: ExecuteResult = {};
    if (rows && (rows as ResultSetHeader).insertId) {
        res.insertId = (rows as ResultSetHeader).insertId;
    }
    return res;
}

export {
    conn,
    query,
    execute,
    ExecuteResult,
}