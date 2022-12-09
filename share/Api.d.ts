import { col_file, col_node, col_tag, col_tag_group } from './Database';

export type api_node_col = {
    file?: {
        preview?: col_file,
        normal?: col_file,
        cover?: col_file,
        raw?: col_file,
        [key: string]: col_file | undefined,
    },
    tag: (
        col_tag_group & {
            tag: col_tag[]
        }
    )[]
} & col_node
export type api_file_list_resp = {
    path: col_node[],
    list: api_node_col[],
}
export type api_file_list_req = {
    keyword: string,
    type: string,
    sort: string,
    pid: string,
} & { [key: string]: any }