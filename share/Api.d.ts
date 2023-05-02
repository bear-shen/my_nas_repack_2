import {col_file, col_file_with_path, col_node, col_tag, col_tag_group, col_user, type_file} from './Database';

export type api_node_col = {
    is_file?: number,
    is_fav?: number,
    //初版的设计是分开存储方便遍历
    //后来又改了
    //现在总之放crumb_node了
    // tree?: { id: number, title: string }[],
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
    limit?: string,
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


export type api_tag_list_req = {
    keyword?: string,
    size?: string,
    id_group?: string,
    is_del?: string,
} & { [key: string]: any };

export type api_tag_list_resp =
    api_tag_col[];

export type api_tag_del_req = {
    id?: string,
} & { [key: string]: any };
export type api_tag_del_resp = {};

export type api_tag_mod_req = {
    id?: string,
    id_group?: string,
    title?: string,
    alt?: string,
    description?: string,
    status?: string,
} & { [key: string]: any };

export type api_tag_mod_resp = api_tag_mod_req;

export type api_tag_attach_req = {
    id_node?: string,
    tag_list?: string,
} & { [key: string]: any };

export type api_tag_attach_resp = {};


export type api_tag_group_col = {
    node: col_node & {
        crumb_node?: col_node[],
    },
} & col_tag_group;

export type api_tag_group_list_req = {
    keyword?: string,
    is_del?: string,
} & { [key: string]: any };

export type api_tag_group_list_resp =
    api_tag_group_col[];

export type api_tag_group_del_req = {
    id?: string,
} & { [key: string]: any };
export type api_tag_group_del_resp = {};

export type api_tag_group_mod_req = {
    id?: string,
    title?: string,
    description?: string,
    id_node?: string,
    sort?: string,
    status?: string,
} & { [key: string]: any };

export type api_tag_group_mod_resp = api_tag_group_mod_req;


export type api_file_cover_req = {
    id: string,
}
export type api_file_cover_resp = col_node;


export type api_file_delete_req = {
    id: string,
}
export type api_file_delete_resp = col_node;


export type api_local_ls_req = {
    path: string,
};
export type api_local_ls_resp = api_local_file_statement[];
export type api_local_rm_req = {
    path: string,
};
export type api_local_rm_resp = {} | null;
export type api_local_mv_req = {
    from: string,
    to: string,
};
export type api_local_mv_resp = {} | null;
export type api_local_cp_req = {
    from: string,
    to: string,
};
export type api_local_cp_resp = {} | null;
export type api_local_import_req = {
    sourceDir: string,
    targetNodeId: string,
};
export type api_local_import_resp = {} | null;

export type api_local_file_statement = {
    name: string,
    path: string,
    timeModified: string,
    timeCreated: string,
    isFile: boolean,
    isDir: boolean,
    type: string,
    size: number,
}



