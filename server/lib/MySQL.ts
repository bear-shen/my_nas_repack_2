import * as Config from "../Config";
import {PoolOptions, ResultSetHeader} from "mysql2";
import {Pool as PromisePool} from "mysql2/promise";
import {ORMExecuteResult, ORMQueryResult} from "./DBDriver";

const mysql = require('mysql2');

let promisePool: PromisePool;

function init() {
    const config = Config.get();
    // console.info('init sql');
    let pool = mysql.createPool({
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

async function query(sql: string, binds: Array<any>): Promise<ORMQueryResult> {
    const [rows, fields] = await conn().execute(sql, binds);
    return rows as ORMQueryResult;
}

async function execute(sql: string, binds: Array<any>): Promise<ORMExecuteResult> {
    const [rows, fields] = await conn().execute(sql, binds);
    const res: ORMExecuteResult = {};
    if (rows && (rows as ResultSetHeader).insertId) {
        res.insertId = (rows as ResultSetHeader).insertId;
    }
    return res;
}

const SQL_QUOTE = '`';
const SQL_PARAM = '?';

export {
    conn,
    query,
    execute,
    SQL_QUOTE,
    SQL_PARAM,
}