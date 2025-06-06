import {api_file_list_req} from "./Api";

export type type_file = 'audio' | 'video' |
    'image' | 'binary' |
    'text' | 'subtitle' |
    'pdf' | 'office' | 'directory';

export type col_node_file_index = {
    size: number, checksum: string[],
    ext?: string, path?: string,
};


export type col_node = {
    id?: number,
    id_parent?: number,
    type?: type_file,
    title?: string,
    description?: string,
    node_id_list?: number[],
    node_path?: string,
    file_index?: {
        //这样
        //rel赋值时为映射的文件id，替换整个file_index
        //因为只替换一次因此也应该避免迭代
        //具体的类型实现前端自己进行
        rel?: number,
        //封面
        cover?: col_node_file_index,
        //视频和音频封面
        preview?: col_node_file_index,
        //图片的展示内容
        normal?: col_node_file_index,
        raw?: col_node_file_index,
        [key: string]: number | col_node_file_index,
    },
    status?: number,
    cascade_status?: number,
    building?: number,
    tag_id_list?: number[],
    node_index?: {
        title: string,
        description: string,
        tag: string[],
    },
    time_create?: string,
    time_update?: string,
    rel_node_id?: number,
}

export type col_user_group = {
    id?: number,
    title?: string,
    description?: string,
    admin?: 0 | 1,
    status?: 0 | 1,
    auth?: {
        allow: ({
            id: number,
            title: number,
        } & col_node)[],
        deny: ({
            id: number,
            title: number,
        } & col_node)[],
    },
    time_create?: string,
    time_update?: string,
}

export type col_user = {
    id?: number,
    id_group?: number,
    name?: string,
    mail?: string,
    password?: string,
    status?: 0 | 1,
    time_create?: string,
    time_update?: string,
}

export type col_tag_group = {
    id?: number,
    id_node?: number,
    title?: string,
    description?: string,
    sort?: number,
    status?: 0 | 1,
    time_create?: string,
    time_update?: string,
}

export type col_tag = {
    id?: number,
    id_group?: number,
    title?: string,
    alt?: string[],
    description?: string,
    status?: 0 | 1,
    index_tag?: string[],
    time_create?: string,
    time_update?: string,
}

export type col_auth = {
    id?: number,
    uid?: number,
    token?: string,
    time_create?: string,
    time_update?: string,
}

export type col_queue = {
    id?: number,
    type?: string,
    payload?: { [key: string]: any },
    //-2 unknown -1 failed 0 success 1 new 2 working
    status?: 0 | 1 | -2 | -1 | 2,
    result?: string,
    time_create?: string,
    time_update?: string,
}

export type col_setting = {
    id?: number,
    name?: string,
    value?: { [key: string]: any },
    status?: number,
    time_create?: string,
    time_update?: string,
}

export type col_cache = {
    code?: string,
    val?: string,
}

export type col_favourite_group = {
    id?: number,
    id_user?: number,
    title?: string,
    status?: 0 | 1,
    auto?: 0 | 1,
    meta?: api_file_list_req,
    time_create?: string,
    time_update?: string,
}

export type col_favourite = {
    id?: number,
    id_user?: number,
    id_group?: number,
    id_node?: number,
    status?: 0 | 1,
    time_create?: string,
    time_update?: string,
}

export type col_rate = {
    id?: number,
    id_user?: number,
    id_node?: number,
    rate?: number,
    time_create?: string,
    time_update?: string,
}

export type col_share = {
    id?: string,
    id_user?: number,
    node_id_list?: number[],
    //0 stop 1 time 2 long
    status?: 0 | 1 | 2 | number,
    time_to?: string,
    time_create?: string,
    time_update?: string,
}












