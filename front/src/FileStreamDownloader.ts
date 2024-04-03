import type {api_file_list_req, api_file_list_resp, api_node_col} from "../../share/Api";
import {query, throwError} from "@/Helper";
import type {JSZipObject} from "jszip";
import * as  JSZip from 'jszip';

//后端接口基本只有纯post+json，所以想了下还是做到前端来
export class FileStreamDownloader {
    public nodeList: api_node_col[];
    public ws: WritableStream;
    public payload: Uint8Array;
    public title: string = '';
    public downTotal = 0;
    public downFile = 0;
    public downCur = 0;
    private fileMap: Map<number, ArrayBuffer> = new Map();
    private zipRoot: JSZip;

    constructor(nodeList: api_node_col[]) {
        // console.info('__construct', nodeList);
        this.nodeList = nodeList;
        this.title = this.buildTitle();
        // this.ws = new WritableStream({
        //     write: (chunk) => {
        //     },
        //     close: () => {
        //     },
        //     abort: (reason: any) => {
        //     },
        // });
    }

    public async prepare() {
        this.nodeList = await this.getFullSubList();
        console.info(this.nodeList);
    }

    public buildTitle() {
        let title = '';
        if (this.nodeList.length == 1) {
            title = this.nodeList[0].title;
        } else {
            let ttArr: string[] = [];
            for (let i1 = 0; i1 < this.nodeList.length; i1++) {
                ttArr.push(this.nodeList[i1].title);
                if (i1 > 3) break;
            }
            title = ttArr.join('，');
        }
        if (title.length > 150) title = title.substring(0, 150) + '…';
        title += '.zip';
        return title;
    }

    public async getFullSubList() {
        const pidSet = new Set<number>();
        this.nodeList.forEach(node => {
            if (node.type === 'directory') pidSet.add(node.id);
        });
        const pidArr = Array.from(pidSet);
        for (let i1 = 0; i1 < pidArr.length; i1++) {
            const pid = pidArr[i1];
            const res = await query<api_file_list_resp>("file/get", Object.assign({
                mode: "",
                pid: "",
                keyword: "",
                tag_id: "",
                node_type: "",
                cascade_dir: "",
                with: "",
                group: "",
                rate: "",
            }, this.query, {
                mode: 'directory',
                cascade_dir: '1',
                pid: pid.toString(),
                with: 'file',
            }) as api_file_list_req);
            // console.info(res);
            if (!res) continue;
            this.nodeList.push(...res.list);
        }
        this.nodeList.sort((a, b) => {
            let kA = a.type === 'directory' ? '0' : '1';
            a.node_id_list.forEach(id => kA += id.toString().padStart(15, '0'))
            let kB = b.type === 'directory' ? '0' : '1';
            b.node_id_list.forEach(id => kB += id.toString().padStart(15, '0'))
            return kA > kB;
        });
        this.nodeList.forEach(node => this.downTotal += node.file_index?.raw?.size ?? 0);
        return this.nodeList;
    }

    public async download() {
        for (let i1 = 0; i1 < this.nodeList.length; i1++) {
            const node = this.nodeList[i1];
            if (!node.file_index?.raw) continue;
            const file = node.file_index?.raw;
            if (!file.path) continue;
            const src = file.path + '?filename=' + node.title;
            // console.info(src);
            if (!src) continue;
            const res = await this.basename(src, this.downloadProcess.bind(this));
            this.fileMap.set(node.id, res);
            this.downCur = 0;
            this.downFile += file.size;
        }
        console.info(this.fileMap);
    }

    public downloadProcess(ev: ProgressEvent) {
        // console.info(request, ev);
        this.downCur = ev.loaded;
    }

    public basename(src: string, progress?: typeof XMLHttpRequest.on): Promise<ArrayBuffer> {
        return new Promise(resolve => {
            const xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.responseType = 'arraybuffer';
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) return;
                if (xhr.status >= 400)
                    return throwError(`${xhr.status}:${xhr.statusText}`);
                resolve(xhr.response as ArrayBuffer);
            };
            if (progress)
                xhr.onprogress = progress;
            xhr.open('GET', src);
            xhr.send();
        })
    }

    public async build() {
        this.zipRoot = new JSZip();
        const folderMap = new Map<number, [string, JSZipObject | JSZip]>();
        //根据层级排序的，所以直接遍历
        this.nodeList.forEach(node => {
            let path = node.title;
            const ifParent = folderMap.get(node.id_parent);
            if (ifParent) {
                path = ifParent[0] + '/' + path;
            }
            if (node.type != 'directory') {
                const fileBuffer = this.fileMap.get(node.id);
                if (!fileBuffer) return;
                folderMap.set(node.id, [path, this.zipRoot.file(path, fileBuffer)]);
            } else {
                folderMap.set(node.id, [path, this.zipRoot.folder(path)]);
            }
        });

    }

    public complete() {
        return new Promise(resolve => {
            this.zipRoot.generateAsync({type: "blob"}).then((content) => {
                let link = document.createElement('a');
                link.style.display = 'none';
                link.href = URL.createObjectURL(content);
                link.target = '_blank';
                link.setAttribute('download', this.title)
                link.click();
                resolve();
            });
        })
    }
}