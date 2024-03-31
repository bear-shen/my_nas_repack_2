import {api_file_list_req} from "./Api";

export type type_file = 'audio' | 'video' |
    'image' | 'binary' |
    'text' | 'subtitle' |
    'pdf' | 'directory';

export type col_node = {
    id?: number,
    id_parent?: number,
    type?: type_file,
    title?: string,
    description?: string,
    node_id_list?: number[],
    node_path?: string,
    file_index?: {
        preview?: { size: number, checksum: string[], },
        normal?: { size: number, checksum: string[], },
        cover?: { size: number, checksum: string[], },
        raw?: { size: number, checksum: string[], },
        [key: string]: { size: number, checksum: string[], },
    },
    status?: number,
    building?: number,
    tag_id_list?: [],
    node_index?: {
        title: string,
        description: string,
        tag: string[],
    },
    time_create?: string,
    time_update?: string,
}

export type col_file = {
    id?: number,
    uuid?: string,
    suffix?: string,
    size?: number,
    // meta?: { [key: string]: any },
    status?: 0 | 1,
    checksum?: string,
    time_create?: string,
    time_update?: string,
}

export type col_file_with_path = {
    path?: string,
} & col_file

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