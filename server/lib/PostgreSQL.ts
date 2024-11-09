import * as Config from "../Config";
import pg from "pg";
import {ORMExecuteResult, ORMQueryResult} from "./DBDriver";

const {Pool} = pg;

let promisePool: pg.Pool = null;


//postgres用的模板字符串感觉太奇怪了。。。
//换成pg
function init() {
    const config = Config.get();
    promisePool = new Pool({
        host: config.db.host,
        user: config.db.account,
        password: config.db.password,
        port: config.db.port,
        database: config.db.database,
    });
}

function conn(): pg.Pool {
    if (!promisePool) init();
    return promisePool;
}

async function query(sql: string, binds: Array<any>): Promise<ORMQueryResult> {
    // console.info(sql, binds);
    const res = await conn().query(toPreparedStatement(sql), binds);
    return res.rows;
}

async function execute(sql: string, binds: Array<any>): Promise<ORMExecuteResult> {
    // console.info(sql, binds);
    const res = await conn().query(toPreparedStatement(sql), binds);
    return {};
}

const SQL_QUOTE = '`';
const SQL_PARAM = '$0';


function toPreparedStatement(sql: string): string {
    //mysql方法的?转换为$n查询
    const arr = sql.split('$0');
    if (!arr.length) return sql;
    if (arr.length < 2) return sql;
    const tArr: string[] = [];
    arr.forEach((str, index) => {
        if (index !== 0) {
            tArr.push('$' + index);
        }
        tArr.push(str);
    })
    return tArr.join('');
}

export {
    conn,
    query,
    execute,
    SQL_QUOTE,
    SQL_PARAM,
}