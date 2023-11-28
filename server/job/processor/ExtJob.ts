import util from "util";
import {get as getConfig} from "../../ServerConfig";
import NodeModel from "../../model/NodeModel";
import * as fp from "../../lib/FileProcessor";

const exec = util.promisify(require('child_process').exec);

class ExtJob {
    static async rmRaw(payload: { [key: string]: any }): Promise<any> {
        // const config = getConfig();
        const rootId = payload.dirId;
        const root = await (new NodeModel).where('id', rootId).first();
        if (!root) throw new Error('root not found');
        const nodeLs = await (new NodeModel)
            .whereRaw('find_in_set(?,list_node)', root.id)
            .select();
        for (let i1 = 0; i1 < nodeLs.length; i1++) {
            const node = nodeLs[i1];
            if (!node.index_file_id) continue;
            if (!node.index_file_id.raw) continue;
            if (!node.index_file_id.normal) continue;
            if (node.index_file_id.normal === node.index_file_id.raw) continue;
            const rawFId = node.index_file_id.raw;
            node.index_file_id.raw = node.index_file_id.normal;
            await (new NodeModel).where('id', node.id).update({
                index_file_id: node.index_file_id,
            });
            const ifOrphan = await fp.checkOrphanFile(rawFId)
            if (ifOrphan) continue;
            await fp.rmReal(rawFId);
        }
        return;
    }

    static async cascadeTag(payload: { [key: string]: any }): Promise<any> {
        // const config = getConfig();
        const rootId = payload.dirId;
        const root = await (new NodeModel).where('id', rootId).first();
        if (!root) throw new Error('root not found');
        const dirLs = await (new NodeModel).where('id_parent', root.id).select();
        if (!dirLs.length) return;
        for (let i1 = 0; i1 < dirLs.length; i1++) {
            const dir = dirLs[i1];
            if (!dir.list_tag_id) continue;
            if (!dir.list_tag_id.length) continue;
            const subLs = await (new NodeModel)
                .where('id_parent', dir.id)
                .where('type', 'directory')
                .select();
            for (let i2 = 0; i2 < subLs.length; i2++) {
                const sub = subLs[i2];
                const tagIdSet: Set<number> = new Set(sub.list_tag_id);
                dir.list_tag_id.forEach(id => tagIdSet.add(id));
                await (new NodeModel)
                    .where('id', sub.id)
                    .update({
                        list_tag_id: Array.from(tagIdSet),
                    });
            }
        }
        return;
    }

    static async importEHT(payload: { [key: string]: any }): Promise<any> {
        const config = getConfig();
        return;
    }

    static async exec(payload: { [key: string]: any }): Promise<any> {
    }
}


export default ExtJob;