export type FileType = 'audio' | 'video' |
    'image' | 'binary' |
    'text' | 'subtitle' |
    'pdf' | 'directory';

export interface NodeCol {
    id?: number,
    id_parent?: number,
    type?: FileType,
    title?: string,
    description?: string,
    status?: 0 | 1 | -1,
    building?: 0 | 1,
    //节点树
    list_node?: number[],
    //标签
    list_tag_id?: number[],
    //文件
    index_file_id?: {
        preview?: number,
        normal?: number,
        cover?: number,
        raw: number,
        [key: string]: number | undefined,
    },
    //节点索引
    index_node?: {
        title: string,
        description: string,
        tag: string[],
    },
    time_create?: string,
    time_update?: string,
}

export interface FileCol {
    id?: number,
    hash?: string,
    suffix?: string,
    size?: number,
    meta?: { [key: string]: any },
    status?: 0 | 1,
    time_create?: string,
    time_update?: string,
}

export interface UserGroupCol {
    id?: number,
    title?: string,
    description?: string,
    admin?: 0 | 1,
    status?: 0 | 1,
    auth?: Array<{
        id_dir: number;
        allow_r: boolean | number,
        allow_w: boolean | number,
    }>,
    time_create?: string,
    time_update?: string,
}

export interface UserCol {
    id?: number,
    id_group?: number,
    name?: string,
    mail?: string,
    password?: string,
    status?: 0 | 1,
    time_create?: string,
    time_update?: string,
}

export interface TagGroupCol {
    id?: number,
    id_dir?: number,
    title?: string,
    description?: string,
    sort?: number,
    status?: 0 | 1,
    time_create?: string,
    time_update?: string,
}

export interface TagCol {
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

export interface AuthCol {
    id?: number,
    uid?: number,
    token?: string,
    time_create?: string,
    time_update?: string,
}

export interface QueueCol {
    id?: number,
    type?: string,
    payload?: { [key: string]: any },
    status?: 0 | 1,
    time_create?: string,
    time_update?: string,
}

export interface SettingCol {
    id?: number,
    name?: string,
    value?: { [key: string]: any },
    time_create?: string,
    time_update?: string,
}
