import {IncomingMessage, ServerResponse} from 'http';
import {ParsedForm} from '../types';
import type {
    api_file_bath_delete_req,
    api_file_bath_delete_resp,
    api_file_bath_move_req,
    api_file_bath_move_resp,
    api_file_bath_rename_req,
    api_file_bath_rename_resp,
    api_file_checksum_req,
    api_file_checksum_resp,
    api_file_cover_req,
    api_file_cover_resp,
    api_file_delete_req,
    api_file_delete_resp,
    api_file_list_req,
    api_file_list_resp,
    api_file_mkdir_req,
    api_file_mkdir_resp,
    api_file_mod_req,
    api_file_mov_req,
    api_file_upload_req,
    api_file_upload_resp,
    api_node_col
} from '../../../share/Api';
import NodeModel from '../../model/NodeModel';
import GenFunc from '../../lib/GenFunc';
import {col_favourite, col_node, col_rate, col_tag} from '../../../share/Database';
import TagModel from '../../model/TagModel';
import TagGroupModel from '../../model/TagGroupModel';
import * as fp from "../../lib/FileProcessor";
import QueueModel from "../../model/QueueModel";
import FavouriteModel from "../../model/FavouriteModel";
import RateModel from "../../model/RateModel";
import FavouriteGroupModel from "../../model/FavouriteGroupModel";
import fs from "node:fs/promises";
import {splitQuery} from "../../lib/ModelHelper";
import UserModel from "../../model/UserModel";
import UserGroupModel from "../../model/UserGroupModel";

export default class {
    async get(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_list_resp> {
        const request = data.fields as api_file_list_req;
        // console.info(request);
        const treeLs = [];
        const listLs = [];
        const target = {
            path: [] as col_node[],
            list: [] as api_node_col[],
        };
        const model = new NodeModel();
        //
        const user = await (new UserModel).where('id', data.uid).first();
        const userGroup = await (new UserGroupModel).where('id', user.id_group).first();
        const userAuth = userGroup.auth;
        if (userAuth && userAuth.deny) {
            userAuth.deny.forEach(node => {
                model.not().whereRaw('find_in_set( ? ,node_id_list)', node.id)
                    .where('id', '<>', node.id)
            })
        }
        //
        switch (request.mode) {
            default:
            case 'directory':
                if (typeof request.pid == 'undefined' || request.pid === null) {
                    throw new Error('no def pid');
                }
                break;
            case 'search':
                if (request.keyword.length) {
                    model.where(
                        // 'index_node',
                        'title',
                        'like',
                        `%${request.keyword.trim()}%`
                    );
                    //搜索的时候节点短的在前，姑且先这么定义
                    model.order('CHAR_LENGTH(node_id_list)', 'asc');
                }
                break;
            case 'tag':
                break;
            case 'id_iterate':
                let idList = request.keyword.split(',');
                model.where((model) => {
                    model.whereIn('id', idList);
                    model.or().whereIn('id_parent', idList);
                    //参考 HoneyView 的话应该只看 parent
                    //但是参考 PotPlayer 就是用 find_in_set
                    //这样有性能问题，但是没想到什么好办法
                    //考虑到还是书多，所以还是只看 parent
                    // idList.forEach(id =>
                    //     model.or().whereRaw('find_in_set(?,node_id_list)', id)
                    // );
                });
                break;
            case 'favourite':
                const curFav = await (new FavouriteGroupModel).where('id', request.fav_id).first();
                if (!curFav) throw new Error('fav group not exist');
                if (curFav.auto) {
                    return await this.get({
                        uid: data.uid,
                        fields: Object.assign({
                            // cascade_dir: '1',
                            mode: 'directory',
                        } as api_file_list_req, curFav.meta),
                        files: data.files,
                    }, req, res);
                }
                model.whereRaw(
                    'id in (select id_node from favourite where id_group = ? and id_user = ?)'
                    , request.fav_id, data.uid
                ).where('status', 1)
                ;
                break;
        }
        if (request.tag_id) {
            let tagOr = !!request.tag_or;
            model.where((model) => {
                request.tag_id.split(',').forEach(tagId => {
                        if (tagOr)
                            model.or().whereRaw('find_in_set(?,tag_id_list)', tagId);
                        else
                            model.whereRaw('find_in_set(?,tag_id_list)', tagId);
                    }
                )
            })
        }
        let crumbPid = -1;
        if (request.pid && request.group != 'deleted') crumbPid = parseInt(request.pid);
        // if(request.mode=='id_iterate' && request.keyword.indexOf(',')===-1){
        //     crumbPid=parseInt(request.keyword);
        // }
        if (crumbPid !== -1) {
            target.path = await buildCrumb(crumbPid);
            if (request.cascade_dir)
                model.whereRaw('find_in_set(?,node_id_list)', crumbPid);
            else
                model.where('id_parent', crumbPid);
        }
        if (request.node_type) {
            switch (request.node_type) {
                case 'any':
                    break;
                default:
                case 'directory':
                    model.where('type', request.node_type);
                    break;
                case 'file':
                    model.where('type', '!=', 'directory');
                    break;
            }
        }
        switch (request.group) {
            default:
            case 'directory':
                model.where('status', 1);
                break;
            case 'deleted':
                model.where('status', 0);
                break;
        }
        if (request.limit) {
            model.limit(parseInt(request.limit));
        }
        if (request.rate) {
            model.whereRaw(
                'id in (select id_node from rate where id_user = ? and rate >= ?)'
                , data.uid, request.rate
            )
            ;
        }
        // console.info(model.l)
        // ORM.dumpSql = true;
        // console.info(model._dataset);
        // console.info(model._dataset.query);
        // console.info(model._dataset.queryPos);
        const nodeLs: api_node_col[] = await model.select();
        // ORM.dumpSql = false;
        // console.info(nodeLs);
        //
        const tagIdSet = new Set<number>();
        const fileIdSet = new Set<number>();
        const parentIdSet = new Set<number>();
        const nodeIdSet = new Set<number>();
        nodeLs.forEach(node => {
            // node.rate = Math.round(Math.random() * 10);
            nodeIdSet.add(node.id);
            node.tag_id_list.forEach(tagId => {
                tagIdSet.add(tagId);
            });
            // for (const key in node.index_file_id) {
            //     if (!Object.prototype.hasOwnProperty.call(node.index_file_id, key)) continue;
            //     const fileId = node.index_file_id[key];
            //     fileIdSet.add(fileId);
            // }
            node.node_id_list.forEach(nodeId => {
                if (nodeId) parentIdSet.add(nodeId);
            });
            node.is_file = node.type === 'directory' ? 0 : 1;
        });
        //收藏夹
        if (nodeIdSet.size) {
            const favList = await splitQuery<col_favourite>(FavouriteModel, Array.from(nodeIdSet), (orm) => {
                orm.where('id_user', data.uid).where('status', 1)
            });
            const favMap = new Map<number, number[]>();
            favList.forEach(fav => {
                let arr = favMap.get(fav.id_node);
                if (arr) {
                    arr.push(fav.id_group);
                } else {
                    favMap.set(fav.id_node, [fav.id_group]);
                }
            });
            nodeLs.forEach(node => {
                const arr = favMap.get(node.id)
                node.list_fav = arr ? arr : [];
            });
        }
        //评级
        if (nodeIdSet.size) {
            const rateList = await splitQuery<col_rate>(RateModel, Array.from(nodeIdSet), (orm) => {
                orm.where('id_user', data.uid)
            }, ['id_node', 'rate'], 'id_node');
            const rateMap = new Map<number, number>();
            rateList.forEach(rate => {
                rateMap.set(rate.id_node, rate.rate);
            });
            nodeLs.forEach(node => {
                const ifExs = rateMap.get(node.id) ?? 0;
                node.rate = ifExs;
            });
        }
        //配置
        let withConf = ['file', 'tag', 'crumb']
        // console.info(withConf);
        if (request.with && request.with.length) {
            withConf = request.with.split(',');
            if (withConf.indexOf('none') !== -1) {
                withConf = [];
            }
        }
        //标签
        if (withConf.indexOf('tag') !== -1 && tagIdSet.size) {
            // console.info(Array.from(tagIdSet));
            const tagLs = await (new TagModel).whereIn('id', Array.from(tagIdSet)).select();
            const tagGroupIdSet = new Set<number>();
            const tagMap = GenFunc.toMap(tagLs, 'id', (tag) => {
                tagGroupIdSet.add(tag.id_group);
            });
            const tagGroupLs = await (new TagGroupModel).whereIn('id', Array.from(tagGroupIdSet)).select();
            const tagGroupMap = GenFunc.toMap(tagGroupLs, 'id');
            nodeLs.forEach(node => {
                node.tag = [];
                const iTagGroupIdSet = new Set<number>();
                if (!node.tag_id_list.length) return;
                node.tag_id_list.forEach(tagId => {
                    const tag = tagMap.get(tagId);
                    iTagGroupIdSet.add(tag.id_group);
                });
                iTagGroupIdSet.forEach(groupId => {
                    const tagGroup = GenFunc.copyObject(tagGroupMap.get(groupId));
                    const tagLs: col_tag[] = [];
                    tagMap.forEach(tag => {
                        if (tag.id_group !== tagGroup.id) return;
                        if (node.tag_id_list.indexOf(tag.id) === -1) return;
                        tagLs.push(tag);
                    });
                    node.tag.push(Object.assign(tagGroup, {sub: tagLs}));
                });
            });
        }
        //面包屑
        const parentMap = new Map<number, col_node>();
        if (withConf.indexOf('crumb') !== -1) {
            if (parentIdSet.size) {
                const parentLs = await splitQuery<col_node>(NodeModel, Array.from(parentIdSet), undefined, [
                    'id', 'title', 'status', 'type',
                ]);
                parentLs.forEach(node => {
                    parentMap.set(node.id, node);
                });
            }
            parentMap.set(0, {
                id: 0, title: 'root', status: 1, type: 'directory'
            });
            nodeLs.forEach(node => {
                node.crumb_node = [];
                node.node_id_list.forEach(nodeId => {
                    const parentNode = parentMap.get(nodeId);
                    if (parentNode) {
                        node.crumb_node.push(parentNode);
                    }
                });
            });
        }
        if (withConf.indexOf('file') !== -1) {
            await fp.buildWebPath(nodeLs);
        }
        target.list = nodeLs;
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        // nodeLs.forEach(item => target.list.push(item));
        //
        return target;
    };

    // async del(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
    //     return null;
    // };

    async mov(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_mov_req;
        // const fromNode = await (new NodeModel()).where('id', request.node_id).first();
        await fp.mv(parseInt(request.id_node), parseInt(request.id_target));
        (new QueueModel).insert({
            type: 'file/rebuildIndex',
            payload: {id: parseInt(request.id_node)},
            status: 1,
        });
        return null;
    };

    async mod(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_mod_req;
        const fromNode = await (new NodeModel()).where('id', request.id).first();
        await fp.mv(fromNode.id, fromNode.id_parent, request.title, request.description);
        (new QueueModel).insert({
            type: 'file/rebuildIndex',
            payload: {id: fromNode.id},
            status: 1,
        });
        return null;
    };

    async upd(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_upload_resp> {
        const request = data.fields as api_file_upload_req;
        const files: any[] = data.files;
        // console.info(request);
        // console.info(files);
        // return null;
        const resultLs = [] as col_node[];
        for (const filesKey in files) {
            const file = files[filesKey];
            const fileInfo = await fp.put(
                file.filepath,
                parseInt(request.pid) ?? 0,
                file.originalFilename
            );
            if (!fileInfo) continue;
            resultLs.push(fileInfo);
            (new QueueModel).insert({
                type: 'file/build',
                payload: {id: fileInfo.id},
                status: 1,
            });
            (new QueueModel).insert({
                type: 'file/buildIndex',
                payload: {id: fileInfo.id},
                status: 1,
            });
            // console.info(filesKey);
            // console.info(file);
        }
        return resultLs;
    };

    async mkdir(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<false | api_file_mkdir_resp> {
        const request = data.fields as api_file_mkdir_req;
        const dir = await fp.mkdir(parseInt(request.pid) ?? 0, request.title);
        if (dir) (new QueueModel).insert({
            type: 'file/buildIndex',
            payload: {id: dir.id},
            status: 1,
        });
        return dir;
    }

    async cover(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<false | api_file_cover_resp> {
        const request = data.fields as api_file_cover_req;
        let curNode = await new NodeModel().where('id', request.id).first();
        if (!curNode) throw new Error('node not found');
        const curPNode = await new NodeModel().where('id', curNode.id_parent).first();
        if (!curPNode) return;
        while (curNode.file_index.rel) {
            curNode = await new NodeModel().where('id', curNode.id).first();
            if (!curNode) throw new Error('rel node not found');
            // if (!curNode.file_index.rel) break;
        }
        // const coverId = curNode.file_index.cover;
        // if (!coverId) return;
        // const fileIndex = curNode.file_index;
        // fileIndex.cover = coverId;
        const tFileIndex = curPNode.file_index;
        tFileIndex.rel = curNode.id;
        await new NodeModel().where('id', curPNode.id).update({
            file_index: tFileIndex,
        });
        return curNode;
    }

    async delete(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<false | api_file_delete_resp> {
        const request = data.fields as api_file_delete_req;
        await fp.rm(parseInt(request.id));
        return;
    }

    async delete_forever(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<false | api_file_delete_resp> {
        const request = data.fields as api_file_delete_req;
        const curNode = await new NodeModel().where('id', request.id).first();
        if (!curNode) return;
        if (curNode.status != 0) throw new Error('node is not deleted');
        await new NodeModel().where('id', request.id).update({status: -1});
        (new QueueModel).insert({
            type: 'file/deleteForever',
            payload: {id: curNode.id},
            status: 1,
        });
        // const fileIdSet = new Set<number>();
        // for (const type in curNode.index_file_id) {
        //     fileIdSet.add(curNode.index_file_id[type]);
        // }
        // if (curNode.type === 'directory') {
        //     const cascadeNode = await (new NodeModel).whereRaw('find_in_set( ? ,node_id_list)', curNode.id).select([
        //         'id',
        //         'title',
        //         'type',
        //         'index_file_id',
        //     ]);
        //     cascadeNode.forEach(node => {
        //         for (const type in node.index_file_id) {
        //             fileIdSet.add(node.index_file_id[type]);
        //         }
        //     });
        // }
        // const fileList = await (new FileModel).whereIn('id', Array.from(fileIdSet)).select();
        return;
    }

    async bath_rename(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_bath_rename_resp | any> {
        const request = data.fields as api_file_bath_rename_req;
        const list: { id: number, title: string }[] = JSON.parse(request.list);
        //
        for (const item of list) {
            await fp.mv(item.id, -1, item.title);
            await (new QueueModel).insert({
                type: 'file/rebuildIndex',
                payload: {id: item.id},
                status: 1,
            });
        }
    }

    async bath_delete(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_bath_delete_resp | any> {
        const request = data.fields as api_file_bath_delete_req;
        const list = request.id_list.split(',');
        //
        for (const nodeId of list) {
            await fp.rm(parseInt(nodeId));
        }
    }

    async bath_delete_forever(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_bath_delete_resp | any> {
        const request = data.fields as api_file_bath_delete_req;
        const list = request.id_list.split(',');
        //
        for (const nodeId of list) {
            await new NodeModel().where('id', nodeId).update({status: -1});
            (new QueueModel).insert({
                type: 'file/deleteForever',
                payload: {id: parseInt(nodeId)},
                status: 1,
            });
        }
    }

    async bath_move(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_bath_move_resp | any> {
        const request = data.fields as api_file_bath_move_req;
        const list = request.id_list.split(',');
        //
        for (const nodeId of list) {
            const id = parseInt(nodeId);
            await fp.mv(id, parseInt(request.id_parent));
            await (new QueueModel).insert({
                type: 'file/rebuildIndex',
                payload: {id: id},
                status: 1,
            });
        }
    }

    async rebuild(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_checksum_req;
        const list = request.id_list.split(',');
        //
        for (const nodeId of list) {
            const curNode = await new NodeModel().where('id', nodeId).first();
            if (!curNode) continue;
            await (new QueueModel).insert({
                type: 'file/rebuild',
                payload: {id: curNode.id},
                status: 1,
            });
            await (new QueueModel).insert({
                type: 'file/rebuildIndex',
                payload: {id: curNode.id},
                status: 1,
            });
        }
    }

    async rehash(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<api_file_checksum_resp | any> {
        const request = data.fields as api_file_checksum_req;
        const list = request.id_list.split(',');
        //
        for (const fileId of list) {
            const id = parseInt(fileId);
            const curNode = await new NodeModel().where('id', id).first();
            if (!curNode) continue;
            await (new QueueModel).insert({
                type: 'file/checksum',
                payload: {id: curNode.id},
                status: 1,
            });
        }
    }

    async cascade_tag(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_checksum_req;
        const list = request.id_list.split(',');
        //
        for (const nodeId of list) {
            const curNode = await new NodeModel().where('id', nodeId).first();
            if (!curNode) continue;
            await (new QueueModel).insert({
                type: 'ext/cascadeTag',
                payload: {id: curNode.id},
                status: 1,
            });
        }
    }

    async rm_raw(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_checksum_req;
        const list = request.id_list.split(',');
        //
        for (const nodeId of list) {
            const curNode = await new NodeModel().where('id', nodeId).first();
            if (!curNode) continue;
            await (new QueueModel).insert({
                type: 'ext/rmRaw',
                payload: {id: curNode.id},
                status: 1,
            });
        }
    }

    async import_eht(data: ParsedForm, req: IncomingMessage, res: ServerResponse): Promise<any> {
        const request = data.fields as api_file_checksum_req;
        const list = request.id_list.split(',');
        //
        try {
            const ifConfExs = await fs.access(`${__dirname}/../../../../../resource/getEHTTag.cookie.txt`)
        } catch (e) {
            throw new Error('eht conf file not found, write cookie to resource/getEHTTag.cookie.txt');
        }
        for (const nodeId of list) {
            const curNode = await new NodeModel().where('id', nodeId).first();
            if (!curNode) continue;
            await (new QueueModel).insert({
                type: 'ext/importEHT',
                payload: {id: curNode.id},
                status: 1,
            });
        }
    }
};

async function buildCrumb(pid: number): Promise<col_node[]> {
    const model = new NodeModel();
    const curNode = await model.where('id', pid).first();
    //tree这个是.path下面的，with_crumb是单独节点的
    if (!curNode) return [];
    const treeNodeIdLs = curNode.node_id_list;
    const treeNodeLs = await (new NodeModel).whereIn('id', treeNodeIdLs).select();
    const treeNodeMap = GenFunc.toMap(treeNodeLs, 'id');
    const targetLs: col_node[] = [];
    treeNodeIdLs.forEach(id => {
        if (id === 0) {
            targetLs.push({
                id: 0,
                title: 'root',
                id_parent: -1,
                type: 'directory',
                status: 1,
                node_id_list: [],
            });
        } else {
            const node = treeNodeMap.get(id);
            if (node) {
                targetLs.push(node);
            }
        }
    });
    targetLs.push(curNode);
    return targetLs;
}

// sync with front/src/views/FileView.vue
function sortList(list: col_node[], sortVal: string) {
    let sortType: [keyof col_node, string] = ['id', 'asc'];
    switch (sortVal) {
        default:
        case 'id_asc':
            sortType = ['id', 'asc',];
            break;
        case 'id_desc':
            sortType = ['id', 'desc',];
            break;
        case 'name_asc':
            sortType = ['title', 'asc',];
            break;
        case 'name_desc':
            sortType = ['title', 'desc',];
            break;
        case 'crt_asc':
            sortType = ['time_create', 'asc',];
            break;
        case 'crt_desc':
            sortType = ['time_create', 'desc',];
            break;
        case 'upd_asc':
            sortType = ['time_update', 'asc',];
            break;
        case 'upd_desc':
            sortType = ['time_update', 'desc',];
            break;
    }
    list.sort((a, b) => {
        const va = a[sortType[0]];
        const vb = b[sortType[0]];
        const rev = sortType[1] == 'desc' ? -1 : 1;
        return (va ? va : 0) > (vb ? vb : 0) ? rev * 1 : rev * -1;
    })
    return list;
}