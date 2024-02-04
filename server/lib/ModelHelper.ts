import BaseModel from "../model/BaseModel";

export async function splitQuery<K>(
    instance: typeof BaseModel<K>, idList: (number | string)[]
    , ext?: (orm: BaseModel<K>) => any
    , column: string[] = ['*'], key: string = 'id'
    , size: number = 1000
): Promise<K[]> {
    let startInd = 0;
    const resArr: K[] = [];
    while (true) {
        const orm = new instance();
        orm.whereIn(key, idList.slice(startInd, startInd + size));
        if (ext) ext(orm);
        const subLs = await orm.select(column);
        resArr.push(...subLs);
        //
        startInd += size;
        if (startInd > idList.length) break;
    }
    return resArr;
}