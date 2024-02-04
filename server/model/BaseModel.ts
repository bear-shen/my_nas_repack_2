import ORM from "../lib/ORM";
import {ResultSetHeader} from "mysql2";

interface field {
    [key: string]: any;
}

class BaseModel<field> extends ORM {
    // public columns: { [key: string]: any } = {};

    constructor() {
        super('');
    }

    async select(column?: (keyof field)[] | string[]): Promise<field[]> {
        const res = await super.select(column as string[]);
        for (let i = 0; i < res.length; i++) {
            res[i] = JSON.parse(JSON.stringify(res[i]));
            for (const key in res[i]) {
                if (!Object.prototype.hasOwnProperty.call(res[i], key)) continue;
                if (this[`_col_get_${key}` as string as keyof BaseModel<field>]) {
                    res[i][key] = (
                        this[`_col_get_${key}` as string as keyof BaseModel<field>] as (input: any) => any
                    )(res[i][key]);
                }
            }
        }
        return res;
    }

    async first(column?: (keyof field)[] | string[]): Promise<field> {
        const res = await super.first(column as string[]);
        if (!res) return null;
        /*for (const key in res) {
            if (!Object.prototype.hasOwnProperty.call(res, key)) continue;
            if (this[`_col_get_${key}` as keyof BaseModel<field>])
                res[key] =
                    (this[`_col_get_${key}` as keyof BaseModel<field>] as (input: any) => any)
                    (res[key]);
        }*/
        return res;
    }

    async update(kv: field | { [p: string]: any }): Promise<ResultSetHeader> {
        kv = JSON.parse(JSON.stringify(kv)) as { [p: string]: any };
        for (const key in kv) {
            if (!Object.prototype.hasOwnProperty.call(kv, key)) continue;
            if (this[`_col_set_${key}` as string as keyof BaseModel<field>])
                kv[key] = (this[`_col_set_${key}` as string as keyof BaseModel<field>] as (input: any) => any)(kv[key]);
        }
        return await super.update(kv);
    }

    async insert(kv: field | { [p: string]: any }): Promise<ResultSetHeader> {
        kv = JSON.parse(JSON.stringify(kv)) as { [p: string]: any };
        for (const key in kv) {
            if (!Object.prototype.hasOwnProperty.call(kv, key)) continue;
            if (this[`_col_set_${key}` as string as keyof BaseModel<field>])
                kv[key] = (this[`_col_set_${key}` as string as keyof BaseModel<field>] as (input: any) => any)(kv[key]);
        }
        return await super.insert(kv);
    }

    async insertAll(kvs: Array<field | { [p: string]: any }>): Promise<ResultSetHeader> {
        const pkvs = JSON.parse(JSON.stringify(kvs)) as Array<{ [p: string]: any }>;
        for (let i = 0; i < pkvs.length; i++) {
            for (const key in pkvs[i]) {
                if (!Object.prototype.hasOwnProperty.call(pkvs[i], key)) continue;
                if (this[`_col_set_${key}` as string as keyof BaseModel<field>])
                    pkvs[i][key] = (this[`_col_set_${key}` as string as keyof BaseModel<field>] as (input: any) => any)(pkvs[i][key]);
            }
        }
        // console.info(kvs);
        return await super.insertAll(pkvs);
    }

    async delete(): Promise<ResultSetHeader> {
        return await super.delete();
    }

    where(...arg: (keyof field)[] | any[] | ((orm: this) => any)[]): this {
        return super.where(...arg);
    }

    whereRaw(expr: string, ...arg: any[]): this {
        return super.whereRaw(expr, ...arg);
    }

    whereNull(key: keyof field | string): this {
        return super.whereNull(key as string);
    }

    whereIn(key: keyof field | string, arr: (string | number)[]): this {
        return super.whereIn(key as string, arr);
    }

    whereBetween(key: keyof field | string, a: number | string, b: number | string): this {
        return super.whereBetween(key as string, a, b);
    }

    group(by: keyof field | string): this {
        return super.group(by as string);
    }

    order(by: keyof field | string, sort?: string): this {
        return super.order(by as string, sort);
    }

    sort(by: keyof field | string, sort?: string): this {
        return super.sort(by as string, sort);
    }
}

export default BaseModel;