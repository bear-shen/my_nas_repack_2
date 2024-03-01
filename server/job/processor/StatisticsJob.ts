import {conn} from "../../lib/SQL";
import NodeModel from "../../model/NodeModel";
import {RowDataPacket} from "mysql2";
import SettingModel from "../../model/SettingModel";
import {api_statistics_node} from "../../../share/Api";

class Statistics {
    static async node(payload: { [key: string]: any }): Promise<any> {
        const result: api_statistics_node = {
            suffix: [],
            directory: [],
        };
        const sqlLs = {
                suffix: `select suffix, count(id) as count, sum(size) as size
                         from file
                         GROUP BY suffix
                ;`,
                directory: {
                    nodes: `select count(id) as count
                            from node
                            where FIND_IN_SET('[id]', list_node);`,
                    files: `select count(id) as count, sum(size) as size
                            from file
                            where id in (select distinct JSON_EXTRACT(node.index_file_id, case jt.rowid when 1 then '$.raw' when 2 then '$.normal' when 3 then '$.preview' else '$.cover' end)
                                         from node
                                                  join json_table(
                                                  '["raw","normal","preview","cover"]',
                                                  '$[*]' columns (rowid for ordinality, jKey varchar(20) path '$[*]')
                                                  ) as jt
                                         where FIND_IN_SET('[id]', node.list_node))
                    ;`,
                    raw: `select count(id) as count, sum(size) as size
                          from file
                          where id in (select distinct JSON_VALUE(index_file_id, '$.raw')
                                       from node
                                       where FIND_IN_SET('[id]', list_node))
                    ;`,
                    normal: `select count(id) as count, sum(size) as size
                             from file
                             where id in (select distinct JSON_VALUE(index_file_id, '$.normal')
                                          from node
                                          where FIND_IN_SET('[id]', list_node))
                    ;`,
                    preview: `select count(id) as count, sum(size) as size
                              from file
                              where id in (select distinct JSON_VALUE(index_file_id, '$.preview')
                                           from node
                                           where FIND_IN_SET('[id]', list_node))
                    ;`,
                    cover: `select count(id) as count, sum(size) as size
                            from file
                            where id in (select distinct JSON_VALUE(index_file_id, '$.cover')
                                         from node
                                         where FIND_IN_SET('[id]', list_node))
                    ;`,
                }
            }
        ;
        console.info('suffix');
        const [suffixResLs] = await conn().execute(sqlLs.suffix, []);
        (suffixResLs as RowDataPacket[]).forEach(suffixRes => {
            result.suffix.push({
                suffix: suffixRes.suffix,
                size: suffixRes.size,
                count: suffixRes.count,
            })
        });
        console.info('directory');
        const nodeL1Ls = await (new NodeModel).where('id_parent', 0).where('type', 'directory').select();
        for (let i1 = 0; i1 < nodeL1Ls.length; i1++) {
            const nodeL1 = nodeL1Ls[i1];
            const nodeL1Meta = {
                id: nodeL1.id,
                title: nodeL1.title,
                path: '/' + nodeL1.title + '/',
                nodes: {count: 0,},
                files: {count: 0, size: 0,},
                raw: {count: 0, size: 0,},
                normal: {count: 0, size: 0,},
                preview: {count: 0, size: 0,},
                cover: {count: 0, size: 0,},
            };
            for (const sT in sqlLs.directory) {
                const [sLs] = await conn().execute(
                    sqlLs.directory[sT as keyof typeof sqlLs.directory].replaceAll('[id]', nodeL1.id.toString()),
                    []
                );
                const row = (sLs as RowDataPacket)[0];
                if (row.count) ((nodeL1Meta as any)[sT]).count = row.count;
                if (row.size) ((nodeL1Meta as any)[sT]).size = row.size;
            }
            result.directory.push(nodeL1Meta);
            //
            const nodeL2Ls = await (new NodeModel).where('id_parent', nodeL1.id).where('type', 'directory').select();
            if (nodeL2Ls.length > 50) continue;
            for (let i2 = 0; i2 < nodeL2Ls.length; i2++) {
                const nodeL2 = nodeL2Ls[i2];
                const nodeL2Meta = {
                    id: nodeL2.id,
                    title: nodeL2.title,
                    path: '/' + nodeL1.title + '/' + nodeL2.title + '/',
                    nodes: {count: 0,},
                    files: {count: 0, size: 0,},
                    raw: {count: 0, size: 0,},
                    normal: {count: 0, size: 0,},
                    preview: {count: 0, size: 0,},
                    cover: {count: 0, size: 0,},
                };
                console.info(nodeL2.title);
                for (const sT in sqlLs.directory) {
                    const [sLs] = await conn().execute(
                        sqlLs.directory[sT as keyof typeof sqlLs.directory].replaceAll('[id]', nodeL2.id.toString()),
                        []
                    );
                    const row = (sLs as RowDataPacket)[0];
                    if (row.count) ((nodeL2Meta as any)[sT]).count = row.count;
                    if (row.size) ((nodeL2Meta as any)[sT]).size = row.size;
                }
                result.directory.push(nodeL2Meta);
            }
        }
        //
        const ifExs = await (new SettingModel).where('name', '_t_stat_node').first();
        if (ifExs) {
            await (new SettingModel).where('id', ifExs.id).update({
                value: result,
            })
        } else {
            await (new SettingModel).insert({
                name: '_t_stat_node',
                value: result,
            })
        }
    }
}

export default Statistics;