<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import type {col_node,} from "../../../share/Database";
import {query} from "@/Helper";
import GenFunc from "../../../share/GenFunc";
import FileItem from "@/components/FileItem.vue";
import type {api_file_bath_delete_resp, api_file_bath_move_resp, api_file_bath_rename_resp, api_file_list_req, api_file_list_resp, api_file_mkdir_req, api_file_mkdir_resp, api_node_col,} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";
import type {ModalConstruct} from '@/modal';

const modalStore = useModalStore();
const contentDOM: Ref<HTMLElement | null> = ref(null);
//
// const z = { a: FileItem };
// console.info(z);
const router = useRouter();
const route = useRoute();
const def = {
  fileType: [
    "any",
    "directory",
    "file",
    "audio",
    "video",
    "image",
    "binary",
    "text",
    "pdf",
  ],
  sort: {
    id_asc: "id ↑",
    id_desc: "id ↓",
    name_asc: "name ↑",
    name_desc: "name ↓",
    crt_asc: "crt time ↑",
    crt_desc: "crt time ↓",
    upd_asc: "upd time ↑",
    upd_desc: "upd time ↓",
  },
  listType: ["detail", "text", "img"],
};
let queryData = {
  mode: "",
  pid: "",
  keyword: "",
  tag_id: "",
  node_type: "",
  dir_only: "",
  with: "",
  group: "",
} as api_file_list_req;
let timeoutDef = {
  sort: 50,
  selectEvt: 50,
  clearEvt: 100,
  //zzz
  lazyLoad: 200,
};
// let usePid = false;
//
// defineProps<{
// msg: string;
// }>();
/* onMounted(() => {
  console.info(route.path);
});
let curContainer: RouteRecordRaw | null = null;
watch(route, async (to: RouteLocationNormalizedLoaded) => {
  console.info(to.path, routes);
  routes.forEach((r) => {
    if (r.path !== to.path) return;
    curContainer = r;
    console.info(curContainer.name);
  });
}); */
function getCurRoute() {
}

function addFolder() {
  let pid = 0;
  let title = 'root';
  if (crumbList.value.length) {
    let curNode = crumbList.value[crumbList.value.length - 1];
    if (curNode) {
      pid = curNode.id ?? 0;
      title = curNode.title ?? 'root';
    }
  }
  modalStore.set({
    title: `mkdir | ${title}`,
    alpha: false,
    key: "",
    single: false,
    w: 400,
    h: 100,
    minW: 400,
    minH: 100,
    // h: 160,
    resizable: true,
    movable: false,
    fullscreen: false,
    form: [
      {
        label: 'title',
        type: 'text',
      }
    ],
    callback: {
      submit: async (modal) => {
        // console.info(modal);
        const formData = modal.content.form;
        const targetTitle = formData[0].value;
        // console.info(targetTitle)
        if (!targetTitle) return true;
        const res = await query<api_file_mkdir_resp>("file/mkdir", {
          title: targetTitle,
          pid: `${pid}`,
        } as api_file_mkdir_req);
        getList();
        if (!res) return;
      },
    },
  });
}

function addFile() {
  let pid = 0;
  let title = 'root';
  if (crumbList.value.length) {
    let curNode = crumbList.value[crumbList.value.length - 1];
    if (curNode) {
      pid = curNode.id ?? 0;
      title = curNode.title ?? 'root';
    }
  }
  modalStore.set({
    title: `upload | ${title}`,
    alpha: false,
    key: "",
    single: false,
    w: 400,
    h: 200,
    minW: 400,
    minH: 200,
    // h: 160,
    resizable: true,
    movable: false,
    fullscreen: false,
    // text: "this is text",
    component: [
      {
        componentName: "uploader",
        data: {
          pid: pid,
          emitGo: emitGo,
        },
      },
    ],
  });
}

//
let crumbList: Ref<api_node_col[]> = ref([]);
let nodeList: Ref<api_node_col[]> = ref([]);
// onMounted(async () => {
// getList();
// });
async function getList() {
  console.info('getList', route.name);
  crumbList.value = [];
  nodeList.value = [];
  switch (route.name) {
    default:
      break;
    case 'Recycle':
      queryData.group = 'deleted';
      break;
    case 'Favourite':
      queryData.group = 'favourite';
      break;
  }
  const res = await query<api_file_list_resp>("file/get", queryData);
  if (!res) return;
  // console.info(res);
  crumbList.value = res.path;
  nodeList.value = sortList(res.list);
  // console.info(crumbList);
}

function sortList(list: col_node[]) {
  let sortType: [keyof col_node, string] = ['id', 'asc'];
  switch (sortVal.value) {
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
  }
  list.sort((a, b) => {
    const va = a[sortType[0]];
    const vb = b[sortType[0]];
    const rev = sortType[1] == 'desc' ? -1 : 1;
    return (va ? va : 0) > (vb ? vb : 0) ? rev * 1 : rev * -1;
  })
  return list;
}

//
const localConfigure = useLocalConfigureStore();
let mode: Ref<string> = ref(localConfigure.get("file_view_mode") ?? "detail");
const modeKey = localConfigure.listen(
  "file_view_mode",
  (v) => (mode.value = v)
);

function setMode(mode: string) {
  localConfigure.set("file_view_mode", mode);
}

//
let sortVal: Ref<string> = ref(localConfigure.get("file_view_sort") ?? "name_asc");
// const sortKey = localConfigure.listen(
//   "file_view_sort",
//   (v) => {
//     sortVal.value = v;
//     const preVal = nodeList.value;
//     nodeList.value = [];
//     nodeList.value = sortList(preVal);
//   }
// );

function setSort(sortVal: string) {
  console.info('setSort', sortVal);
  localConfigure.set("file_view_sort", sortVal);
  const preList = nodeList.value;
  nodeList.value = [];
  setTimeout(() => {
    nodeList.value = sortList(preList);
  }, timeoutDef.sort);
}

let selecting = false;
let selectingMovEvtCount = 0;
let selectingOffset = [[0, 0,], [0, 0,],];
const preSelectedNodeIndexSet = new Set<number>();
let selectingKeyDef = '';

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
function inDetailView(e: MouseEvent): boolean {
  // console.info(e);
  let inDetail = false;
  let prop = e.target as Element;
  while (prop) {
    // console.info(prop);
    // console.info(prop.classList);
    // console.info(prop.classList.contains('content_detail'));
    // if(props.tagName)
    if (prop.classList.contains('content_detail')) {
      inDetail = true;
      break;
    }
    if (!prop.parentElement) break;
    prop = prop.parentElement;
    // if(prop.classList)
  }
  return inDetail;
}

function inTaggingDOM(e: MouseEvent): boolean {
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

function mouseDownEvt(e: MouseEvent) {
  if (!inDetailView(e)) return;
  if (inTaggingDOM(e)) return;
  console.info(e);
  // console.info(inDetail(e));
  // console.info('mouseDownEvt');
  // e.stopPropagation();
  e.preventDefault();
  selectingOffset[0] = [e.x, e.y,];
  selectingOffset[1] = [e.x, e.y,];
  preSelectedNodeIndexSet.clear();
  nodeList.value.forEach((node, index) => {
    if (node._selected)
      preSelectedNodeIndexSet.add(index)
  });
  selecting = true;
  selectingMovEvtCount = 0;
  // setTimeout(() => selecting = true, 50);
  //
  const keyMap = [];
  if (e.ctrlKey) keyMap.push('ctrl');
  if (e.shiftKey) keyMap.push('shift');
  if (e.altKey) keyMap.push('alt');
  if (e.metaKey) keyMap.push('meta');
  selectingKeyDef = keyMap.join('_');
  switch (selectingKeyDef) {
    case 'shift':
    case 'ctrl_shift':
    case 'ctrl_alt':
    case 'shift_alt':
    default:
      preSelectedNodeIndexSet.clear();
      break;
    case 'ctrl':
      break;
  }
}

function mouseMoveEvt(e: MouseEvent) {
  if (!selecting) return;
  //有时候click会触发到mousemove事件，做个防抖
  selectingMovEvtCount += 1;
  if (selectingMovEvtCount < 10) return;
  console.info('mouseMoveEvt', selecting);
  e.preventDefault();
  selectingOffset[1] = [e.x, e.y,];
  let retL = selectingOffset[0][0] > selectingOffset[1][0] ? selectingOffset[1][0] : selectingOffset[0][0];
  let retT = selectingOffset[0][1] > selectingOffset[1][1] ? selectingOffset[1][1] : selectingOffset[0][1];
  let retR = selectingOffset[0][0] < selectingOffset[1][0] ? selectingOffset[1][0] : selectingOffset[0][0];
  let retB = selectingOffset[0][1] < selectingOffset[1][1] ? selectingOffset[1][1] : selectingOffset[0][1];
  const selIndexLs = new Set<number>();
  nodeList.value.forEach((node, index) => {
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
  // console.info(selIndexLs);
  nodeList.value.forEach((node, index) => {
    let selected = false;
    if (selIndexLs.has(index)) selected = true;
    if (preSelectedNodeIndexSet.has(index)) selected = true;
    node._selected = selected;
    // console.info(node._selected);
  });
  showSelectionOp.value = preSelectedNodeIndexSet.size + selIndexLs.size > 0;
}

function mouseUpEvt(e: MouseEvent) {
  // return;
  if (!selecting) return;
  console.info('mouseUpEvt');
  e.preventDefault();
  // e.stopPropagation();
  setTimeout(() => {
    selecting = false;
    selectingMovEvtCount = 0;
    selectingOffset = [[0, 0,], [0, 0,],];
    preSelectedNodeIndexSet.clear();
    selectingKeyDef = '';
  }, timeoutDef.selectEvt);
}

onMounted(async () => {
  console.info('onMounted');
  localConfigure.release("file_view_mode", modeKey);
  Object.assign(queryData, GenFunc.copyObject(route.query));
  await getList();
  if (contentDOM.value) {
    contentDOM.value.addEventListener("scroll", lazyLoad);
  }
  addEventListener('mousedown', mouseDownEvt);
  addEventListener('mousemove', mouseMoveEvt);
  addEventListener('mouseup', mouseUpEvt);
  addEventListener('keydown', keymap);
});
onUnmounted(() => {
  if (contentDOM.value) {
    contentDOM.value.removeEventListener("scroll", lazyLoad);
  }
  removeEventListener('mousedown', mouseDownEvt);
  removeEventListener('mousemove', mouseMoveEvt);
  removeEventListener('mouseup', mouseUpEvt);
  removeEventListener('keydown', keymap);
});

//
function go(ext: api_file_list_req) {
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
  router.push({
    path: route.path,
    query: tQuery,
  });
}

function emitGo(type: string, code: number) {
  // console.info("emitGo", type, code);
  switch (type) {
    case "reload":
      getList();
      break;
    case "tag":
      go({tag_id: `${code}`, mode: 'tag'});
      break;
    case "node":
      let node;
      for (let i1 = 0; i1 < nodeList.value.length; i1++) {
        if (nodeList.value[i1].id !== code) continue;
        node = nodeList.value[i1];
        break;
      }
      if (!node) break;
      switch (node.type) {
        case "directory":
          go({pid: `${node.id}`, mode: 'directory'});
          break;
        default:
          popupDetail(GenFunc.copyObject(queryData), node.id ?? 0);
          break;
      }
      break;
  }
}

const showSelectionOp: Ref<boolean> = ref(false);
//shift用的
const lastSelectId: Ref<number> = ref(0);

function emitSelect(event: MouseEvent, node: api_node_col) {
  // if (!notSelecting) return;
  console.info('emitSelect', event, node);
  // return;
  const keyMap = [];
  if (event.ctrlKey) keyMap.push('ctrl');
  if (event.shiftKey) keyMap.push('shift');
  if (event.altKey) keyMap.push('alt');
  if (event.metaKey) keyMap.push('meta');
  const keyDef = keyMap.join('_');
  let f: number, t: number,
    curNodeIndex: number, prevNodeIndex: number;
  switch (keyDef) {
    default:
      console.info('def');
      nodeList.value.forEach(item => {
        if (item.id == node.id) {
          item._selected = true;
          // item._selected = !item?._selected;
          console.info(item._selected);
        } else {
          item._selected = false;
        }
      });
      break;
    case 'ctrl':
      // console.info('ctrl');
      nodeList.value.forEach(item => {
        if (item.id == node.id) {
          item._selected = !item?._selected;
        }
      });
      break;
    case 'shift':
      // console.info('shift');
      curNodeIndex = -1;
      prevNodeIndex = -1;
      nodeList.value.forEach((item, index) => {
        if (lastSelectId.value && item.id == lastSelectId.value && item._selected) {
          prevNodeIndex = index;
        }
        if (node.id && item.id == node.id) {
          curNodeIndex = index;
        }
      });
      // console.info(lastSelectId.value, prevNodeIndex, curNodeIndex);
      if (prevNodeIndex == curNodeIndex) break;
      if (prevNodeIndex == -1 || curNodeIndex == -1) break;
      if (prevNodeIndex > curNodeIndex) {
        f = curNodeIndex;
        t = prevNodeIndex;
      } else {
        t = curNodeIndex;
        f = prevNodeIndex;
      }
      nodeList.value.forEach((item, index) => {
        if (index < f) item._selected = false;
        else if (index > t) item._selected = false;
        else item._selected = true;
      });
      break;
    case 'ctrl_shift':
      curNodeIndex = -1;
      prevNodeIndex = -1;
      nodeList.value.forEach((item, index) => {
        if (lastSelectId.value && item.id == lastSelectId.value && item._selected) {
          prevNodeIndex = index;
        }
        if (node.id && item.id == node.id) {
          curNodeIndex = index;
        }
      });
      // console.info(lastSelectId.value, prevNodeIndex, curNodeIndex);
      if (prevNodeIndex == curNodeIndex) break;
      if (prevNodeIndex == -1 || curNodeIndex == -1) break;
      if (prevNodeIndex > curNodeIndex) {
        f = curNodeIndex;
        t = prevNodeIndex;
      } else {
        t = curNodeIndex;
        f = prevNodeIndex;
      }
      for (let i1 = f; i1 <= t; i1++) {
        nodeList.value[i1]._selected = true;
      }
      break;
    case 'ctrl_alt':
      break;
    case 'shift_alt':
      break;
  }
  //
  let selectCount = 0;
  nodeList.value.forEach(item => {
    if (item._selected) selectCount += 1;
  });
  //
  showSelectionOp.value = selectCount > 0;
  lastSelectId.value = node.id ?? 0;
}

function clearSelect(e: MouseEvent) {
  // console.info(e);
  if (!(e.target as Element).classList.contains('content_detail')) return;
  // setTimeout(() => {
  // console.warn('clearSelect', selecting)
  // if (selecting) return;
  nodeList.value.forEach(item => {
    item._selected = false;
  });
  showSelectionOp.value = false;
  // }, timeoutDef.clearEvt);
}

async function bathOp(mode: string) {
  const subNodeLs: api_node_col[] = [];
  const subNodeIdLs: Set<number> = new Set<number>();
  nodeList.value.forEach(item => {
    if (!item._selected) return;
    subNodeLs.push(item);
    subNodeIdLs.add(item?.id ?? 0);
  });
  switch (mode) {
    case 'rename':
      modalStore.set({
        title: `bath rename`,
        alpha: false,
        key: "",
        single: false,
        w: 400,
        h: 250,
        minW: 400,
        minH: 250,
        // h: 160,
        resizable: false,
        movable: true,
        fullscreen: false,
        text: `<p>rename pattern:</p>
<table>
<tr><td>code</td><td>description</td></tr>
<tr><td>{filename}</td><td>file name</td></tr>
<tr><td>{index}</td><td>index by sort, prefix by max len+1</td></tr>
<tr><td>{index:n}</td><td>index by sort, prefix len by [n]</td></tr>
<tr><td>{directory}</td><td>parent directory name</td></tr>
`,
        form: [
          {
            label: 'pattern',
            type: 'text',
            value: '{index}_{filename}',
          }
        ],
        callback: {
          submit: async (modal) => {
            console.info('on submit', subNodeLs, modal);
            sortList(subNodeLs);
            let pattern = modal.content.form[0].value;
            //
            let defIndexPrefix = subNodeLs.length.toString().length + 1;
            //
            let manIndexPrefix = 0;
            let manIndexKey = '';
            let matchManIndex = pattern.match(/\{index:(\d+)\}/);
            if (matchManIndex) {
              manIndexPrefix = parseInt(matchManIndex[1]);
              manIndexKey = matchManIndex[0];
            }
            //
            const modMap = new Map<number, string>();
            subNodeLs.forEach((node, index) => {
              const parentNode = node.crumb_node ? node.crumb_node[node.crumb_node.length - 1] : null;
              const parentTitle = parentNode ? parentNode.title : '';
              //
              let replaceKV = new Map<string, string>();
              replaceKV.set('{filename}', node.title ?? '');
              replaceKV.set('{index}', GenFunc.prefix(index + 1, defIndexPrefix, '0'));
              replaceKV.set('{directory}', parentTitle ?? '');
              replaceKV.set(`{index:${manIndexKey}}`, GenFunc.prefix(index + 1, manIndexPrefix, '0'));
              let target = pattern;
              replaceKV.forEach((value, key) => {
                // console.info(key, value);
                target = target.replace(key, value);
              })
              // console.info(target);
              modMap.set(node.id ?? 0, target);
            });
            const modArr = [] as { id: number, title: string }[];
            modMap.forEach((value, key) => {
              modArr.push({id: key, title: value});
            });
            // console.info(modArr);
            // return;

            const queryData = {
              list: JSON.stringify(modArr)
            };
            const res = await query<api_file_bath_rename_resp>("file/bath_rename", queryData);
            //同步回列表
            getList();
            if (!res) return;
          },
        },
      } as ModalConstruct);
      break;
    case 'move':
      modalStore.set({
        title: `locator | move ${subNodeIdLs.size} files to:`,
        alpha: false,
        key: "",
        single: false,
        w: 400,
        h: 60,
        minW: 400,
        minH: 60,
        // h: 160,
        resizable: true,
        movable: false,
        fullscreen: false,
        // text: "this is text",
        component: [
          {
            componentName: "locator",
            data: {
              query: {
                type: 'directory',
              } as api_file_list_req,
              call: async (targetNode: api_node_col) => {
                console.info(targetNode);
                const queryData = {
                  id_list: Array.from(subNodeIdLs).join(','),
                  id_parent: targetNode.id
                };
                const res = await query<api_file_bath_move_resp>("file/bath_move", queryData);
                //同步回列表
                getList();
                if (!res) return;
                return;
              }
            },
          },
        ],
      } as ModalConstruct);
      break;
    case 'delete':
      const queryData = {
        id_list: Array.from(subNodeIdLs).join(',')
      };
      const res = await query<api_file_bath_delete_resp>("file/bath_delete", queryData);
      //同步回列表
      getList();
      if (!res) return;
      break;
  }
}

function popupDetail(queryData: { [key: string]: any }, curNodeId: number) {
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
    resizable: true,
    movable: false,
    fullscreen: false,
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

//
function search() {
  const tQuery = GenFunc.copyObject(queryData);
  if (tQuery.dir_only && crumbList.value.length) {
    tQuery.pid =
      crumbList.value[crumbList.value.length - 1].id?.toString() ?? "";
    // } else {
    //   delete tQuery.pid;
  }
  tQuery.mode = 'search';
  if (!queryData.keyword && (!queryData.node_type || queryData.node_type == 'any')) {
    return go({pid: queryData.pid, mode: 'directory',});
  }
  console.info(tQuery);
  router.push({
    path: route.path,
    query: tQuery,
  });
}

// console.info('here');

onBeforeRouteUpdate(async (to) => {
  console.info('onBeforeRouteUpdate', to);
  queryData = Object.assign({
    mode: "",
    pid: "",
    keyword: "",
    tag_id: "",
    node_type: "",
    dir_only: "",
    with: "",
    group: "",
  }, GenFunc.copyObject(to.query));
  await getList();
});
//
let lazyLoadTimer = 0;

function lazyLoad(e: Event) {
  clearTimeout(lazyLoadTimer);
  lazyLoadTimer = setTimeout(triggleLazyLoad, timeoutDef.lazyLoad);
}

function triggleLazyLoad() {
  // @todo 这边主要传值不好做, 看看到时候效果怎么样再说吧...
  return;
  // console.info("triggleLazyLoad");
  // if (!contentDOM.value) return;
  // const top = contentDOM.value.scrollTop;
  // console.info(top);
}

/*function selectNode(e: MouseEvent, node: api_node_col) {
  console.info(e, node);
}*/

/*function toGo() {
}*/

async function keymap(e: KeyboardEvent) {
  // console.info(e);
  switch (e.key) {
    case 'F2':
      let selCount = 0;
      let selInd = -1;
      nodeList.value.forEach((node, index) => {
        if (!node._selected) return;
        selCount += 1;
        selInd = index;
        // console.info(node._selected);
      });
      if (selCount > 1) {
        bathOp('rename');
      }
      if (selCount == 1) {
        nodeList.value[selInd]._renaming = true;
      }
      break;
    case 'Delete':
      /*const subNodeIdLs = new Set<number>();
      nodeList.value.forEach((node, index) => {
        if (!node._selected) return;
        subNodeIdLs.add(node.id ?? 0);
        // console.info(node._selected);
      });
      const queryData = {
        id_list: Array.from(subNodeIdLs).join(',')
      };
      const res = await query<api_file_bath_delete_resp>("file/bath_delete", queryData);
      //同步回列表
      getList();*/
      break;
  }
}
</script>

<template>
  <div class="fr_content" ref="contentDOM">
    <div class="content_meta">
      <div class="crumb" v-if="crumbList.length">
        <a
          class="item"
          v-for="(node, nodeIndex) in crumbList"
          :key="nodeIndex"
          @click="go({ pid: `${node?.id}`,mode:'directory' })"
        >{{ node.title }}
        </a>
      </div>
      <div class="search">
        <label>
          <span>Title : </span><input type="text" v-model="queryData.keyword"/>
        </label>
        <label>
          <span>Type : </span>
          <select v-model="queryData.node_type">
            <option v-for="type in def.fileType">{{ type }}</option>
          </select>
        </label>
        <label v-if="crumbList.length">
          <span>InDir : </span>
          <input type="checkbox" v-model="queryData.dir_only" id="FV_S_CB"
                 :true-value="1"
                 false-value=""
          />
          <label for="FV_S_CB"></label>
        </label>
        <!--      <label>
              <input
                type="checkbox"
                id="content_directory_directory_only_checkbox"
                v-model="queryData.is_fav"
                :true-value="'1'"
                :false-value="'0'"
              >
              <label for="content_directory_directory_only_checkbox">Fav</label>
            </label>-->
        <label>
          <button class="sysIcon sysIcon_search" @click="search"></button>
        </label>
      </div>
      <div class="display">
        <template v-if="showSelectionOp">
          <a @click="bathOp('rename')">RN</a>
          <a @click="bathOp('move')">MV</a>
          <a @click="bathOp('delete')">DEL</a>
          <a class="sysIcon sysIcon_fengefu"></a>
        </template>
        <a class="sysIcon sysIcon_addfolder" @click="addFolder"></a>
        <a class="sysIcon sysIcon_addfile" @click="addFile"></a>
        <a class="sysIcon sysIcon_fengefu"></a>
        <label>
          <span>Sort : </span>
          <select v-model="sortVal" @change="setSort(sortVal)">
            <option v-for="(sortItem, key) in def.sort" :value="key">
              {{ sortItem }}
            </option>
          </select>
        </label>
        <a class="sysIcon sysIcon_fengefu"></a>
        <a
          v-for="type in def.listType"
          :class="[
            'sysIcon',
            `sysIcon_listType_${type}`,
            { active: mode === type },
          ]"
          @click="setMode(type)"
        ></a>
      </div>
    </div>
    <!--    @click="clearSelect"-->
    <div :class="['content_detail', `mode_${mode}`]"
         @click="clearSelect"
    >
      <FileItem
        v-for="(node, nodeIndex) in nodeList"
        :key="nodeIndex"
        :node="node"
        :index="nodeIndex"
        :selected="false"
        @go="emitGo"
        @on-select="emitSelect"
      ></FileItem>
    </div>
    <!--    @click="selectNode($event,node)"-->
    <!--    @dblclick="toGo"-->
    <!-- <directory-layout></directory-layout> -->
  </div>
</template>

<style scoped lang="scss">
.fr_content {
  .content_meta {
    $metaBk: map-get($colors, bar_meta);
    background-color: $metaBk;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 0 $fontSize * 0.5;
    //height: $fontSize * 1.5;
    line-height: $fontSize * 1.5;
    //margin-bottom: $fontSize;
    * {
      height: $fontSize * 1.5;
      line-height: $fontSize * 1.5;
      padding-top: 0;
      padding-bottom: 0;
    }
    > * {
      display: inline-block;
      overflow: hidden;
    }
    label {
      margin-right: $fontSize;
    }
    input,
    button,
    select {
      background-color: $metaBk;
      padding: 0;
    }
    a,
    span {
      font-size: $fontSize;
      //line-height: 1.5em;
      padding: 0 0.125em;
      display: inline-block;
    }
    a:hover {
      background-color: map-get($colors, bar_meta_active);
    }
    .crumb {
      white-space: nowrap;
      .item {
        padding-left: $fontSize * 0.25;
      }
      .item:hover {
        background-color: map-get($colors, bar_meta_active);
      }
      .item::after {
        content: "/";
        font-size: $fontSize;
        padding-left: $fontSize * 0.25;
        padding-right: $fontSize * 0.25;
      }
    }
    .display a {
      cursor: pointer;
    }
  }
  .content_detail.mode_detail {
    //columns: $fontSize * 20 6;
    //column-gap: 0;
    display: flex;
    flex-wrap: wrap;
    //justify-content: space-around;
    justify-content: left;
  }
  .content_detail.mode_img {
    //columns: $fontSize * 10 12;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  .content_detail.mode_text {
    display: table;
    width: 100%;
  }
}
</style>
