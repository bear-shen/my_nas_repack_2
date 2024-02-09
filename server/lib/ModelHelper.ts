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
        // console.info(idList.length,startInd, startInd + size,idList.slice(startInd, startInd + size)[0])
        orm.whereIn(key, idList.slice(startInd, startInd + size));
        if (ext) ext(orm);
        const subLs = await orm.select(column);
        // console.info(subLs[0]);
        resArr.push(...subLs);
        //
        startInd += size;
        // console.info('startInd:',startInd);
        if (startInd > idList.length) break;
    }
    return resArr;
}