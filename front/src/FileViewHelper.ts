/**
 * @notice 得拆一下
 * */
import type {Ref} from "vue";
import {ref,} from "vue";
import type {api_favourite_attach_resp, api_favourite_group_list_resp, api_file_bath_delete_resp, api_file_bath_move_req, api_file_bath_move_resp, api_file_checksum_resp, api_file_cover_resp, api_file_delete_resp, api_file_list_req, api_file_mov_req, api_file_mov_resp, api_file_rebuild_resp, api_node_col, api_tag_list_resp} from "../../share/Api";
import type {ModalConstruct} from "@/modal";
import {query} from "@/Helper";
import GenFunc from "../../share/GenFunc";
import {useModalStore} from "@/stores/modalStore";
import type {RouteLocationNormalizedLoaded, Router} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {useContextStore} from "@/stores/useContext";

const modalStore = useModalStore();
// const router = useRouter();
// const route = useRoute();
const localConfigure = useLocalConfigureStore();
const contextStore = useContextStore();

export const timeoutDef = {
    sort: 50,
    selectEvt: 50,
    clearEvt: 100,
    //zzz
    lazyLoad: 200,
    offsetDebounce: 100,
    offsetUIDebounce: 500,
};

let opModuleVal: null | opModule;

/*
*
* 操作的基础库
* 应当在调用getList之前实例化
* 因为getList需要reloadOffset
*
* */
export class opModule {
    public nodeList: Ref<api_node_col[]> = ref([]);
    public getList: () => any;
    public route: RouteLocationNormalizedLoaded;
    public router: Router;
    public contentDOM: HTMLElement;
    public emitGo: (type: string, code: any) => any;
    //这个其实没有用，而且切换路由的时候需要手动更新
    // 因为是直接赋值的 queryData = Object.assign({
    // public queryData: { [key: string]: any };

    constructor(
        config: {
            // nodeList: Ref<api_node_col[]>,
            route: RouteLocationNormalizedLoaded,
            router: Router,
            contentDOM: HTMLElement,
            getList: () => any,
            emitGo: (type: string, code: any) => any,
            // queryData: { [key: string]: any },
        }
    ) {
        console.info(config);
        this.contentDOM = config.contentDOM;
        this.getList = config.getList;
        this.route = config.route;
        this.router = config.router;
        this.emitGo = config.emitGo;
        // this.nodeList = config.nodeList;
        // this.queryData = config.queryData;
        //必须这么写否则无法解绑
        this.contentMenuEvt = this.contentMenuEvt.bind(this);
        this.mouseDownEvt = this.mouseDownEvt.bind(this);
        this.mouseMoveEvt = this.mouseMoveEvt.bind(this);
        this.mouseUpEvt = this.mouseUpEvt.bind(this);
        this.keymap = this.keymap.bind(this);
        this.reloadOffset = this.reloadOffset.bind(this);
        addEventListener('contextmenu', this.contentMenuEvt);
        addEventListener('mousedown', this.mouseDownEvt);
        addEventListener('mousemove', this.mouseMoveEvt);
        addEventListener('mouseup', this.mouseUpEvt);
        addEventListener('keydown', this.keymap);
        addEventListener("resize", this.reloadOffset);
        opModuleVal = this;
    }

    public destructor() {
        console.info('destructor loaded');
        removeEventListener('contextmenu', this.contentMenuEvt);
        removeEventListener('mousedown', this.mouseDownEvt);
        removeEventListener('mousemove', this.mouseMoveEvt);
        removeEventListener('mouseup', this.mouseUpEvt);
        removeEventListener('keydown', this.keymap);
        removeEventListener("resize", this.reloadOffset);
        opModuleVal = null;
    }

    public setList(list: api_node_col[]) {
        this.nodeList.value = list;
        this.reloadOffset(undefined, timeoutDef.offsetDebounce)
    }

    public selecting = false;
    public selectingMovEvtCount = 0;
    public selectingOffset = [[0, 0,], [0, 0,],];
    public preSelectedNodeIndexSet = new Set<number>();
    public selectingKeyDef = '';

    public showSelectionOp: Ref<boolean> = ref(false);
//shift用的
    public lastSelectIndex = -1;

    /**
     * 仅仅在内容页面中启用多选
     * 事件流程大致是
     * mouseDown
     *  记录当前已经选中的文件
     *  记录按键
     *  记录起点
     * mouseMove 单击有几率触发
     *  计算和添加所选的文件
     * mouseUp
     *  清除状态
     * click 长按情况下不会触发
     *  实际上也就是为了mouseMove不工作的情况做个兜底
     *    但是看了看好像没有特别的必要
     *    日后考虑删掉
     * @todo click是先写的所以才会有这种问题，后期考虑一下合并
     * */
    public inDetailView(e: MouseEvent): boolean {
        // console.info(e);
        let inDetail = false;
        let prop = e.target as Element;
        while (prop) {
            // console.info(prop);
            // console.info(prop.classList);
            // console.info(prop.classList.contains('content_detail'));
            // if(props.tagName)
            //收藏夹单独处理一下
            if (prop.classList.contains('list_fav')) {
                inDetail = true;
                break;
            }
            if (prop.classList.contains('view_fav')) {
                inDetail = false;
                break;
            }
            //文件夹部分
            if (prop.classList.contains('content_meta')) {
                inDetail = false;
                break;
            }
            if (prop.classList.contains('fr_content')) {
                inDetail = true;
                break;
            }
            if (!prop.parentElement) break;
            prop = prop.parentElement;
            // if(prop.classList)
        }
        return inDetail;
    }

    public inTaggingDOM(e: MouseEvent): boolean {
        // console.info(e);
        let inDetail = false;
        let prop = e.target as Element;
        while (prop) {
            if (prop.classList.contains('content_detail')) return false;
            if (prop.classList.contains('tag_list')) {
                inDetail = true;
                break;
            }
            if (!prop.parentElement) break;
            prop = prop.parentElement;
        }
        return inDetail;
    }

    public mouseDownEvt(e: MouseEvent) {
        // console.info('here');
        // console.info(this);
        // console.info(this.inDetailView);
        if (!this.inDetailView(e)) return;
        // console.info('here');
        // if (inTaggingDOM(e)) return;
        // console.info(e);
        // console.info(inDetail(e));
        // console.info('mouseDownEvt');
        // e.stopPropagation();
        //左键，屏蔽右键可以左键点了右键选，不屏蔽的话只能右键选或者ctrl选
        //但是屏蔽了体验感觉反而不大好
        // if (e.button !== 0) return;
        e.preventDefault();
        this.selectingOffset[0] = [e.x + (this.contentDOM?.scrollLeft ?? 0), e.y + (this.contentDOM?.scrollTop ?? 0),];
        this.selectingOffset[1] = [e.x + (this.contentDOM?.scrollLeft ?? 0), e.y + (this.contentDOM?.scrollTop ?? 0),];
        this.preSelectedNodeIndexSet.clear();
        this.nodeList.value.forEach((node, index) => {
            if (node._selected)
                this.preSelectedNodeIndexSet.add(index)
        });
        this.selecting = true;
        this.selectingMovEvtCount = 0;
        // setTimeout(() => selecting = true, 50);
        //
        const selIndexLs = this.getSelection(this.selectingOffset);
        //
        const keyMap = [];
        if (e.ctrlKey) keyMap.push('ctrl');
        if (e.shiftKey) keyMap.push('shift');
        // if (e.altKey) keyMap.push('alt');
        // if (e.metaKey) keyMap.push('meta');
        this.selectingKeyDef = keyMap.join('_');
        let newSelectIndex = -1;
        const selIndexArr = Array.from(selIndexLs);
        if (selIndexArr.length)
            newSelectIndex = selIndexArr.pop() ?? -1;
        // console.info(this.lastSelectIndex, newSelectIndex);
        switch (this.selectingKeyDef) {
            case 'shift':
                this.preSelectedNodeIndexSet.clear();
            case 'ctrl_shift':
                if (newSelectIndex == -1) break;
                if (this.lastSelectIndex == -1) break;
                let from = Math.min(newSelectIndex, this.lastSelectIndex);
                let to = Math.max(newSelectIndex, this.lastSelectIndex);
                for (let i1 = from; i1 <= to; i1++) {
                    this.preSelectedNodeIndexSet.add(i1);
                }
                break;
            default:
                this.preSelectedNodeIndexSet.clear();
                break;
            case 'ctrl':
                break;
        }
        this.nodeList.value.forEach((node, index) => {
            let selected = false;
            if (selIndexLs.has(index)) selected = true;
            if (this.preSelectedNodeIndexSet.has(index)) selected = true;
            node._selected = selected;
        });
        this.lastSelectIndex = newSelectIndex;
        //只要选中就显示吧
        this.showSelectionOp.value = this.preSelectedNodeIndexSet.size + selIndexLs.size > 0;
        // console.warn('this.mouseDownEvt() end');
    }

    public mouseMoveEvt(e: MouseEvent) {
        if (!this.selecting) return;
        //有时候click会触发到mousemove事件，做个防抖
        this.selectingMovEvtCount += 1;
        if (this.selectingMovEvtCount < 10) return;
        // console.info('mouseMoveEvt', selecting);
        e.preventDefault();
        this.selectingOffset[1] = [e.x + (this.contentDOM?.scrollLeft ?? 0), e.y + (this.contentDOM?.scrollTop ?? 0),];
        // console.info(selIndexLs);
        const selIndexLs = this.getSelection(this.selectingOffset);
        this.nodeList.value.forEach((node, index) => {
            let selected = false;
            if (selIndexLs.has(index)) selected = true;
            if (this.preSelectedNodeIndexSet.has(index)) selected = true;
            node._selected = selected;
            // console.info(node._selected);
        });
        //lastSelectIndex计算
        const subSelIndexLs = this.getSelection([this.selectingOffset[1], this.selectingOffset[1]]);
        // console.info(subSelIndexLs);
        if (subSelIndexLs.size)
            this.lastSelectIndex = Array.from(subSelIndexLs).pop() ?? -1;
        //只要选中就显示吧
        this.showSelectionOp.value = this.preSelectedNodeIndexSet.size + selIndexLs.size > 0;
    }

    public mouseUpEvt(e: MouseEvent) {
        // return;
        if (!this.selecting) return;
        // console.info('mouseUpEvt');
        e.preventDefault();
        // e.stopPropagation();
        setTimeout(() => {
            this.selecting = false;
            this.selectingMovEvtCount = 0;
            this.selectingOffset = [[0, 0,], [0, 0,],];
            this.preSelectedNodeIndexSet.clear();
            this.selectingKeyDef = '';
        }, timeoutDef.selectEvt);
    }

    public contentMenuEvt(e: MouseEvent) {
        if (!this.inDetailView(e)) return;
        // console.info('this.contentMenuEvt');
        // console.info(this.inDetailView(e));
        let inRecycle = this.route.name === 'Recycle';
        let selRes: { nodeLs: api_node_col[], idSet: Set<number> } = this.getSelected();
        if (!selRes.nodeLs || !selRes.nodeLs.length) return;
        let isBath = selRes.nodeLs.length !== 1;
        const nodeLs = selRes.nodeLs;
        const idSet = selRes.idSet;
        console.info(isBath, nodeLs);
        //
        e.preventDefault();
        e.stopPropagation();
        //
        contextStore.trigger([
            {
                title: 'Open',
                auth: 'user',
                method: (e: MouseEvent) => {
                    console.info('Open', e);
                    if (isBath) opFunctionModule.op_bath_browser(idSet, nodeLs);
                    else this.emitGo('node', nodeLs[0].id);
                },
            },
            {
                title: 'Download',
                auth: isBath ? 'none' : 'user',
                method: (e: MouseEvent) => {
                    console.info('Download', e);
                    // nodeLs.forEach(node => {
                    const node = nodeLs[0];
                    let href = node?.file?.raw?.path;
                    let title = node?.title ?? '';
                    if (!href) return;
                    let link = document.createElement('a');
                    link.style.display = 'none';
                    link.href = href + '?filename=' + title;
                    link.target = '_blank';
                    link.setAttribute('download', title)
                    link.click();
                    // });
                },
            },
            {
                title: 'Rename',
                auth: 'user',
                method: (e: MouseEvent) => {
                    console.info('Rename', e);
                    if (isBath) opFunctionModule.op_bath_rename(idSet, nodeLs);
                    else opFunctionModule.op_rename(nodeLs[0]);
                },
            },
            {
                title: 'Move',
                auth: 'user',
                method: (e: MouseEvent) => {
                    console.info('Move', e);
                    if (isBath) opFunctionModule.op_bath_move(idSet, nodeLs);
                    else opFunctionModule.op_move(nodeLs[0]);
                },
            },
            {
                title: 'Delete',
                auth: !inRecycle ? 'user' : 'none',
                method: (e: MouseEvent) => {
                    console.info('Delete', e);
                    if (isBath) opFunctionModule.op_bath_delete(idSet, nodeLs);
                    else opFunctionModule.op_delete(nodeLs[0]);

                },
            },
            {
                title: 'Delete Forever',
                auth: inRecycle ? 'user' : 'none',
                method: (e: MouseEvent) => {
                    console.info('Delete Forever', e);
                    if (isBath) opFunctionModule.op_bath_delete_forever(idSet, nodeLs);
                    else opFunctionModule.op_delete_forever(nodeLs[0]);
                },
            },
            {
                title: 'Favourite',
                auth: 'user',
                method: (e: MouseEvent) => {
                    console.info('Favourite', e);
                    if (isBath) opFunctionModule.op_bath_favourite(idSet, nodeLs);
                    else opFunctionModule.op_toggle_favourite(nodeLs[0]);
                },
            },
            {
                title: 'Extra',
                auth: 'user',
                method: (e: MouseEvent) => {
                    console.info('Extra', e);
                },
                child: [
                    {
                        title: 'Tagging',
                        auth: 'user',
                        method: (e: MouseEvent) => {
                            console.info('Tagging', e);
                            nodeLs.forEach(node => {
                                opFunctionModule.op_tag(node);
                            });
                        },
                    },
                    {
                        title: 'Set Cover',
                        auth: isBath ? 'none' : 'user',
                        method: (e: MouseEvent) => {
                            console.info('Set Cover', e);

                        },
                    },
                    {
                        title: 'Import EHT',
                        auth: 'user',
                        method: (e: MouseEvent) => {
                            console.info('Import EHT', e);

                        },
                    },
                ],
            },
        ], e);
    }

    public getSelection(selectingOffset: number[][]): Set<number> {
        let retL = selectingOffset[0][0] > selectingOffset[1][0] ? selectingOffset[1][0] : selectingOffset[0][0];
        let retT = selectingOffset[0][1] > selectingOffset[1][1] ? selectingOffset[1][1] : selectingOffset[0][1];
        let retR = selectingOffset[0][0] < selectingOffset[1][0] ? selectingOffset[1][0] : selectingOffset[0][0];
        let retB = selectingOffset[0][1] < selectingOffset[1][1] ? selectingOffset[1][1] : selectingOffset[0][1];
        const selIndexLs = new Set<number>();
        this.nodeList.value.forEach((node, index) => {
            if (!node._offsets) return;
            //有一个点，在选择的矩形内部
            let nodeL: number = node?._offsets[0];
            let nodeT: number = node?._offsets[1];
            let nodeR: number = node?._offsets[2];
            let nodeB: number = node?._offsets[3];
            //左上在矩形中 右下在矩形中 矩形在节点中
            let inH = (nodeL >= retL && nodeL <= retR) || (nodeR >= retL && nodeR <= retR) || (nodeL <= retR && nodeR >= retL);
            let inV = (nodeT >= retT && nodeT <= retB) || (nodeB >= retT && nodeB <= retB) || (nodeT <= retB && nodeB >= retT);
            // if (node.id == 3254) {
            //   console.info(retL, retT, retR, retB, nodeL >= retL, nodeL <= retR, nodeR >= retL, nodeR <= retR);
            //   console.info(nodeL, nodeT, nodeR, nodeB, nodeT >= retT, nodeT <= retB, nodeB >= retT, nodeB <= retB);
            //   console.info(inH);
            //   console.info(inV);
            // }
            if (!inH || !inV) return;
            // node._selected = true;
            selIndexLs.add(index);
        });
        return selIndexLs;
    }

    public clearSelect(e: MouseEvent) {
        // console.info(e);
        if (!(e.target as Element).classList.contains('content_detail')) return;
        // setTimeout(() => {
        // console.warn('clearSelect', selecting)
        // if (selecting) return;
        this.nodeList.value.forEach(item => {
            item._selected = false;
        });
        this.showSelectionOp.value = false;
        // }, timeoutDef.clearEvt);
    }

    public async bathOp(mode: string) {
        let {idSet, nodeLs} = this.getSelected();
        if (!idSet.size) return;
        let queryData: { [key: string]: any };
        let res: any;
        switch (mode) {
            case 'rename':
                await opFunctionModule.op_bath_rename(idSet, nodeLs);
                break;
            case 'move':
                await opFunctionModule.op_bath_move(idSet, nodeLs);
                break;
            case 'delete':
                await opFunctionModule.op_bath_delete(idSet, nodeLs);
                break;
            case 'delete_forever':
                await opFunctionModule.op_bath_delete_forever(idSet, nodeLs);
                break;
            case 'browser':
                await opFunctionModule.op_bath_browser(idSet, nodeLs);
                break;
            case 'favourite':
                await opFunctionModule.op_bath_favourite(idSet, nodeLs);
                break;
        }
    }

    public getSelected() {
        const subNodeLs: api_node_col[] = [];
        const subNodeIdSet: Set<number> = new Set<number>();
        this.nodeList.value.forEach(item => {
            if (!item._selected) return;
            subNodeLs.push(item);
            subNodeIdSet.add(item?.id ?? 0);
        });
        return {
            nodeLs: subNodeLs,
            idSet: subNodeIdSet,
        }
    }

    //-----------------------

    public async keymap(e: KeyboardEvent) {
        // console.info(e);
        // let selCount: number;
        // let selInd: number;
        // let selArr: number[];
        // let query: api_file_list_req;
        // let nodeLs: api_node_col[], idSet: Set<number>;
        let selRes: { nodeLs: api_node_col[], idSet: Set<number> };
        switch (e.key) {
            case 'F2':
                if ((e.target as HTMLElement).tagName !== "BODY") return;
                selRes = this.getSelected();
                await opFunctionModule.op_bath_rename(selRes.idSet, selRes.nodeLs);
                break;
            case 'Delete':
                if ((e.target as HTMLElement).tagName !== "BODY") return;
                selRes = this.getSelected();
                if (this.route.name === 'Recycle') {
                    await opFunctionModule.op_bath_delete_forever(selRes.idSet, selRes.nodeLs);
                } else {
                    await opFunctionModule.op_bath_delete(selRes.idSet, selRes.nodeLs);
                }
                break;
            case 'NumpadEnter':
            case 'Enter':
                if ((e.target as HTMLElement).tagName !== "BODY") return;
                selRes = this.getSelected();
                opFunctionModule.op_bath_browser(selRes.idSet, selRes.nodeLs);
                break;
        }
    }

    public reloadOffset(e?: UIEvent, debounceDelay?: number) {
        if (!debounceDelay) debounceDelay = timeoutDef.offsetUIDebounce;
        // console.info(arguments);
        GenFunc.debounce(() => {
            // 这边因为布局的关系offsetParent直接就是body，不需要过度优化
            // console.info('resize');
            // const baseDOM = document.querySelector('.content_detail') as HTMLElement;
            // if (!baseDOM) return;
            // const baseX = GenFunc.nodeOffsetX(baseDOM);
            // const baseY = GenFunc.nodeOffsetY(baseDOM);
            //
            this.nodeList.value.forEach(node => {
                if (!node._dom) return;
                const dom = node._dom;
                // console.info(evt);
                let l = 0, t = 0, r = 0, b = 0;
                l = GenFunc.nodeOffsetX(dom);
                t = GenFunc.nodeOffsetY(dom);
                r = l + dom.offsetWidth;
                b = t + dom.offsetHeight;
                node._offsets = [l, t, r, b,];
                // console.info(node.id, node._dom, node._offsets);
            });
        }, debounceDelay, `debounce_node_resize`);
    }

    public go(ext: api_file_list_req) {
        if (!ext.tag_id) ext.tag_id = "";
        if (!ext.keyword) ext.keyword = "";
        if (!ext.node_type) ext.node_type = "";
        const tQuery = Object.assign({
            mode: "",
            pid: "",
            keyword: "",
            tag_id: "",
            node_type: "",
            dir_only: "",
            with: "",
            group: "",
        }, ext);
        this.router.push({
            path: this.route.path,
            query: tQuery,
        });
    }

}

export class opFunctionModule {
    public static async op_download(node: api_node_col) {
        let filePath = node.file?.raw?.path;
        if (!filePath) return;
        window.open(`${filePath}?filename=${node.title}`);
    }

    public static async op_rename(node: api_node_col) {
        if (node._renaming) {
            console.info(node.title, node.description, node);
            // console.info(node);
            const formData = new FormData();
            formData.set('id', `${node.id}`);
            formData.set('title', node.title ?? '');
            formData.set('description', node.description ?? '');
            const res = await query<api_file_mov_resp>('file/mod', formData);
            if (opModuleVal) opModuleVal.emitGo("go", 'reload');
        }
        node._renaming = !node._renaming;
        setTimeout(() => {
            let tDOM = document.body.querySelector('[contenteditable="true"]') as HTMLElement;
            if (tDOM) tDOM.focus();
        }, 50)
    }

    public static async op_bath_rename(idSet: Set<number>, nodeLs: api_node_col[]) {
        modalStore.set({
            title: `bath rename`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 275,
            minW: 400,
            minH: 275,
            // h: 160,
            allow_resize: true,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            component: [
                {
                    componentName: "renameUtil",
                    data: {
                        node_list: nodeLs,
                        callback: () => {          //同步回列表
                            if (opModuleVal) opModuleVal.getList();
                        }
                    }
                },],
        } as ModalConstruct);
        return;
    }

    public static async op_move(node: api_node_col) {
        modalStore.set({
            title: `locator | move ${node.title} to:`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 60,
            minW: 400,
            minH: 60,
            // h: 160,
            allow_resize: true,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            // text: "this is text",
            component: [
                {
                    componentName: "locator",
                    data: {
                        query: {
                            type: 'directory',
                        } as api_file_list_req,
                        call: async (node: api_node_col) => {
                            console.info(node);
                            const formData = new FormData();
                            formData.set('node_id', `${node.id}`);
                            formData.set('target_id', `${node.id}`);
                            const res = await query<api_file_mov_req>('file/mov', formData);
                            if (opModuleVal) opModuleVal.emitGo("go", 'reload');
                        }
                    },
                },
            ],
        });
        //
    }

    public static async op_bath_move(idSet: Set<number>, nodeLs?: api_node_col[]) {
        modalStore.set({
            title: `locator | move ${idSet.size} files to:`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 60,
            minW: 400,
            minH: 60,
            // h: 160,
            allow_resize: true,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            // text: "this is text",
            component: [
                {
                    componentName: "locator",
                    data: {
                        query: {
                            type: 'directory',
                        } as api_file_list_req,
                        call: async (targetNode: api_node_col) => {
                            // console.info(targetNode);
                            const queryData: api_file_bath_move_req = {
                                id_list: Array.from(idSet).join(','),
                                id_parent: `${targetNode.id}`,
                                // with: 'file',
                            };
                            const res = await query<api_file_bath_move_resp>("file/bath_move", queryData);
                            //同步回列表
                            if (opModuleVal) opModuleVal.getList();
                            if (!res) return;
                            return;
                        }
                    },
                },
            ],
        } as ModalConstruct);
    }

    public static async op_delete(node: api_node_col) {
        const formData = new FormData();
        formData.set('id', `${node.id}`);
        const res = await query<api_file_delete_resp>('file/delete', formData);
        if (opModuleVal) opModuleVal.emitGo("go", 'reload');
        return res;
    }

    public static async op_bath_delete(idSet: Set<number>, nodeLs?: api_node_col[]) {
        modalStore.set({
            title: `confirm to delete ${idSet.size} files`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 100,
            minW: 400,
            minH: 100,
            // h: 160,
            allow_resize: false,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            text: "conform to delete",
            callback: {
                confirm: async (modal) => {
                    // console.info(modal);
                    // return;
                    const queryData = {
                        id_list: Array.from(idSet).join(',')
                    };
                    const res = await query<api_file_bath_delete_resp>("file/bath_delete", queryData);
                    //同步回列表
                    if (opModuleVal) opModuleVal.getList();
                    if (!res) return;
                },
            },
        } as ModalConstruct);
    }

    public static async op_delete_forever(node: api_node_col) {
        const formData = new FormData();
        formData.set('id', `${node.id}`);
        const res = await query<api_file_delete_resp>('file/delete_forever', formData);
        if (opModuleVal) opModuleVal.emitGo("go", 'reload');
        return res;
    }

    public static async op_bath_delete_forever(idSet: Set<number>, nodeLs?: api_node_col[]) {
        // console.warn('op_bath_delete_forever');
        modalStore.set({
            title: `confirm to delete ${idSet.size} files forever`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 100,
            minW: 400,
            minH: 100,
            // h: 160,
            allow_resize: false,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            text: "conform to delete forever",
            callback: {
                confirm: async (modal) => {
                    // console.warn('op_bath_delete_forever confirm');
                    const queryData = {
                        id_list: Array.from(idSet).join(',')
                    };
                    const res = await query<api_file_bath_delete_resp>("file/bath_delete_forever", queryData);
                    //同步回列表
                    if (opModuleVal) opModuleVal.getList();
                    if (!res) return;
                },
            },
        } as ModalConstruct);
    }

    public static async op_toggle_favourite(node: api_node_col) {
        const favGroupLs = await query<api_favourite_group_list_resp>("favourite_group/get", {});

        const favGroupOpts: { [key: string]: string } = {};
        if (favGroupLs) {
            favGroupLs.forEach((row) => {
                favGroupOpts[row.id ?? 0] = row.title ?? '';
            })
        }
        modalStore.set({
            title: `select fav group:`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 150,
            minW: 400,
            minH: 150,
            // h: 160,
            allow_resize: true,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            // text: "this is text",
            form: [
                {
                    type: "checkbox",
                    label: "attach to:",
                    key: "target_group",
                    value: node.list_fav,
                    options: favGroupOpts,
                },
            ],
            callback: {
                submit: async function (modal) {
                    console.info(modal)
                    const groupIdLs = modal.content.form[0].value.join(',');
                    await query<api_favourite_attach_resp>("favourite/attach", {
                        id_node: node.id,
                        list_group: groupIdLs,
                    });

                },
            },
        });
    }

    public static async op_bath_favourite(idSet: Set<number>, nodeLs: api_node_col[]) {
        const favGroupLs = await query<api_favourite_group_list_resp>("favourite_group/get", {});
        const favGroupOpts: { [key: string]: string } = {};
        if (favGroupLs) {
            favGroupLs.forEach((row) => {
                favGroupOpts[row.id ?? 0] = row.title ?? '';
            })
        }
        modalStore.set({
            title: `select fav group:`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 150,
            minW: 400,
            minH: 150,
            // h: 160,
            allow_resize: true,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            // text: "this is text",
            form: [
                {
                    type: "checkbox",
                    label: "attach to:",
                    key: "target_group",
                    value: [],
                    options: favGroupOpts,
                },
            ],
            callback: {
                submit: async function (modal) {
                    // console.info(modal)
                    const groupIdLs = modal.content.form[0].value.join(',');
                    await query<api_favourite_attach_resp>("favourite/bath_attach", {
                        list_node: Array.from(idSet),
                        list_group: groupIdLs,
                    });
                },
            },
        });
    }

    //

    public static async op_bath_browser(idSet: Set<number>, nodeLs: api_node_col[]) {
        let idArr = Array.from(idSet);
        let query: api_file_list_req = {};
        query.with = 'file';
        query.mode = 'id_iterate';
        query.keyword = idArr.join(',');
        // if (idSet.size > 1) {
        // let query = GenFunc.copyObject(this.queryData);
        popupDetail(query, idArr[0]);
        // } else if (idSet.size == 1) {
        //     popupDetail(query, idArr[0]);
        // }
    }

    public static async op_tag(node: api_node_col) {
        if (node._tagging) {
            const tagSet = new Set<number>();
            if (node.tag)
                for (let i1 = 0; i1 < node.tag.length; i1++) {
                    for (let i2 = 0; i2 < node.tag[i1].sub.length; i2++) {
                        const id = node.tag[i1].sub[i2].id;
                        if (id)
                            tagSet.add(id);
                    }
                }
            const formData = new FormData();
            formData.set('id_node', `${node.id}`);
            formData.set('tag_list', Array.from(tagSet).join(','));
            const res = await query<api_tag_list_resp>('tag/attach', formData);
        }
        //
        node._tagging = !node._tagging;
        // console.info(node);
    }

    public static async op_imp_tag_eh(node: api_node_col) {
    }

    public static async op_set_cover(node: api_node_col) {
        const formData = new FormData();
        formData.set('id', `${node.id}`);
        const res = await query<api_file_cover_resp>('file/cover', formData);
        return res;
    }

    public static async op_rebuild(node: api_node_col) {
        const formData = new FormData();
        formData.set('id', `${node.id}`);
        const res = await query<api_file_rebuild_resp>('file/rebuild', formData);
        // emits('go', 'reload');
        return res;
    }

    public static async op_recheck(node: api_node_col) {
        const formData = new FormData();
        const idList = new Set<number>();
        for (const key in node.index_file_id) {
            idList.add(node.index_file_id[key] ?? 0);
        }
        if (!idList.size) return;
        formData.set('id_list', Array.from(idList).join(','));
        const res = await query<api_file_checksum_resp>('file/rehash', formData);
        // emits('go', 'reload');
        return res;
    }

}

export class queryModule {

}

export function popupDetail(queryData: api_file_list_req, curNodeId: number) {
    //双击从 emitGo 进入
    //打开是手动打开
    let w = localConfigure.get("browser_layout_w");
    let h = localConfigure.get("browser_layout_h");
    // console.info(w, h);
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    if (iw < w) w = 0;
    if (ih < h) h = 0;
    // console.info(w, h);
    modalStore.set({
        title: "file browser",
        alpha: false,
        key: "",
        single: false,
        w: w ? w : 400,
        h: h ? h : 400,
        minW: 400,
        minH: 400,
        // h: 160,
        allow_resize: true,
        allow_move: true,
        allow_fullscreen: true,
        auto_focus: false,
        component: [
            {
                componentName: "fileBrowser",
                data: {
                    query: GenFunc.copyObject(queryData),
                    curId: curNodeId,
                },
            },
        ],
        /* callback: {
          close: function (modal) {
            console.info(modal);
          },
        }, */
    });
}

