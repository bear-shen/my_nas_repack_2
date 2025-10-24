import {col_node_file_index,col_favourite, col_favourite_group, col_node, col_queue, col_share, col_tag, col_tag_group, col_user, col_user_group, type_file} from './Database';

export type api_node_col = {
    rate?: number,
    is_file?: number,
    list_fav?: number[],
    //初版的设计是分开存储方便遍历
    //后来又改了
    //现在总之放crumb_node了
    // tree?: { id: number, title: string }[],
    // file?: {
    //     preview?: string,
    //     normal?: string,
    //     cover?: string,
    //     raw?: string,
    // },
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
    _in_screen?: boolean,
    _sort_index?: string,
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

/**
 * directory
 *      pid
 * search
 *      pid
 *      keyword
 * tag
 *      pid
 *      tag_id
 * id_iterate
 *      keyword
 * favourite
 *      fav_id
 * */
export type api_file_list_req = {
    id_fav?: string,
    //页面上会有两种模式
    // 一种是搜索，使用搜索条的内容覆盖
    // 一种是目录
    // 主要是搜索自带了级联的选项，所以有必要做一个区分
    // 所以search还是得留着，后端和directory等价，只是专供前端判断
    mode?:
        'directory'
        | 'search'
        // | 'tag'
        // | 'favourite'
        | 'id_iterate'
        | string,
    keyword?: string,
    id_dir?: string,
    id_tag?: string,
    tag_or?: string,
    //
    //这个只是表示在当前文件夹中搜索
    cascade_dir?: '1' | '0' | string,
    //
    node_type?: type_file | 'any' | 'file'| 'media',
    // sort?: string,
    rate?: string,
    // detail: string,
    status?: 'normal' | 'deleted',
    // favourite?: string,
    // no_file?: string,
    // no_tag?: string,
    // with_crumb?: string,
    limit?: string,
    //非搜索项
    with?: 'file' | 'tag' | 'crumb' | 'none' | string,
}

export type api_user_login_req = {
    username: string,
    password: string,
}
export type api_user_login_resp = {
    token: string,
    group: col_user_group,
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
    id_node: string,
    id_target: string,
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

export type api_setting_front_conf = {
    // origin?: string,
    onlyoffice_enabled?: string,
    // onlyoffice_api_src?: string,
    onlyoffice_origin?: string,
    onlyoffice_jwt_secret?: string,
    nas_origin?: string,
    link_nav?: string[][],
    // status?: string,
} & { [key: string]: any };


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


export type api_favourite_del_req = {
    id?: string,
} & { [key: string]: any };
export type api_favourite_del_resp = {};

export type api_favourite_attach_req = {
    id_node?: string,
    list_group?: string,
} & { [key: string]: any };

export type api_favourite_attach_resp = col_favourite;

export type api_favourite_bath_attach_req = {
    node_id_list?: string,
    list_group?: string,
} & { [key: string]: any };

export type api_favourite_bath_attach_resp = col_favourite;

export type api_favourite_group_list_req = {
    id?: string,
    keyword?: string,
    is_del?: string,
} & { [key: string]: any };

export type api_favourite_group_col = col_favourite_group & {
    node?: col_node,
    tag?: api_tag_col[],
};
export type api_favourite_group_list_resp = api_favourite_group_col[];

export type api_favourite_group_del_req = {
    id?: string,
} & { [key: string]: any };
export type api_favourite_group_del_resp = {};

export type api_favourite_group_mod_req = {
    id?: string,
    title?: string,
    status?: string,
    auto?: string,
    meta?: string,
} & { [key: string]: any };

export type api_favourite_group_mod_resp = api_favourite_group_mod_req;

export type api_rate_attach_req = {
    node_id_list?: string,
    rate?: string,
} & { [key: string]: any };

export type api_rate_attach_resp = col_node;

export type api_statistics_node = {
    suffix: { suffix: string, size: number, count: number }[],
    directory: {
        id: number,
        title: string,
        path: string,
        nodes: { count: number, },
        files: { count: number, size: number, },
        raw: { count: number, size: number, },
        normal: { count: number, size: number, },
        preview: { count: number, size: number, },
        cover: { count: number, size: number, },
    }[],
};

export type api_import_eht_tag_req = {
    id_list?: string,
} & { [key: string]: any };

export type api_sync_jriver_rate_req = {
    id_node?: string,
    // payload?: string,//file
} & { [key: string]: any };


export type api_share_list_req = {
    status: string,
    page: string,
} & col_share & { [key: string]: any };
export type api_share_list_resp = col_share
    & { node?: col_node[] }
    & { user?: col_user }
    & { [key: string]: any };

export type api_share_set_req = {
    // id_user?: number,
    node_id_list?: string,
    status?: string,
    time_to?: string,
} & { [key: string]: any };

export type api_share_del_req = {
    id?: string,
} & { [key: string]: any };

export type api_share_node_list_req = {
    id?: string,
    id_node?: string,
} & { [key: string]: any };


export type api_share_node_type=Required<{
    id:number,
    id_parent:number,
    type:type_file,
    title:string,
    node_id_list:number[],
    file_index:{
        rel?: number,
            cover?: col_node_file_index,
            preview?: col_node_file_index,
            normal?: col_node_file_index,
            raw?: col_node_file_index,
        },
    rel_node_id:number,
    }> & api_node_col;

export type api_share_node_list_resp = {
    id?: string,
    user?: col_user,
    node: api_share_node_type[],
    cur: api_share_node_type,
    parent?: api_share_node_type,
} & { [key: string]: any };

export type api_share_get_req = {
    id?: string,
    id_node?: string,
    index?: string,
} & { [key: string]: any };





