import { col_file, col_file_with_path, col_node, col_tag, col_tag_group } from './Database';

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
    )[]
} & col_node

export type api_file_list_resp = {
    path: api_node_col[],
    // path: col_node[],
    list: api_node_col[],
}

export type api_file_list_req = {
    keyword?: string,
    type?: string,
    sort?: string,
    pid?: string,
} & { [key: string]: any }