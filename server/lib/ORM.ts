/**
 * @todo 绑定数据这块还是要改改
 * ------------------ select ------------------
 * SELECT
 *     [ALL | DISTINCT | DISTINCTROW ]
 *     [HIGH_PRIORITY]
 *     [STRAIGHT_JOIN]
 *     [SQL_SMALL_RESULT] [SQL_BIG_RESULT] [SQL_BUFFER_RESULT]
 *     [SQL_CACHE | SQL_NO_CACHE] [SQL_CALC_FOUND_ROWS]
 *     select_expr [, select_expr] ...
 *     [into_option]
 *     [FROM table_references
 *       [PARTITION partition_list]]
 *     [WHERE where_condition]
 *     [GROUP BY {col_name | expr | position}
 *       [ASC | DESC], ... [WITH ROLLUP]]
 *     [HAVING where_condition]
 *     [ORDER BY {col_name | expr | position}
 *       [ASC | DESC], ...]
 *     [LIMIT {[offset,] row_count | row_count OFFSET offset}]
 *     [PROCEDURE procedure_name(argument_list)]
 *     [into_option]
 *     [FOR UPDATE | LOCK IN SHARE MODE]
 * ------------------ update ------------------
 * UPDATE [LOW_PRIORITY] [IGNORE] table_reference
 *     SET assignment_list
 *     [WHERE where_condition]
 *     [ORDER BY ...]
 *     [LIMIT row_count]
 * ------------------ delete ------------------
 * DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM tbl_name
 *     [PARTITION (partition_name [, partition_name] ...)]
 *     [WHERE where_condition]
 *     [ORDER BY ...]
 *     [LIMIT row_count]
 * ------------------ insert ------------------
 * INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE]
 *     [INTO] tbl_name
 *     [PARTITION (partition_name [, partition_name] ...)]
 *     [(col_name [, col_name] ...)]
 *     {VALUES | VALUE} (value_list) [, (value_list)] ...
 *     [ON DUPLICATE KEY UPDATE assignment_list]
 * ------------------ insert select ------------------
 * INSERT [LOW_PRIORITY | HIGH_PRIORITY] [IGNORE]
 *     [INTO] tbl_name
 *     [PARTITION (partition_name [, partition_name] ...)]
 *     [(col_name [, col_name] ...)]
 *     SELECT ...
 *     [ON DUPLICATE KEY UPDATE assignment_list]
 * */

import {get as getConfig} from "../ServerConfig";
import {ORMExecuteResult, ORMQueryResult} from "./DBDriver";

const dbConfig = getConfig('db');
let driverName = '';
switch (dbConfig.driver) {
    case 'mysql':
        driverName = "./MySQL";
        break
    case 'postgresql':
        driverName = "./PostgreSQL";
        break
}
const {
    query,
    execute,
    SQL_PARAM
} = require(driverName);

class queryDefinition {
    type: string; // expression|operator|sub|raw
    data: Array<string | queryDefinition>
}


const dml = {
    select: '',
    update: '',
    delete: '',
    insert: '',
    insertSelect: '',
};

//@todo orm的字段部分没有处理好，这里后期要想办法
class ORM {
    public table = '';
    static dumpSql = false;
    public _dataset = {
        query: [] as Array<queryDefinition>,
        queryPos: [] as Array<queryDefinition>,//linked to query
        sort: [] as Array<Array<string>>,
        limit: 0,
        offset: 0,
        ignore: false,
        binds: {
            full: [],
            where: [],
            // group: [],
            limit: [],
            insert: [],
            update: [],
        } as { [key: string]: Array<any> },
        group: [] as Array<string>,
        // @todo
        join: [] as Array<string>,
        // kv:[] as Array<string>,
    };

    constructor(tableName: string) {
        if (tableName)
            this.table = tableName;
        this._dataset.queryPos = this._dataset.query;
        return this;
    }

    static table(tableName: string): ORM {
        return new ORM(tableName);
    }

    getLastQuery(): queryDefinition | null {
        const l = this._dataset.queryPos.length;
        if (!l) return null
        return this._dataset.queryPos[l - 1];
    }

    _operator(type: string): this {
        const last = this.getLastQuery();
        const lastIsOperator = last && last.type === 'operator';
        let not = false;
        let ao = !lastIsOperator || last.data.indexOf('or') === -1 ?
            'and' : 'or';
        switch (type) {
            case 'and':
            case 'or':
                ao = type;
                break;
            case 'not':
                not = true;
                break;
        }
        const target = [ao];
        if (not) target.push('not');
        //
        if (!lastIsOperator) {
            this._dataset.queryPos.push({
                type: 'operator',
                data: target,
            })
            return this;
        }
        last.data = target;
        return this;
    }

    or(): this {
        return this._operator('or');
    }

    not(): this {
        return this._operator('not');
    }

    and(): this {
        return this._operator('and');
    }

    _ormWhere(...arg: any[]): this {
        const last = this.getLastQuery();
        //如果最后一个不是运算符，那就添加一个运算符
        if (!last || last.type !== 'operator') {
            this._dataset.queryPos.push({
                type: 'operator',
                data: ['and'],
            });
        }

        switch (arg.length) {
            case 1:
                const prePos = this._dataset.queryPos;
                //
                this._dataset.queryPos.push({
                    type: 'sub',
                    data: [],
                });
                this._dataset.queryPos = this.getLastQuery().data as Array<queryDefinition>;
                //
                if (arg[0] && typeof arg[0] === 'function') {
                    arg[0](this);
                } else if (arg[0] && arg[0].length) {
                    for (let i1 = 0; i1 < arg[0].length; i1++) {
                        this._ormWhere(...arg[0][i1]);
                    }
                }
                //
                this._dataset.queryPos = prePos;
                break;
            case 2:
                this._dataset.queryPos.push({
                    type: 'expression',
                    data: [arg[0], '=', SQL_PARAM,],
                });
                this._dataset.binds.where.push(arg[1]);
                break;
            case 3:
                switch (arg[1]) {
                    default:
                        this._dataset.queryPos.push({
                            type: 'expression',
                            data: [arg[0], arg[1], SQL_PARAM,],
                        });
                        this._dataset.binds.where.push(arg[2]);
                        break;
                    case 'raw':
                        this._dataset.queryPos.push({
                            type: 'raw',
                            data: [arg[0],],
                        });
                        this._dataset.binds.where.push(...arg[2]);
                        break;
                    // case 'like':
                    case 'is':
                    case 'in':
                    case 'between':
                        //这几个都在预处理阶段处理成raw输入了
                        break;
                }
                break;
        }
        return this;
    }

    where(...arg: any[]): this {
        this._ormWhere(...arg);
        return this;
    }

    whereRaw(expr: string, ...arg: any[]): this {
        this._ormWhere(expr, 'raw', arg);
        return this;
    }

    whereNull(key: string): this {
        this._ormWhere(`${key} is null`, 'raw', []);
        return this;
    }

    whereIn(key: string, arr: (string | number)[]): this {
        const sArr = [];
        for (let i = 0; i < arr.length; i++) {
            sArr.push(SQL_PARAM);
        }
        this._ormWhere(`${key} in (${sArr.join(' , ')})`, 'raw', arr);
        return this;
    }

    whereBetween(key: string, a: number | string, b: number | string): this {
        this._ormWhere(`${key} between ${SQL_PARAM} and ${SQL_PARAM}`, 'raw', [a, b]);
        return this;
    }

    _makeWhere(queryArr?: Array<queryDefinition>): string {
        if (!queryArr) queryArr = JSON.parse(JSON.stringify(this._dataset.query)) as Array<queryDefinition>;
        // console.info(queryArr);
        //因为trim了头尾的operator，所以需要单独记录开头的not，否则无法查询
        const prependNot: string[] = [];
        //删除前后的多余query
        for (let i = 0; i < queryArr.length; i++) {
            // console.info('n', i);
            if (queryArr[i].type !== 'operator') break;
            if (queryArr[i].data.indexOf('not') !== -1) {
                prependNot.push('not');
            }
            queryArr.splice(i, 1);
            i -= 1;
        }
        for (let i = queryArr.length - 1; i > 0; i--) {
            // console.info('r', i);
            if (queryArr[i].type !== 'operator') break;
            queryArr.splice(i, 1);
            //反正已经删除了，不需要+1
            // i += 1;
        }
        // console.info(queryArr);
        //
        // console.info(this._dataset);
        // console.info(queryArr);
        let strArr = [];
        //这么写不大好看，但是总归能用
        if (prependNot.length) {
            strArr.push(prependNot);
        }
        for (let i = 0; i < queryArr.length; i++) {
            // console.info(queryArr[i]);
            switch (queryArr[i].type) {
                case 'expression':
                case 'raw':
                case 'operator':
                    strArr.push(queryArr[i].data.join(' '));
                    break;
                case 'sub':
                    strArr.push(
                        `( ${this._makeWhere(queryArr[i].data as Array<queryDefinition>)} )`
                    );
                    break;
            }
        }
        return strArr.join(' ');
    }


    // whereRaw():this{return this;}
    // whereNull():this{return this;}
    // whereNotNull():this{return this;}
    // whereIn():this{return this;}
    // whereNotIn():this{return this;}
    // whereBetween():this{return this;}
    // whereNotBetween():this{return this;}
    // join():this{return this;}

    group(by: string): this {
        this._dataset.group.push(by)
        return this;
    }

    order(by: string, sort?: string): this {
        if (!sort) sort = 'asc';
        this._dataset.sort.push([by, sort])
        return this;
    }

    sort(by: string, sort?: string): this {
        if (!sort) sort = 'asc';
        this._dataset.sort.push([by, sort])
        return this;
    }

    limit(num: number): this {
        this._dataset.limit = num;
        return this;
    }

    offset(num: number): this {
        this._dataset.offset = num;
        return this;
    }

    page(page: number, pageSize: number = 100): this {
        this._dataset.limit = pageSize;
        this._dataset.offset = pageSize * (page - 1);
        return this;
    }

    ignore(): this {
        this._dataset.ignore = true;
        return this;
    }

    // first():this{return this;}
    async select(column?: string[]): Promise<ORMQueryResult> {
        if (!column || !column.length) column = ['*'];
        const sqlPart = {
            column: column.join(','),
            table: this.table,
            where: this._makeWhere(),
            group: this._dataset.group.join(','),
            sort: '',
            limit: '',
        }
        //
        const sortArr = [];
        for (let i = 0; i < this._dataset.sort.length; i++) {
            const cur = this._dataset.sort[i];
            sortArr.push(`${cur[0]} ${cur[1]}`);
        }
        sqlPart.sort = sortArr.join(' , ');
        //
        if (this._dataset.offset || this._dataset.limit) {
            sqlPart.limit = `${this._dataset.limit} offset ${this._dataset.offset}`;
        }
        // console.info(this._dataset.binds.where);
        //
        sqlPart.table = sqlPart.table.length ? `from ${sqlPart.table}` : '';
        sqlPart.where = sqlPart.where.length ? `where ${sqlPart.where}` : '';
        sqlPart.group = sqlPart.group.length ? `group by ${sqlPart.group}` : '';
        sqlPart.sort = sqlPart.sort.length ? `order by ${sqlPart.sort}` : '';
        sqlPart.limit = sqlPart.limit.length ? `limit ${sqlPart.limit}` : '';
        let sql = `select ${sqlPart.column}
${sqlPart.table}
${sqlPart.where}
${sqlPart.group}
${sqlPart.sort}
${sqlPart.limit}`.trim();
        this._dataset.binds.full = [];
        this._dataset.binds.full.push(...this._dataset.binds.where);
        // this._dataset.binds.full.push(...this._dataset.binds.group);
        // this._dataset.binds.full.push(...this._dataset.binds.sort);
        this._dataset.binds.full.push(...this._dataset.binds.limit);
        // console.info(this._dataset);
        // console.info(sql, this._dataset.binds.full);
        if (ORM.dumpSql)
            console.info(sql, this._dataset.binds.full);
        const rows = await query(sql, this._dataset.binds.full);
        // console.info(this._dataset.binds.full[0],(rows as RowDataPacket[])[0]);
        return rows;
    }

    async count(column?: string): Promise<any> {
        if (!column || !column.length) column = '*';
        const result = await this.first([`count(${column}) as cc`]);
        if (result) return result.cc;
        return 0;
    }

    async first(column?: string[]): Promise<any> {
        const rows = await this.limit(1).select();
        if (rows.length) return rows[0];
        return null;
    }

    async update(kv: { [key: string]: any }): Promise<ORMExecuteResult> {
        const sqlPart = {
            table: this.table,
            where: this._makeWhere(),
            assignment: '',
            sort: '',
            limit: '',
        }
        const assignArr = [];
        const assignBinds = [];
        for (const key in kv) {
            if (!Object.prototype.hasOwnProperty.call(kv, key)) continue;
            assignArr.push(`${key} = ${SQL_PARAM}`);
            assignBinds.push(kv[key]);
        }
        sqlPart.assignment = assignArr.join(' , ');
        this._dataset.binds.full = [];
        //
        this._dataset.binds.full.push(...assignBinds);
        //
        const sortArr = [];
        for (let i = 0; i < this._dataset.sort.length; i++) {
            const cur = this._dataset.sort[i];
            sortArr.push(`${cur[0]} ${cur[1]}`);
        }
        sqlPart.sort = sortArr.join(' , ');
        //
        if (this._dataset.limit) {
            sqlPart.limit = `${this._dataset.limit}`;
        }
        //
        sqlPart.where = sqlPart.where.length ? `where ${sqlPart.where}` : '';
        sqlPart.sort = sqlPart.sort.length ? `order by ${sqlPart.sort}` : '';
        sqlPart.limit = sqlPart.limit.length ? `limit ${sqlPart.limit}` : '';
        let sql = `update ${sqlPart.table}
set
${sqlPart.assignment}
${sqlPart.where}
${sqlPart.sort}
${sqlPart.limit}`.trim();
        // console.info(sql, this._dataset.binds);
        this._dataset.binds.full.push(...this._dataset.binds.where);
        // this._dataset.binds.full.push(...this._dataset.binds.sort);
        this._dataset.binds.full.push(...this._dataset.binds.limit);
        const res = await execute(sql, this._dataset.binds.full);
        if (ORM.dumpSql)
            console.info(sql, this._dataset.binds.full);
        return res;
    }

    async insert(kv: { [key: string]: any }): Promise<ORMExecuteResult> {
        const sqlPart = {
            table: this.table,
            key: '',
            value: '',
            ignore: this._dataset.ignore ? 'ignore' : '',
        }
        const assigns = {
            key: [] as string[],
            value: [] as string[],
        };
        this._dataset.binds.full = [];
        //
        for (const key in kv) {
            if (!Object.prototype.hasOwnProperty.call(kv, key)) continue;
            assigns.key.push(key);
            assigns.value.push(SQL_PARAM);
            this._dataset.binds.full.push(kv[key]);
        }
        //
        sqlPart.key = assigns.key.join(' , ');
        sqlPart.value = assigns.value.join(' , ');
        //
        let sql = `insert ${sqlPart.ignore} into ${sqlPart.table} (${sqlPart.key})
values (${sqlPart.value})`.trim();
        // console.info(sql, this._dataset.binds);
        const res = await execute(sql, this._dataset.binds.full);
        if (ORM.dumpSql)
            console.info(sql, this._dataset.binds.full);
        return res;
    }

    async insertAll(kvs: Array<{ [key: string]: any }>): Promise<ORMExecuteResult> {
        const sqlPart = {
            table: this.table,
            key: '',
            value: '',
            ignore: this._dataset.ignore ? 'ignore' : '',
        }
        const assigns = {
            key: [] as string[],
            value: [] as string[],
        };
        this._dataset.binds.full = [];
        for (let i = 0; i < kvs.length; i++) {
            const kv = kvs[i];
            let v = [];
            for (const key in kv) {
                if (!Object.prototype.hasOwnProperty.call(kv, key)) continue;
                if (i === 0) assigns.key.push(key);
                v.push(SQL_PARAM);
                this._dataset.binds.full.push(kv[key]);
            }
            assigns.value.push(`( ${v.join(' , ')} )`);
        }
        //
        sqlPart.key = assigns.key.join(' , ');
        sqlPart.value = assigns.value.join(' , ');
        //
        let sql = `insert ${sqlPart.ignore} into ${sqlPart.table} (${sqlPart.key})
values ${sqlPart.value}`.trim();
        // console.info(sql, this._dataset.binds);
        const res = await execute(sql, this._dataset.binds.full);
        if (ORM.dumpSql)
            console.info(sql, this._dataset.binds.full);
        return res;
    }

    /*
    //mysql的lastInsertId为session级，不合适
    async lastInsertId(): Promise<number> {
        const [rows, fields]: [RowDataPacket[], any] = await conn().execute('select last_insert_id() as id;');
        // console.info(rows, fields);
        if (rows.length) return rows[0].id;
        return null;
    };*/

    async delete(): Promise<ORMExecuteResult> {
        const sqlPart = {
            table: this.table,
            where: this._makeWhere(),
            sort: '',
            limit: '',
            ignore: this._dataset.ignore ? 'ignore' : '',
        }
        const sortArr = [];
        for (let i = 0; i < this._dataset.sort.length; i++) {
            const cur = this._dataset.sort[i];
            sortArr.push(`${cur[0]} ${cur[1]}`);
        }
        sqlPart.sort = sortArr.join(' , ');
        this._dataset.binds.full = [];
        //
        if (this._dataset.limit) {
            sqlPart.limit = `${this._dataset.limit}`;
        }
        //
        sqlPart.where = sqlPart.where.length ? `where ${sqlPart.where}` : '';
        sqlPart.sort = sqlPart.sort.length ? `order by ${sqlPart.sort}` : '';
        sqlPart.limit = sqlPart.limit.length ? `limit ${sqlPart.limit}` : '';
        let sql = `delete ${sqlPart.ignore} from ${sqlPart.table}
${sqlPart.where}
${sqlPart.sort}
${sqlPart.limit}`.trim();
        // console.info(sql, this._dataset.binds);
        this._dataset.binds.full.push(...this._dataset.binds.where);
        // this._dataset.binds.full.push(...this._dataset.binds.sort);
        this._dataset.binds.full.push(...this._dataset.binds.limit);
        const res = await execute(sql, this._dataset.binds.full);
        if (ORM.dumpSql)
            console.info(sql, this._dataset.binds.full);
        return res;
    }
}

export default ORM;