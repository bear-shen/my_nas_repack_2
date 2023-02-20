import {col_file, col_file_with_path, col_node, col_tag, col_tag_group, col_user, type_file} from './Database';

export type api_node_col = {
    is_file?: number,
    is_fav?: number,
    tree?: { id: number, title: string }[],
    file?: {
        preview?: col_file_with_path,
        normal?: col_file_with_path,
        cover?: col_file_with_path,
        raw?: col_file_with_path,
        [key: string]: col_file_with_path | undefined,
    },
    tag?: (
        col_tag_group & {
        sub: col_tag[]
    }
        )[],
    crumb_node?: col_node[],
} & col_node

export type api_file_list_resp = {
    path: api_node_col[],
    // path: col_node[],
    list: api_node_col[],
}

export type api_file_list_req = {
    keyword?: string,
    type?: type_file | string,
    sort?: string,
    pid?: string,
    tid?: string,
    deleted?: string,
    no_file?: string,
    no_tag?: string,
    with_crumb?: string,
} & { [key: string]: any }

export type api_user_login_req = {
    username: string,
    password: string,
}
export type api_user_login_resp = {
    token: string,
} & col_user


export type api_file_upload_req = {
    pid: string,
}
export type api_file_upload_resp = col_node[];


export type api_file_mkdir_req = {
    pid: string,
    title: string,
}
export type api_file_mkdir_resp = col_node;

export type api_file_mov_req = {
    node_id: string,
    target_id: string,
}
export type api_file_mov_resp = {}

export type api_file_mod_req = {
    id: string,
    title: string,
    description: string,
}
export type api_file_mod_resp = {}

export type api_tag_col = {
    group: col_tag_group,
} & col_tag;