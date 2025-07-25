import {throwError} from "@/lib/Helper";
import type {JSZipObject} from "jszip";
import JSZip from 'jszip';

export type StreamDownloadInputFileType = {
        //子目录的路径
        path: string,
        //文件的URL
        url: string,
        size: number,
        type: 'directory' | string,
    }
    & { [key: string]: any }
    ;

type FileType = StreamDownloadInputFileType & {
    //对应目录的path
    _dirName: string,
    _dirArr: string[],
    _baseName: string,
};

/**
 * 后端接口基本只有纯post+json，所以想了下还是做到前端来
 *
 * new
 *   mkNodeList
 *   buildTitle
 * prepare
 *   getSubList
 *     querySubList
 *       mkNodeList
 *         [loop]
 * download
 *   downloadFile
 *     downloadProcess
 *       [xhr]
 * build
 * complete
 */
export class FileStreamDownloaderV2 {
    public nodeList: FileType[];
    public querySubList: null | ((pNode: StreamDownloadInputFileType) => Promise<StreamDownloadInputFileType[]>);
    //public ws: WritableStream;
    //public payload: Uint8Array;
    public title: string = '';

    public downloadProgressListener: null | ((pre: number, cur: number, total: number, index: number, fileSize: number) => any) = null;
    public downTotal = 0;
    public downPre = 0;
    public downCur = 0;
    //
    public downCurIndex = 0;
    public downSize = 0;

    private fileMap: Map<string, ArrayBuffer> = new Map();
    private zipRoot?: JSZip;

    constructor(
        nodeList: StreamDownloadInputFileType[]
        , querySubList?: (pNode: StreamDownloadInputFileType) => Promise<StreamDownloadInputFileType[]>
    ) {
        // console.info('__construct', nodeList);
        this.nodeList = this.mkNodeList(nodeList);
        this.querySubList = querySubList ?? null;
        this.title = this.buildTitle();
    }

    mkNodeList(nodeList: StreamDownloadInputFileType[]): FileType[] {
        const tList: FileType[] = [];
        nodeList.forEach(node => {
            node.path = node.path.replace(/\/\/*/g, '/').replace(/^[\s\/]+|[\s\/]+$/g, '');
            const pathArr = node.path.split('/');
            const baseName = pathArr.pop();
            if (!baseName) return;
            const dirname = pathArr.join('/');
            const tNode: FileType = Object.assign(node, {
                _dirName: dirname,
                _dirArr: pathArr,
                _baseName: baseName,
            });
            tList.push(tNode);
            if (tNode.size) this.downTotal += tNode.size;
        });
        return tList;
    }

    public async prepare() {
        const resNodeList: FileType[] = [];
        for (let i1 = 0; i1 < this.nodeList.length; i1++) {
            if (this.nodeList[i1].type !== 'directory') continue;
            const subNodeList = await this.getSubList(this.nodeList[i1]);
            subNodeList.forEach(node => resNodeList.push(node));
        }
        resNodeList.forEach(node => this.nodeList.push(node));
        this.downSize = this.nodeList.length;
    }

    private buildTitle() {
        let title = '';
        if (this.nodeList.length == 1) {
            title = this.nodeList[0]._baseName ?? '';
        } else {
            let ttArr: string[] = [];
            for (let i1 = 0; i1 < this.nodeList.length; i1++) {
                ttArr.push(this.nodeList[i1]._baseName ?? '');
                if (i1 > 3) break;
            }
            title = ttArr.join(', ');
        }
        if (title.length > 100) title = title.substring(0, 100) + '…';
        title += '.zip';
        return title;
    }

    private async getSubList(pNode: FileType): Promise<FileType[]> {
        if (!this.querySubList) return [];

        const queryList = await this.querySubList(pNode);
        const nodeList = this.mkNodeList(queryList);
        const resNodeList: FileType[] = [];

        for (let i1 = 0; i1 < nodeList.length; i1++) {
            resNodeList.push(nodeList[i1]);
            if (nodeList[i1].type !== 'directory') continue;
            const subNodeList = await this.getSubList(nodeList[i1]);
            subNodeList.forEach(node => resNodeList.push(node));
        }
        return resNodeList;
    }

    public async download(downloadProgressListener?: (pre: number, cur: number, total: number, index: number, fileSize: number) => any) {
        if (downloadProgressListener)
            this.downloadProgressListener = downloadProgressListener;

        for (let i1 = 0; i1 < this.nodeList.length; i1++) {
            this.downCurIndex += 1;
            const node = this.nodeList[i1];
            if (node.type === 'directory') continue;
            if (!node.url) continue;
            const res = await this.downloadFile(node);
            this.fileMap.set(node.path, res);
            this.downCur = 0;
            this.downPre += node.size;
            if (this.downloadProgressListener)
                this.downloadProgressListener(this.downPre, this.downCur, this.downTotal, this.downCurIndex, this.downSize);
        }
        // console.info(this.fileMap);
    }

    public downloadProcess(ev: ProgressEvent) {
        // console.info(request, ev);
        this.downCur = ev.loaded;
        if (this.downloadProgressListener)
            this.downloadProgressListener(this.downPre, this.downCur, this.downTotal, this.downCurIndex, this.downSize);
    }

    public downloadFile(node: FileType): Promise<ArrayBuffer> {
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
            xhr.onprogress = (ev: ProgressEvent) => {
                this.downCur = ev.loaded;
                if (this.downloadProgressListener)
                    this.downloadProgressListener(this.downPre, this.downCur, this.downTotal, this.downCurIndex, this.downSize);
            };
            xhr.open('GET', node.url);
            xhr.send();
        })
    }

    public async build() {
        this.zipRoot = new JSZip();
        const folderMap = new Map<string, JSZipObject | JSZip>();
        //先构造目录
        this.nodeList.forEach(node => {
            if (node.type !== 'directory') return;
            const path = '/' + node.path;
            folderMap.set(path, (this.zipRoot as JSZip).folder(path) as JSZip);
        });
        this.nodeList.forEach(node => {
            if (node.type === 'directory') return;
            const fileBuffer = this.fileMap.get(node.path);
            if (!fileBuffer) return;
            const path = '/' + node.path;
            (this.zipRoot as JSZip).file(path, fileBuffer);
        });
    }

    public complete() {
        return new Promise(resolve => {
            this.zipRoot?.generateAsync({type: "blob"}).then((content) => {
                let link = document.createElement('a');
                link.style.display = 'none';
                link.href = URL.createObjectURL(content);
                link.target = '_blank';
                link.setAttribute('download', this.title)
                link.click();
                resolve(true);
            });
        })
    }

    public completeFile() {
        return new Promise(resolve => {
            this.fileMap.forEach((v, k) => {
                console.info(v, k);
                const blob = new Blob([v]);
                let link = document.createElement('a');
                link.style.display = 'none';
                link.href = URL.createObjectURL(blob);
                link.target = '_blank';
                link.setAttribute('download', k);
                link.click();
            });
            resolve(true);
        })
    }
}
