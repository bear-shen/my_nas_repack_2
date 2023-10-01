import {col_file_with_path, col_node, col_queue, col_tag, col_tag_group, col_user, col_user_group, type_file} from './Database';

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
    _selected?: boolean,
    //l t r b
    _offsets?: number[],
    _renaming?: boolean,
    _tagging?: boolean,
    _dom?: HTMLElement,
} & col_node

export type api_file_list_resp = {
    path: api_node_col[],
    // path: col_node[],
    list: api_node_col[],
}

/*export type api_file_list_req = {
    keyword?: string,
    type?: type_file | string,
    sort?: string,
    pid?: string,
    tid?: string,
    deleted?: string,
    favourite?: string,
    no_file?: string,
    no_tag?: string,
    with_crumb?: string,
    limit?: string,
} & { [key: string]: any }*/

export type api_file_list_req = {
    mode?: 'directory' | 'search' | 'tag' | string,
    pid?: string,
    keyword?: string,
    tag_id?: string,
    dir_only?: '1' | '' | string,
    //
    node_type?: type_file | string,
    //
    // sort?: string,
    // detail: string,
    with?: 'file' | 'tag' | 'crumb' | 'none' | string,
    group?: 'directory' | 'deleted' | 'favourite' | string,
    // favourite?: string,
    // no_file?: string,
    // no_tag?: string,
    // with_crumb?: string,
    limit?: string,
}

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

export type api_file_rebuild_req = {
    id: string,
}
export type api_file_rebuild_resp = col_node;
export type api_file_bath_rename_req = {
    list: string,
    // pattern: string,
    // sort: string,
}
export type api_file_bath_rename_resp = col_node[];
export type api_file_bath_delete_req = {
    id_list: string,
}
export type api_file_bath_delete_resp = col_node[];
export type api_file_bath_move_req = {
    id_list: string,
    id_parent: string,
}
export type api_file_bath_move_resp = col_node[];


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


export type api_user_group_col = {
    user: col_user[],
} & col_user_group;

export type api_user_group_list_req = {
    keyword?: string,
    is_del?: string,
} & { [key: string]: any };

export type api_user_group_list_resp =
    api_user_group_col[];

export type api_user_group_del_req = {
    id?: string,
} & { [key: string]: any };
export type api_user_group_del_resp = {};

export type api_user_group_mod_req = {
    id?: string,
    title?: string,
    description?: string,
    admin?: string,
    status?: string,
    auth?: string,
} & { [key: string]: any };

export type api_user_group_mod_resp = col_user_group;


export type api_user_col = col_user;

export type api_user_list_req = {
    keyword?: string,
    id_group?: string,
    is_del?: string,
} & { [key: string]: any };

export type api_user_list_resp =
    api_user_col[];

export type api_user_del_req = {
    id?: string,
} & { [key: string]: any };
export type api_user_del_resp = {};

export type api_user_mod_req = {
    id?: string,
    id_group?: string,
    name?: string,
    mail?: string,
    password?: string,
    status?: string,
} & { [key: string]: any };

export type api_user_mod_resp = api_user_mod_req;

export type api_setting_col = {
    id?: number,
    name?: string,
    //接口不转码
    value?: string,
    time_create?: string,
    time_update?: string,
};

export type api_setting_list_req = {} & { [key: string]: any };

export type api_setting_list_resp =
    api_setting_col[];

export type api_setting_del_req = {
    id?: string,
} & { [key: string]: any };
export type api_setting_del_resp = {};

export type api_setting_mod_req = {
    id?: string,
    name?: string,
    value?: string,
    // status?: string,
} & { [key: string]: any };

export type api_setting_mod_resp = api_setting_mod_req;


export type api_queue_col = col_queue;

export type api_queue_list_req = {
    page: string,
    id: string,
    status: string,
    type: string,
} & { [key: string]: any };

export type api_queue_list_resp =
    api_queue_col[];

export type api_file_checksum_resp =
    api_queue_col[];

export type api_file_checksum_req = {
    id_list: string,
} & { [key: string]: any };



