/**
 * @notice 得拆一下
 * */
import type {Ref} from "vue";
import {ref,} from "vue";
import type {
    api_favourite_attach_resp, api_favourite_group_list_resp, api_file_bath_delete_resp,
    api_file_bath_move_req, api_file_bath_move_resp, api_file_checksum_resp,
    api_file_cover_resp, api_file_delete_resp, api_file_list_req,
    api_file_mov_req, api_file_mov_resp, api_file_rebuild_resp,
    api_node_col, api_rate_attach_resp, api_share_list_resp,
    api_tag_list_resp
}
    from "../../share/Api";
import type {ModalConstruct} from "@/types/modal";
import {mayInPopup, mayTyping, query} from "@/Helper";
import GenFunc from "@/GenFunc";
import {useModalStore} from "@/stores/modalStore";
import type {RouteLocationNormalizedLoaded, Router} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {useContextStore} from "@/stores/useContext";
import {FileStreamDownloader} from "@/FileStreamDownloader";

// const router = useRouter();
// const route = useRoute();
import * as kvStore from '@/IndexedKVStore';
import Config from "@/Config";
import natsort from "natsort";

let opModuleVal: null | opModule;
// const scrollLogKey = 'tosho_scroll_log';
// const scrollLog: Map<string, number[]> = new Map<string, number[]>();

/*
*
* 操作的基础库
* 应当在调用getList之前实例化
* 因为getList需要reloadOffset
*
* */
export class opModule {
    public nodeList: Ref<api_node_col[]> = ref([]);
    public getList: (list?: api_node_col[]) => any;
    public route: RouteLocationNormalizedLoaded;
    public router: Router;
    public contentDOM: HTMLElement;
    public emitGo: (type: string, code?: any) => any;
    //这个其实没有用，而且切换路由的时候需要手动更新
    // 因为是直接赋值的 queryData = Object.assign({
    // public queryData: { [key: string]: any }
    public modalStore: ReturnType<typeof useModalStore>;
    public localConfigure: ReturnType<typeof useLocalConfigureStore>;
    public contextStore: ReturnType<typeof useContextStore>;

    public mode: Ref<string> = ref('');
    public modeKey: string = '';

    public sortVal: Ref<string> = ref('');

    constructor(
        config: {
            // nodeList: Ref<api_node_col[]>,
            route: RouteLocationNormalizedLoaded,
            router: Router,
            contentDOM: HTMLElement,
            getList: () => any,
            emitGo: (type: string, code?: any) => any,
            // queryData: { [key: string]: any },
        }
    ) {
        console.info(config);
        this.contentDOM = config.contentDOM;
        this.getList = config.getList;
        this.route = config.route;
        this.router = config.router;
        this.emitGo = config.emitGo;
//在类的外部初始化会导致一些问题，参考Helper的manualSort
        this.modalStore = useModalStore();
        this.localConfigure = useLocalConfigureStore();
        this.contextStore = useContextStore();
        // this.nodeList = config.nodeList;
        // this.queryData = config.queryData;
        this.mode.value = this.localConfigure.get('file_view_mode') ?? 'detail';
        this.modeKey = this.localConfigure.listen(
            'file_view_mode',
            (v) => (this.mode.value = v)
        );
        this.sortVal = ref(this.localConfigure.get('file_view_sort') ?? 'name_asc');
        //必须这么写否则无法解绑
        this.contextMenuEvt = this.contextMenuEvt.bind(this);
        this.mouseDownEvt = this.mouseDownEvt.bind(this);
        this.mouseMoveEvt = this.mouseMoveEvt.bind(this);
        this.mouseUpEvt = this.mouseUpEvt.bind(this);
        this.keymap = this.keymap.bind(this);
        this.reloadOffset = this.reloadOffset.bind(this);
        this.scrollEvt = this.scrollEvt.bind(this);
        addEventListener('contextmenu', this.contextMenuEvt);
        // addEventListener('mousedown', this.mouseDownEvt);
        // addEventListener('mousemove', this.mouseMoveEvt);
        // addEventListener('mouseup', this.mouseUpEvt);
        addEventListener('pointerdown', this.mouseDownEvt);
        addEventListener('pointermove', this.mouseMoveEvt);
        addEventListener('pointerup', this.mouseUpEvt);
        addEventListener('keydown', this.keymap);
        addEventListener("resize", this.reloadOffset);

        // const ifScrLogExs = localStorage.getItem(scrollLogKey);
        // if (ifScrLogExs) {
        //     let log = JSON.parse(ifScrLogExs);
        //     let indS = log.length - 100;
        //     indS = indS > 0 ? indS : 0;
        //     for (let i1 = indS; i1 < log.length; i1++) {
        //         scrollLog.set(log[i1][0], log[i1][1]);
        //     }
        // }
        this.contentDOM.addEventListener("scroll", this.scrollEvt);
        opModuleVal = this;
    }

    public destructor() {
        console.info('destructor loaded');
        this.localConfigure.release('file_view_mode', this.modeKey);
        removeEventListener('contextmenu', this.contextMenuEvt);
        removeEventListener('mousedown', this.mouseDownEvt);
        removeEventListener('mousemove', this.mouseMoveEvt);
        removeEventListener('mouseup', this.mouseUpEvt);
        removeEventListener('keydown', this.keymap);
        removeEventListener("resize", this.reloadOffset);
        if (this.contentDOM)
            this.contentDOM.removeEventListener("scroll", this.scrollEvt);
        opModuleVal = null;
    }

    public setList(list: api_node_col[]) {
        this.nodeList.value = list;
        setTimeout(() => {
                console.info('setList', list);
                this.reloadOffset(undefined);
            },
            Config.timeouts.offsetDebounce
        )
    }

    //从当前页面的列表上动态删除一些文件，主要是用于免刷新
    public deleteFromList(idList: number[]) {
        const targetList: api_node_col[] = [];
        const idSet = new Set<number>();
        idList.forEach(id => idSet.add(id));
        this.nodeList.value.forEach(node => {
            if (idSet.has(node.id)) return;
            targetList.push(node);
        });
        //当时为啥这么写的？
        // idList.forEach(id => {
        //     for (let i1 = 0; i1 < targetList.length; i1++) {
        //         if (id !== targetList[i1].id) continue;
        //         targetList.splice(i1, 1);
        //         break;
        //     }
        // });
        this.getList(targetList);
    }

    public selecting = false;
    public selectingMovEvtCount = 0;
    public selectingOffset = [[0, 0,], [0, 0,],];
    public preSelectedNodeIndexSet = new Set<number>();
    public selectingKeyDef = '';

    public showSelectionOp: Ref<boolean> = ref(false);
//shift用的
    public lastSelectIndex = -1;

    //
    public reloadOffset_timer: number | ReturnType<typeof setTimeout> = 0;
    public reloadOffset_count: number = 0;

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
        let prop = e.target as HTMLElement;
        while (prop) {
            // console.info(prop);
            // console.info(prop.classList);
            // console.info(prop.classList.contains('content_detail'));
            // if(props.tagName)
            //做一些屏蔽
            // console.info(prop.contentEditable);
            if (prop.contentEditable === 'true') {
                inDetail = false;
                break;
            }
            if (prop.classList.contains('rater')) {
                inDetail = false;
                break;
            }
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
        if (e.button === 1) return;
        // console.info('here');
        // if (inTaggingDOM(e)) return;
        // console.info(e);
        // console.info(inDetail(e));
        // console.info('mouseDownEvt');
        // e.stopPropagation();
        //左键，屏蔽右键可以左键点了右键选，不屏蔽的话只能右键选或者ctrl选
        //但是屏蔽了体验感觉反而不大好
        this.selectingOffset[0] = [e.x + (this.contentDOM?.scrollLeft ?? 0), e.y + (this.contentDOM?.scrollTop ?? 0),];
        this.selectingOffset[1] = [e.x + (this.contentDOM?.scrollLeft ?? 0), e.y + (this.contentDOM?.scrollTop ?? 0),];
        this.preSelectedNodeIndexSet.clear();
        e.preventDefault();
        if (e.button !== 0) return this.rightMouseDownEvt(e);
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
                const from = Math.min(newSelectIndex, this.lastSelectIndex);
                const to = Math.max(newSelectIndex, this.lastSelectIndex);
                for (let i1 = from; i1 <= to; i1++) {
                    if (selIndexLs.has(i1)) continue;
                    this.preSelectedNodeIndexSet.add(i1);
                }
                break;
            default:
                this.preSelectedNodeIndexSet.clear();
                break;
            case 'ctrl':
                break;
        }
        // console.info(Array.from(this.preSelectedNodeIndexSet), Array.from(selIndexLs));
        this.nodeList.value.forEach((node, index) => {
            let selected: number = 0;
            if (this.preSelectedNodeIndexSet.has(index)) selected += 1;
            if (selIndexLs.has(index)) selected += 1;
            // if (node._selected && selected) selected = false;
            //必须===1，不然无法反选
            node._selected = selected === 1;
            // node._selected = selected >0;
            // console.info(node._selected);
        });
        this.lastSelectIndex = newSelectIndex;
        //只要选中就显示吧
        this.showSelectionOp.value = this.preSelectedNodeIndexSet.size + selIndexLs.size > 0;
        // console.warn('this.mouseDownEvt() end');
    }

    public rightMouseDownEvt(e: MouseEvent) {
        // console.info('rightMouseDownEvt');
        //定义一下：
        //如果在当前已经选择的文件上右键，弹出已选文件的右键菜单
        //如果在未选择的文件上右键，选择当前文件再弹出菜单
        const selIndexLs = this.getSelection(this.selectingOffset);
        let inSel = false;
        const preSelectNodeIndexSet = new Set<number>();
        this.nodeList.value.forEach((node, index) => {
            if (!node._selected) return;
            preSelectNodeIndexSet.add(index);
            if (selIndexLs.has(index)) inSel = true;
        });
        if (!inSel) {
            this.preSelectedNodeIndexSet = selIndexLs;
        } else {
            this.preSelectedNodeIndexSet = preSelectNodeIndexSet;
        }
        this.nodeList.value.forEach((node, index) => {
            node._selected = this.preSelectedNodeIndexSet.has(index);
        });
    }

    public mouseMoveEvt(e: MouseEvent) {
        // console.info('mouseMoveEvt', this.selecting);
        if (!this.selecting) return;
        // console.info(e);
        //有时候click会触发到mousemove事件，做个防抖
        this.selectingMovEvtCount += 1;
        if (this.selectingMovEvtCount < 10) return;
        e.preventDefault();
        this.selectingOffset[1] = [e.x + (this.contentDOM?.scrollLeft ?? 0), e.y + (this.contentDOM?.scrollTop ?? 0),];
        // console.info(selIndexLs);
        const selIndexLs = this.getSelection(this.selectingOffset);
        this.nodeList.value.forEach((node, index) => {
            let selected: number = 0;
            if (this.preSelectedNodeIndexSet.has(index)) selected += 1;
            if (selIndexLs.has(index)) selected += 1;
            // if (node._selected && selected) selected = false;
            node._selected = selected === 1;
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
        }, Config.timeouts.selectEvt);
    }

    public async contextMenuEvt(e: MouseEvent) {
        if (!this.inDetailView(e)) return;
        // console.info('this.contextMenuEvt');
        // console.info(this.inDetailView(e));
        let inRecycle = this.route.name === 'Recycle';
        let selRes: { nodeLs: api_node_col[], idSet: Set<number> } = this.getSelected();
        if (!selRes.nodeLs || !selRes.nodeLs.length) return;
        let isBath = selRes.nodeLs.length !== 1;
        const nodeLs = selRes.nodeLs;
        const idSet = selRes.idSet;
        let fileViewMode = this.localConfigure.get("file_view_mode") ?? "detail";
        if (this.route.name !== 'Directory') {
            fileViewMode = 'detail';
        }
        //仅列表页的数据
        let useEditMethods = fileViewMode === 'detail';
        if (this.route.name === 'Recycle') {
            useEditMethods = false;
        }

        // console.info(isBath, nodeLs);
        //
        e.preventDefault();
        e.stopPropagation();
        //
        this.contextStore.trigger([
            {
                title: 'Open',
                auth: 'guest',
                method: async (e: MouseEvent) => {
                    console.info('Open', e);
                    if (isBath) await opFunctionModule.op_bath_browser(idSet, nodeLs);
                    else this.emitGo('node', nodeLs[0].id);
                },
            },
            {
                title: 'Download',
                auth: isBath ? 'none' : (
                    nodeLs[0].type == 'directory' ? 'none' : 'guest'
                ),
                method: (e: MouseEvent) => {
                    console.info('Download', e);
                    // nodeLs.forEach(node => {
                    const node = nodeLs[0];
                    let href = node.file_index?.raw?.path;
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
                title: 'Download Selected',
                auth: isBath ? 'guest' : (
                    nodeLs[0].type == 'directory' ? 'guest' : 'none'
                ),
                method: async (e: MouseEvent) => {
                    console.info('DownloadSelected', e);
                    console.info(this, nodeLs);
                    if (!opModuleVal || !opModuleVal.modalStore) return;
                    //
                    const fd = new FileStreamDownloader(nodeLs);
                    //
                    const resRef: Ref<string> = ref('downloading 0/0 (0%)');
                    const modal = opModuleVal.modalStore.set({
                        title: fd.title,
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
                        text: resRef,
                    } as ModalConstruct);
                    await fd.prepare();
                    const intervalKey = setInterval(() => {
                        const cur = fd.downFile + fd.downCur;
                        const tt = fd.downTotal;
                        const percent = Math.round(10000 * cur / tt) / 100 + '%';
                        modal.content.text.value = `downloading ${cur}/${tt} (${percent})`;
                        // console.info('setInterval', modal.content.text, fd)
                    }, 500);
                    await fd.download();
                    await fd.build();
                    await fd.complete();
                    clearInterval(intervalKey);
                    opModuleVal.modalStore.close(modal.nid);
                },
            },
            {
                title: 'Rename',
                auth: !useEditMethods ? 'none' : 'user',
                method: async (e: MouseEvent) => {
                    console.info('Rename', e);
                    if (isBath) await opFunctionModule.op_bath_rename(idSet, nodeLs);
                    else await opFunctionModule.op_rename(nodeLs[0]);
                },
            },
            {
                title: 'Move',
                auth: !useEditMethods ? 'none' : 'user',
                method: async (e: MouseEvent) => {
                    console.info('Move', e);
                    if (isBath) await opFunctionModule.op_bath_move(idSet, nodeLs);
                    else await opFunctionModule.op_move(nodeLs[0]);
                },
            },
            {
                title: 'Delete',
                auth: !inRecycle ? 'user' : 'none',
                method: async (e: MouseEvent) => {
                    console.info('Delete', e);
                    if (isBath) await opFunctionModule.op_bath_delete(idSet, nodeLs);
                    else await opFunctionModule.op_delete(nodeLs[0]);
                },
            },
            {
                title: 'Recover',
                auth: inRecycle ? 'user' : 'none',
                method: async (e: MouseEvent) => {
                    console.info('Recover', e);
                    //recover是delete重做一次
                    if (isBath) await opFunctionModule.op_bath_delete(idSet, nodeLs, true);
                    else await opFunctionModule.op_delete(nodeLs[0], true);
                },
            },
            {
                title: 'Delete Forever',
                auth: inRecycle ? 'user' : 'none',
                method: async (e: MouseEvent) => {
                    console.info('Delete Forever', e);
                    if (isBath) await opFunctionModule.op_bath_delete_forever(idSet, nodeLs);
                    else await opFunctionModule.op_delete_forever(nodeLs[0]);
                },
            },
            {
                title: 'Favourite',
                auth: !useEditMethods ? 'none' : 'user',
                method: async (e: MouseEvent) => {
                    console.info('Favourite', e);
                    if (isBath) await opFunctionModule.op_bath_favourite(idSet, nodeLs);
                    else await opFunctionModule.op_toggle_favourite(nodeLs[0]);
                },
            },
            {
                title: 'Share',
                auth: 'user',
                method: async (e: MouseEvent) => {
                    console.info('Share', e);
                    await opFunctionModule.op_share(idSet);
                },
            },
            {
                title: 'Extra',
                auth: 'guest',
                method: (e: MouseEvent) => {
                    console.info('Extra', e);
                },
                child: [
                    {
                        title: 'Tagging',
                        auth: !useEditMethods ? 'none' : 'user',
                        method: async (e: MouseEvent) => {
                            console.info('Tagging', e);
                            nodeLs.forEach(node => {
                                opFunctionModule.op_tag(node);
                            });
                        },
                    },
                    {
                        title: 'Set Cover',
                        auth: isBath ? 'none' : 'user',
                        method: async (e: MouseEvent) => {
                            console.info('Set Cover', e);
                            await opFunctionModule.op_set_cover(nodeLs[0]);
                        },
                    },
                    {
                        title: 'Import EHT',
                        auth: 'admin',
                        method: async (e: MouseEvent) => {
                            console.info('Import EHT', e);
                            await opFunctionModule.op_imp_tag_eh(Array.from(idSet));
                        },
                    },
                    {
                        title: 'Cascade Tag',
                        auth: 'user',
                        method: async (e: MouseEvent) => {
                            console.info('Cascade Tag', e);
                            await opFunctionModule.op_cascade_tag(Array.from(idSet));
                        },
                    },
                ],
            },
            {
                title: 'Admin',
                auth: 'admin',
                method: (e: MouseEvent) => {
                    console.info('Extra', e);
                },
                child: [
                    {
                        title: 'ReBuild',
                        auth: 'admin',
                        method: async (e: MouseEvent) => {
                            console.info('ReBuild', e);
                            await opFunctionModule.op_rebuild(Array.from(idSet));
                        },
                    },
                    {
                        title: 'ReCheck',
                        auth: isBath ? 'none' : 'admin',
                        method: async (e: MouseEvent) => {
                            console.info('ReCheck', e);
                            await opFunctionModule.op_recheck(Array.from(idSet));
                        },
                    },
                    {
                        title: 'RM RAW',
                        auth: 'admin',
                        method: async (e: MouseEvent) => {
                            console.info('RMRAW', e);
                            await opFunctionModule.op_rm_raw(Array.from(idSet));
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
        // }, Config.timeouts.clearEvt);
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

    public arrowSelection(e: KeyboardEvent) {
        if (!this.nodeList.value.length) return;
        let preSelIndex = this.lastSelectIndex;
        if (preSelIndex === -1) {
            const selRes = this.getSelected();
            if (selRes.idSet.size) {
                preSelIndex = Array.from(selRes.idSet).pop() ?? 0;
            } else {
                preSelIndex = 0;
            }
        }
        //
        let fileViewMode = this.localConfigure.get("file_view_mode") ?? "detail";
        if (this.route.name !== 'Directory') {
            fileViewMode = 'detail';
        }
        //
        const preNode = this.nodeList.value[preSelIndex];
        if (!preNode) return;
        if (!preNode._offsets) preNode._offsets = [];
        const nodeW = preNode._offsets[2] - preNode._offsets[0];
        const domW = this.contentDOM.offsetWidth;
        const rowNum = Math.floor(domW / nodeW);
        //
        let newSelIndex = preSelIndex;
        switch (e.key) {
            case 'ArrowRight':
                newSelIndex += 1;
                break;
            case 'ArrowLeft':
                newSelIndex -= 1;
                break;
            case 'ArrowUp':
                newSelIndex -= 1 * rowNum;
                break;
            case 'ArrowDown':
                newSelIndex += 1 * rowNum;
                break;
        }
        // console.warn(newSelIndex);
        let cls = false;
        if (e.ctrlKey || e.shiftKey) cls = true;
        //
        if (newSelIndex < 0) newSelIndex = 0;
        if (newSelIndex > this.nodeList.value.length - 1) newSelIndex = this.nodeList.value.length - 1;
        this.lastSelectIndex = newSelIndex;
        //
        this.nodeList.value.forEach((node, index) => {
            if (newSelIndex === index)
                return node._selected = true;
            if (node._selected && !cls)
                node._selected = false;
        });
    }

    //-----------------------

    public setMode(mode: string) {
        this.localConfigure.set('file_view_mode', mode);
        // const preList = nodeList.value;
        // nodeList.value = [];
        // console.info('file_view_mode',nodeList.value,preList);
        // if (opModule) opModule.setList(preList);
        this.setList(this.nodeList.value);
    }

    //-----------------------
    public setSort(sort: string) {
        console.info('setSort', sort);
        this.localConfigure.set('file_view_sort', sort);
        const preList = this.nodeList.value;
        this.nodeList.value = [];
        setTimeout(() => {
            this.nodeList.value = this.sortList(preList, this.sortVal.value);
            this.setList(this.nodeList.value);
        }, Config.timeouts.sort);
    }

    public sortList(list: api_node_col[], sort: string) {
        list = manualSort(list, sort);
        return list;
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
        const target = e.target as HTMLElement;
        switch (e.key) {
            case 'F2':
                if (mayTyping(target)) return;
                if (mayInPopup(target)) return;
                selRes = this.getSelected();
                if (selRes.nodeLs.length !== 1) await opFunctionModule.op_bath_rename(selRes.idSet, selRes.nodeLs);
                else await opFunctionModule.op_rename(selRes.nodeLs[0]);
                break;
            case 'Delete':
                if (mayTyping(target)) return;
                if (mayInPopup(target)) return;
                selRes = this.getSelected();
                if (this.route.name === 'Recycle') {
                    await opFunctionModule.op_bath_delete_forever(selRes.idSet, selRes.nodeLs);
                } else {
                    await opFunctionModule.op_bath_delete(selRes.idSet, selRes.nodeLs);
                }
                break;
            case 'NumpadEnter':
            case 'Enter':
                if (mayTyping(target)) return;
                if (mayInPopup(target)) return;
                selRes = this.getSelected();
                if (!selRes.idSet.size) return;
                console.info(selRes.idSet.size);
                if (e.altKey && selRes.idSet.size == 1) {
                    return this.emitGo('node', Array.from(selRes.idSet)[0])
                }
                await opFunctionModule.op_bath_browser(selRes.idSet, selRes.nodeLs);
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'ArrowDown':
                if (mayTyping(target)) return;
                if (mayInPopup(target)) return;
                return this.arrowSelection(e);
        }
    }

    public reloadOffset(e?: UIEvent) {
        // console.info(arguments);
        // console.info('reloadOffset');
        //等候过长，退出
        if (this.reloadOffset_count > 100) return;
        //等候FileItem.onMounted中写入_dom
        //全部写入完成才开始计算坐标
        let loaded = true;
        this.nodeList.value.forEach(node => {
            if (!node._dom) loaded = false;
        });
        clearTimeout(this.reloadOffset_timer);
        if (!loaded) {
            this.reloadOffset_timer = setTimeout(() => {
                    this.reloadOffset_count += 1
                    this.reloadOffset(e)
                }, Config.timeouts.offsetDebounce
            );
            return;
        }
        //
        // 这边因为布局的关系offsetParent直接就是body，不需要过度优化
        // console.info('start calc offset');
        // const baseDOM = document.querySelector('.content_detail') as HTMLElement;
        // if (!baseDOM) return;
        // const baseX = GenFunc.nodeOffsetX(baseDOM);
        // const baseY = GenFunc.nodeOffsetY(baseDOM);
        //
        this.nodeList.value.forEach(node => {
            // console.info(node._dom);
            if (!node._dom) return;
            const dom = node._dom;
            // console.info(evt);
            let l = 0, t = 0, r = 0, b = 0;
            l = GenFunc.nodeOffsetX(dom);
            t = GenFunc.nodeOffsetY(dom);
            r = l + dom.offsetWidth;
            b = t + dom.offsetHeight;
            node._offsets = [l, t, r, b,];
            // console.warn(node.title, node._offsets);
            // console.info(node.id, node._dom, node._offsets);
        });
        // console.info(this.nodeList);
        this.scrollEvt(e as Event);
    }

    public go(ext: api_file_list_req) {
        const tQuery: api_file_list_req = Object.assign({
            id_dir: "",
            id_tag: "",
            // keyword: "",
            // node_type: "",
            // rate: "",
            // cascade_dir: "",
        }, ext);
        // console.info('go', JSON.stringify(tQuery));
        this.router.push({
            // path: this.route.path,
            path: '/',
            query: tQuery,
        });
    }

    private startScroll: boolean = false;

    public scrollEvt(e: Event) {
        GenFunc.debounce(() => {
            // console.info('this.scrollEvt()');
            this.saveScroll();
            this.reloadLazyLoad();
        }, Config.timeouts.scrollEvt, `debounce_scroll_view`);
    }

    public saveScroll() {
        // console.warn('this.saveScroll()', this.route);
        const query = this.route.query ?? {};
        const key = [
            this.route.path,
            query.mode ? query.mode : '',
            query.pid ? query.pid : '',
            query.id ? query.id : '',
            query.id ? query.id : '',
            query.tag_id ? query.tag_id : '',
        ].join(':');
        // console.info(path, this.contentDOM.scrollTop);
        const offset = [
            this.contentDOM.scrollTop,
            this.contentDOM.scrollLeft,
        ];
        //更新路由的时候会产生一个offset为0的scroll事件，直接跳过0
        if (!offset[0] && !offset[1]) return;
        GenFunc.debounce(() => {
            kvStore.set('scroll_log', key, offset);
        }, Config.timeouts.scrollSave, 'debounce_scroll_save');
    }

    public async reloadScroll() {
        // console.warn('this.reloadScroll()');
        const query = this.route.query ?? {};
        const key = [
            this.route.path,
            query.mode ? query.mode : '',
            query.pid ? query.pid : '',
            query.id ? query.id : '',
            query.id ? query.id : '',
            query.tag_id ? query.tag_id : '',
        ].join(':');
        // const path = this.route.fullPath;
        const ifLogExs: number[] = await kvStore.get('scroll_log', key) as unknown as number[];
        if (!ifLogExs) return;
        // console.info(path, ifLogExs);
        this.contentDOM.scrollTop = ifLogExs[0] ?? 0;
        this.contentDOM.scrollLeft = ifLogExs[1] ?? 0;
    }

    public reloadLazyLoad() {
        // console.info("triggleLazyLoad");
        if (!this.contentDOM) return;
        const dom = (this.contentDOM as HTMLElement);
        const d = GenFunc.nodeOffsetY(dom);
        const top = dom.scrollTop + d;
        const bottom = top + dom.clientHeight + d;
        // console.info(top);
        // opModule.reloadOffset();
        this.nodeList.value.forEach(node => {
            // console.info(node, node._offsets);
            let hit = true;
            //不判断可能会报错，但是感觉影响调试，有需要再加
            if (!node._offsets || !node._offsets.length) return;
            let offsets = node._offsets as number[];
            if (offsets[1] > bottom) hit = false;
            if (offsets[3] < top) hit = false;
            node._in_screen = hit;
        });
    }

}

export class opFunctionModule {
    public static async op_download(node: api_node_col) {
        let filePath = node.file_index?.raw?.path;
        if (!filePath) return;
        window.open(`${filePath}?filename=${node.title}`);
    }

    public static async op_rename(node: api_node_col) {
        if (node._renaming) {
            // console.info(node.title, node.description, node);
            // console.info(node);
            const formData = new FormData();
            formData.set('id', `${node.id}`);
            formData.set('title', node.title ?? '');
            formData.set('description', node.description ?? '');
            const res = await query<api_file_mov_resp>('file/mod', formData);
            if (opModuleVal) opModuleVal.emitGo('reload');
        }
        node._renaming = !node._renaming;
        setTimeout(() => {
            let tDOM = document.body.querySelector('[contenteditable="true"]') as HTMLElement;
            if (tDOM) tDOM.focus();
        }, 50)
    }

    public static async op_bath_rename(idSet: Set<number>, nodeLs: api_node_col[]) {
        if (!opModuleVal) return;
        opModuleVal.modalStore.set({
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
        if (!opModuleVal) return;
        opModuleVal.modalStore.set({
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
                        call: async (target: api_node_col) => {
                            // console.info(node);
                            const formData = new FormData();
                            formData.set('id_node', `${node.id}`);
                            formData.set('id_target', `${target.id}`);
                            const res = await query<api_file_mov_req>('file/mov', formData);
                            if (opModuleVal) opModuleVal.emitGo('reload');
                        }
                    },
                },
            ],
        });
        //
    }

    public static async op_bath_move(idSet: Set<number>, nodeLs?: api_node_col[]) {
        if (!opModuleVal) return;
        opModuleVal.modalStore.set({
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

    public static async op_delete(node: api_node_col, isRecover: boolean = false) {
        const formData = new FormData();
        formData.set('id', `${node.id}`);
        const res = await query<api_file_delete_resp>('file/delete', formData);
        console.info(opModuleVal);
        if (opModuleVal && node.id) opModuleVal.deleteFromList([node.id]);
        return res;
    }

    public static async op_bath_delete(idSet: Set<number>, nodeLs?: api_node_col[], isRecover: boolean = false, callback?: () => any) {
        if (!opModuleVal) return;
        opModuleVal.modalStore.set({
            title: `confirm to ${isRecover ? 'recover' : 'delete'} ${idSet.size} files`,
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
            text: "conform to " + (isRecover ? 'recover' : 'delete'),
            callback: {
                confirm: async (modal) => {
                    // console.info(modal);
                    // return;
                    const idList = Array.from(idSet);
                    const queryData = {
                        id_list: idList.join(','),
                    };
                    const res = await query<api_file_bath_delete_resp>("file/bath_delete", queryData);
                    //同步回列表
                    if (opModuleVal) opModuleVal.deleteFromList(idList);
                    if (callback) callback();
                    if (!res) return;
                },
            },
        } as ModalConstruct);
    }

    public static async op_delete_forever(node: api_node_col) {
        const formData = new FormData();
        formData.set('id', `${node.id}`);
        const res = await query<api_file_delete_resp>('file/delete_forever', formData);
        if (opModuleVal && node.id) opModuleVal.deleteFromList([node.id]);
        return res;
    }

    public static async op_bath_delete_forever(idSet: Set<number>, nodeLs?: api_node_col[]) {
        if (!opModuleVal) return;
        opModuleVal.modalStore.set({
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
                    const idList = Array.from(idSet);
                    const queryData = {
                        id_list: idList.join(','),
                    };
                    const res = await query<api_file_bath_delete_resp>("file/bath_delete_forever", queryData);
                    //同步回列表
                    if (opModuleVal) opModuleVal.deleteFromList(idList);
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
                if (row.auto) return;
                favGroupOpts[row.id ?? 0] = row.title ?? '';
            })
        }
        if (!opModuleVal) return;
        // console.info(node);
        opModuleVal.modalStore.set({
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
                    label: "attach to",
                    key: "target_group",
                    value: node.list_fav,
                    options: favGroupOpts,
                },
            ],
            callback: {
                submit: async function (modal) {
                    // console.info(modal)
                    const groupIdArr = modal.content.form[0].value;
                    // if (!groupIdArr) return;
                    // if (!groupIdArr.length) return;
                    const groupIdLs = groupIdArr.join(',');
                    await query<api_favourite_attach_resp>("favourite/attach", {
                        id_node: node.id,
                        list_group: groupIdLs,
                    });
                    location.reload();
                },
            },
        });
    }

    public static async op_bath_favourite(idSet: Set<number>, nodeLs: api_node_col[]) {
        const favGroupLs = await query<api_favourite_group_list_resp>("favourite_group/get", {});
        const favGroupOpts: { [key: string]: string } = {};
        if (favGroupLs) {
            favGroupLs.forEach((row) => {
                if (row.auto) return;
                favGroupOpts[row.id ?? 0] = row.title ?? '';
            })
        }
        if (!opModuleVal) return;
        opModuleVal.modalStore.set({
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
                        node_id_list: Array.from(idSet),
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
        //按文件夹排序需要crumb
        query.with = 'crumb,file';
        if (idArr.length == 1) {
            query.mode = 'directory';
            query.id_dir = `${idArr[0]}`;
        } else {
            query.mode = 'id_iterate';
            query.keyword = idArr.join(',');
        }
        //打开弹窗默认是展示的当前文件夹里的内容
        //如果文件夹里没有可以展示的内容，才会尝试查找级联的内容
        query.cascade_dir = '0';
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

    public static async op_set_cover(node: api_node_col) {
        const formData = new FormData();
        formData.set('id', `${node.id}`);
        const res = await query<api_file_cover_resp>('file/cover', formData);
        return res;
    }

    public static async op_rebuild(idSet: number[]) {
        const formData = new FormData();
        formData.set('id_list', idSet.join(','));
        const res = await query<api_file_rebuild_resp>('file/rebuild', formData);
        // emits('go', 'reload');
        return res;
    }

    public static async op_recheck(idSet: number[]) {
        const formData = new FormData();
        formData.set('id_list', idSet.join(','));
        const res = await query<api_file_checksum_resp>('file/rehash', formData);
        // emits('go', 'reload');
        return res;
    }

    public static async op_cascade_tag(idSet: number[]) {
        const formData = new FormData();
        formData.set('id_list', idSet.join(','));
        const res = await query<api_file_rebuild_resp>('file/cascade_tag', formData);
        // emits('go', 'reload');
        return res;
    }

    public static async op_rm_raw(idSet: number[]) {
        const formData = new FormData();
        formData.set('id_list', idSet.join(','));
        const res = await query<api_file_rebuild_resp>('file/rm_raw', formData);
        // emits('go', 'reload');
        return res;
    }

    public static async op_imp_tag_eh(idSet: number[]) {
        const formData = new FormData();
        formData.set('id_list', idSet.join(','));
        const res = await query<api_file_rebuild_resp>('setting/import_eht_tag', formData);
        // emits('go', 'reload');
        return res;
    }

    public static async op_rate(rateVal: number, onSelNode?: api_node_col) {
        //
        if (!opModuleVal) return;
        let selRes: { nodeLs: api_node_col[], idSet: Set<number> } = opModuleVal.getSelected();
        // console.info(selRes);
        if (onSelNode && !selRes.idSet.size) {
            selRes.idSet.add(onSelNode?.id ?? 0);
            selRes.nodeLs.push(onSelNode);
        }
        // console.info(selRes);
        selRes.nodeLs.forEach(node => {
            node.rate = rateVal;
        });
        const formData = new FormData();
        formData.set('node_id_list', Array.from(selRes.idSet).join(','));
        formData.set('rate', `${rateVal}`);
        const res = await query<api_rate_attach_resp>('rate/attach', formData);
    }

    public static async op_share(idSet: Set<number>) {
        const resultModal: ModalConstruct = {
            title: `share file`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 120,
            minW: 400,
            minH: 120,
            // h: 160,
            allow_resize: true,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            text: '<a href="./share.html/#id#" target="_blank" style="text-decoration: underline">url generated<br> id: #id#</a>',
            callback: {
                submit: async (modal) => {
                }
            }
        };
        opModuleVal.modalStore.set({
            title: `share file`,
            alpha: false,
            key: "",
            single: false,
            w: 400,
            h: 160,
            minW: 400,
            minH: 160,
            // h: 160,
            allow_resize: true,
            allow_move: true,
            allow_fullscreen: false,
            auto_focus: true,
            form: [
                {
                    type: "radio",
                    label: "duration",
                    key: "status",
                    value: '1',
                    options: {
                        '1': 'long',
                        '2': '1 day',
                        '3': '7 day',
                        '4': '30 day',
                        '5': 'manual',
                    },
                    on_change: (event, modal, form) => {
                        // console.info(event, modal, form);
                        const now = new Date();
                        switch (form.value) {
                            case '1':
                                modal.content.form[1].disabled = true;
                                break;
                            case '2':
                                modal.content.form[1].disabled = true;
                                now.setDate(now.getDate() + 1);
                                modal.content.form[1].value = now.toISOString().substring(0, 16);
                                break;
                            case '3':
                                modal.content.form[1].disabled = true;
                                now.setDate(now.getDate() + 7);
                                modal.content.form[1].value = now.toISOString().substring(0, 16);
                                break;
                            case '4':
                                modal.content.form[1].disabled = true;
                                now.setDate(now.getDate() + 30);
                                modal.content.form[1].value = now.toISOString().substring(0, 16);
                                break;
                            case '5':
                                modal.content.form[1].disabled = false;
                                now.setDate(now.getDate() + 30);
                                modal.content.form[1].value = now.toISOString().substring(0, 16);
                                break;
                        }
                    }
                },
                {
                    type: "datetime",
                    label: "expire",
                    key: "time_to",
                    value: (new Date()).toISOString().substring(0, 16),
                    disabled: true,
                },
            ],
            callback: {
                submit: async (modal) => {
                    const formData = new FormData();
                    formData.set('node_id_list', Array.from(idSet).join(','));
                    if (modal.content.form[0].value == '0') {
                        formData.set('status', 2);
                    } else {
                        formData.set('status', 1);
                        formData.set('time_to', modal.content.form[1].value);
                    }
                    const res = await query<api_share_list_resp>('share/set', formData);
                    if (!res) return;
                    resultModal.text=resultModal.text.replace(/#id#/ig, res.id);
                    opModuleVal.modalStore.set(resultModal);
                }
            }
        } as ModalConstruct);
    }
}

export class queryModule {

}

export function popupDetail(queryData: api_file_list_req, curNodeId: number) {
    if (!opModuleVal) return;
    //双击从 emitGo 进入
    //打开是手动打开
    let w = opModuleVal.localConfigure.get("browser_layout_w");
    let h = opModuleVal.localConfigure.get("browser_layout_h");
    // console.info(w, h);
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    if (iw < w) w = 0;
    if (ih < h) h = 0;
    // console.info(w, h);
    opModuleVal.modalStore.set({
        title: "file browser",
        alpha: false,
        key: "",
        single: false,
        w: w ? w : 400,
        h: h ? h : 400,
        minW: 400 > window.innerWidth ? window.innerWidth * 0.9 : 400,
        minH: 400 > window.innerHeight ? window.innerHeight * 0.9 : 400,
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

export function manualSort<K extends api_node_col>(list: K[], sort: string) {
    let sortType: [keyof api_node_col, string] = ['id', 'asc'];
    switch (sort) {
        default:
        case 'id_asc':
            sortType = ['id', 'asc',];
            break;
        case 'id_desc':
            sortType = ['id', 'desc',];
            break;
        case 'name_asc':
            sortType = ['title', 'asc',];
            break;
        case 'name_desc':
            sortType = ['title', 'desc',];
            break;
        case 'crt_asc':
            sortType = ['time_create', 'asc',];
            break;
        case 'crt_desc':
            sortType = ['time_create', 'desc',];
            break;
        case 'upd_asc':
            sortType = ['time_update', 'asc',];
            break;
        case 'upd_desc':
            sortType = ['time_update', 'desc',];
            break;
        case 'rate_asc':
            sortType = ['rate', 'asc',];
            break;
        case 'rate_desc':
            sortType = ['rate', 'desc',];
            break;
    }
    for (let i1 = 0; i1 < list.length; i1++) {
        const node = list[i1];
        if (node._sort_index) continue;
        node._sort_index = node.node_path + '/' + node.title;
    }
    const rev = sortType[1] === 'desc';
    const revNum = rev ? -1 : 1;
    list.sort((a: api_node_col, b: api_node_col) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (sortType[0]) {
            default:
                va = a[sortType[0]] as string;
                vb = b[sortType[0]] as string;
                break;
            case 'title':
                //文件夹在前，文件在后
                va = revNum * (a.type === 'directory' ? 0 : 1) + (a._sort_index ?? '');
                vb = revNum * (b.type === 'directory' ? 0 : 1) + (b._sort_index ?? '');
                // console.info(rev, va, vb, natsort({desc:rev,insensitive:true})(va, vb));
                return natsort({desc: rev, insensitive: true})(va, vb);
                break;
        }
        return (va > vb ? 1 : -1) * revNum;
    });
    // list.forEach(node => console.info(node[sortType[0]]));
    return list;
}
