import { FileCol, NodeCol } from "./Database";

export interface API_FILE_LIST_RESP {
    path: NodeCol[],
    list: (NodeCol & {
        file?: {
            preview?: FileCol,
            normal?: FileCol,
            cover?: FileCol,
            raw?: FileCol,
            [key: string]: FileCol | undefined,
        },
    })[],
}
export interface API_FILE_LIST_REQ {
    title: string,
    type: string,
    sort: string,
    pid: string,
}