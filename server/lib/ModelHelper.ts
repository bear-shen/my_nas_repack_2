import BaseModel from "../model/BaseModel";

export async function splitQuery<field>(
    instance: typeof BaseModel<field>, idList: (number | string)[]
    , ext?: (orm: BaseModel<field>) => any
    , column: (keyof field | string)[] = ['*'], key: string = 'id'
    , size: number = 1000
): Promise<field[]> {
    let startInd = 0;
    const resArr: field[] = [];
    // let subLs: K[] = [];
    // ORM.dumpSql=true;
    while (true) {
        const orm = new instance();
        // console.info(idList.length,startInd, startInd + size,idList.slice(startInd, startInd + size)[0])
        // console.info(startInd,idList.slice(startInd, startInd + size)[0]);
        orm.whereIn(key, idList.slice(startInd, startInd + size));
        // if(idList.slice(startInd, startInd + size).indexOf(3459926)!==-1){
        //     console.info('hit slice',new Error().stack);
        // }
        if (ext) ext(orm);
        // console.info(orm._dataset);
        const subLs = await orm.select(column);
        // console.info(subLs[0]);
        // subLs.forEach(sub=>resArr.push(sub));
        resArr.push(...subLs);
        // subLs=[];
        startInd += size;
        // console.info('startInd:',startInd);
        if (startInd > idList.length) break;
    }
    // ORM.dumpSql=false;
    return resArr;
}