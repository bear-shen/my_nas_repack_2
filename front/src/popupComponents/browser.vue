<script setup lang="ts">
import type {Ref} from "vue";
import {onMounted, onUnmounted, ref} from "vue";
import type {ModalStruct} from "@/modal";
import {mayTyping, query} from "@/Helper";
import {manualSort, opFunctionModule} from "@/FileViewHelper";
import type {api_file_list_req, api_file_list_resp, api_node_col} from "../../../share/Api";
import GenFunc from "@/GenFunc";
import browserBaseVue from "./browserBase.vue";
import browserImageVue from "./browserImage.vue";
import browserAudioVue from "./browserAudio.vue";
import browserVideoVue from "./browserVideo.vue";
import browserTextVue from "./browserText.vue";
import browserPDFVue from "./browserPDF.vue";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {useEventStore} from "@/stores/event";
import type {col_node, type_file,} from "../../../share/Database";
//------------------
const props = defineProps<{
  data: {
    query: api_file_list_req;
    curId: number;
    [key: string]: any;
  };
  modalData: ModalStruct;
}>();
const def = {
  fileType: [
    "any",
    // "directory",
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
    rate_asc: "rate ↑",
    rate_desc: "rate ↓",
  },
  rate: {
    '0': '&#xe69f;&#xe69f;&#xe69f;&#xe69f;&#xe69f;',
    '1': '&#xe6b6;&#xe69f;&#xe69f;&#xe69f;&#xe69f;',
    '2': '&#xe69e;&#xe69f;&#xe69f;&#xe69f;&#xe69f;',
    '3': '&#xe69e;&#xe6b6;&#xe69f;&#xe69f;&#xe69f;',
    '4': '&#xe69e;&#xe69e;&#xe69f;&#xe69f;&#xe69f;',
    '5': '&#xe69e;&#xe69e;&#xe6b6;&#xe69f;&#xe69f;',
    '6': '&#xe69e;&#xe69e;&#xe69e;&#xe69f;&#xe69f;',
    '7': '&#xe69e;&#xe69e;&#xe69e;&#xe6b6;&#xe69f;',
    '8': '&#xe69e;&#xe69e;&#xe69e;&#xe69e;&#xe69f;',
    '9': '&#xe69e;&#xe69e;&#xe69e;&#xe69e;&#xe6b6;',
    '10': '&#xe69e;&#xe69e;&#xe69e;&#xe69e;&#xe69e;',
  },
  listType: ["detail", "text", "img"],
  playMode: [
    /*"queue",*/ "loop", "single", "shuffle"
  ],
  ignoreFileType: [
    'directory',
    'subtitle',
  ] as type_file[],
};
const isMobile = window.navigator.userAgent.toLowerCase().indexOf('mobile') !== -1;
const regComponentLs = {
  audio: browserAudioVue,
  video: browserVideoVue,
  image: browserImageVue,
  pdf: browserPDFVue,
  text: browserTextVue,
  base: browserBaseVue,
} as { [key: string]: any };

const eventStore = useEventStore();
const localConfigure = useLocalConfigureStore();

// fullscreen btn ------------------

let ifFullscreen = false;

//浏览器的缩放不按照弹窗默认的设置
const resizingEvtKey = eventStore.listen(
  `modal_resizing_${props.modalData.nid}`,
  (data) => {
    // console.info(ifFullscreen, !props.modalData.layout.fullscreen);
    if (ifFullscreen && !props.modalData.layout.fullscreen) {
      //全屏切普通
      let w = localConfigure.get("browser_layout_w");
      let h = localConfigure.get("browser_layout_h");
      // console.info('from fs', w, h);
      props.modalData.layout.w = w;
      props.modalData.layout.h = h;
      props.modalData.layout.x = (window.innerWidth - w) / 2;
      props.modalData.layout.y = (window.innerHeight - h) / 2;
    } else if (!props.modalData.layout.fullscreen) {
      //普通缩放
      // console.info('set', props.modalData.layout.w);
      localConfigure.set("browser_layout_w", props.modalData.layout.w);
      localConfigure.set("browser_layout_h", props.modalData.layout.h);
    }
    ifFullscreen = props.modalData.layout.fullscreen;
  }
);

// mode btn ------------------

const playMode: Ref<string> = ref(
  localConfigure.get("browser_play_mode") ?? "loop"
);

function togglePlayMode() {
  let curModeIndex = def.playMode.indexOf(playMode.value);
  curModeIndex += 1;
  if (curModeIndex > def.playMode.length - 1) curModeIndex = 0;
  playMode.value = def.playMode[curModeIndex];
  localConfigure.set("browser_play_mode", playMode.value);
}

// detail btn ------------------

const showDetail: Ref<boolean> = ref(
  localConfigure.get("browser_show_detail") ?? false
);

function toggleDetail() {
  showDetail.value = !showDetail.value;
  localConfigure.set("browser_show_detail", showDetail.value);
}

//------------------
onMounted(() => {
  // console.info("mounted");
  document.addEventListener("keydown", keymap);
  //popup会自动focus，这边取消focus
  //已经加了auto_focus:false，但是以备万一
  setTimeout(() => {
    if (document.activeElement)
      (document.activeElement as HTMLElement).blur();
  }, 100);
});
onUnmounted(() => {
  // console.info("unmounted");
  document.removeEventListener("keydown", keymap);
});
// setTimeout(() => {
// props.modalData.base.title = "dev browser";
// }, 1000);

//_weight_stack 从 2 开始到 12 对应 0 - 10 分，根据列表顺序生成
type node_browser_def = api_node_col & { _weight_stack: number };
//[]切换文件夹用的list
const crumbList: Ref<api_node_col[]> = ref([]);
//这个是全量的nodeList，传递到内部遍历的也是这个
const nodeList: Ref<api_node_col[]> = ref([]);
//这个是筛选后的nodeList
const vNodeList: Ref<node_browser_def[]> = ref([]);
let stackSize = 0;
//
const curIndex: Ref<number> = ref(0);
const curNode: Ref<api_node_col> = ref({});
// onMounted(async () => {
// getList();
// });

// watch(curNode, async to => {
// })
/*async function getParent(): Promise<api_file_list_resp> {
  const res = await query<api_file_list_resp>("file/get", {
    pid: props.data.query.pid,
    with: 'none',
  } as api_file_list_req);
  if (!res) return {path: [], list: []};
  return res;
}*/

async function getParentDir(pid: number | string): Promise<api_file_list_resp> {
  const res = await query<api_file_list_resp>("file/get", {
    node_type: 'directory',
    pid: `${pid}`,
    with: 'none',
  } as api_file_list_req);
  if (!res) return {path: [], list: []};
  return res;
}

getList();

function buildVList() {
  let newVList: node_browser_def[] = [];
  stackSize = 0;
  nodeList.value.forEach(node => {
    if (!isValidNode(node)) return;
    const weight = node.rate ? node.rate + 2 : 2;
    newVList.push(Object.assign(node, {
      _weight_stack: stackSize,
    }));
    stackSize += weight;
  })
  newVList = sortList(newVList, sortVal.value);
  return newVList;
}

async function getList(ext: api_file_list_req = {}) {
  // let queryData = GenFunc.copyObject(props.data.query);
  if (ext)
    props.data.query = Object.assign(props.data.query, ext);
  const res = await query<api_file_list_resp>("file/get", props.data.query);
  if (!res) return false;
  if (!res.list.length) return false;
  //先过滤掉文件夹
  let dirCount = 0;
  res.list.forEach(node => {
    if (!node.is_file) dirCount++;
  });
  //有文件的时候才清理
  if (dirCount != res.list.length) {
    const tList: api_node_col[] = [];
    res.list.forEach(node => {
      if (node.is_file) tList.push(node);
    });
    res.list = tList;
  }
  //
  let index = 0;
  let node = null;
  for (let i1 = 0; i1 < res.list.length; i1++) {
    if (res.list[i1].id !== props.data.curId) continue;
    index = i1;
    node = res.list[i1];
    break;
  }
  console.info(index, node);
  crumbList.value = res.path;
  nodeList.value = res.list;
  // console.info(res);
  if (!node) node = nodeList.value[0];
  // console.warn(node.title);
  // console.info(curIndex.value);
  // nodeList.value = sortList(res.list);
  // curNode.value = node;
  // console.info(crumbList);
  let vList = buildVList();
  vNodeList.value = sortList(vList, sortVal.value);
  curIndex.value = locateCurNode(vNodeList.value, node);
  console.info(curIndex.value);
  onModNav();
  return true;
}

//------------------
function goNav(curNavIndex: number, offset: number, counter: number = 0): any {
  // console.info('goNav', [curNavIndex, offset, counter,]);
  let listLen = vNodeList.value.length;
  if (listLen < 1) return;
  let nextIndex = 0;
  if (playMode.value === "shuffle") {
    let p = Math.random() * stackSize;
    offset = 0;
    for (let i = 0; i < listLen; i++) {
      offset = i;
      if (vNodeList.value[i]._weight_stack > p) break;
    }
    nextIndex = offset;
  } else {
    nextIndex = curNavIndex + offset;
  }
  while (nextIndex < 0) nextIndex += listLen;
  while (nextIndex > listLen - 1) nextIndex -= listLen;
  if (!counter) counter = 0;
  counter += 1;
  if (counter > listLen) return;
  // console.info(isValidNav(nextIndex));
  // if (!isValidNav(nextIndex)) return goNav(nextIndex, offset, counter);
  curIndex.value = nextIndex;
  onModNav();
}

function emitNav(index: number) {
  let delta = index - curIndex.value;
  goNav(curIndex.value, delta);
}

function isValidNode(node: api_node_col) {
  // const node = nodeList.value[nextIndex];
  // console.info([node.type, filterVal.value, def.ignoreFileType.indexOf(node.type ?? 'directory')]);
  const rate = parseInt(rateVal.value) ?? 0;
  if ((node.rate ?? 0) < rate) {
    return false;
  }
  switch (filterVal.value) {
    case 'any':
    case 'file':
      return def.ignoreFileType.indexOf(node.type ?? 'directory') === -1;
      break;
    default:
      return filterVal.value == node.type;
      break;
  }
}

function onModNav() {
  if (vNodeList.value.length) {
    // console.info(curNode.value);
    // console.info(vNodeList.value);
    // console.info(curIndex.value);
    const changeType = curNode.value.type !== vNodeList.value[curIndex.value].type;
    // curIndex.value = locateCurNode(nodeList.value, curNode.value);
    curNode.value = vNodeList.value[curIndex.value];
  }
  modTitle();
}

function modTitle() {
  // console.info(['modTitle', curIndex.value, nodeList.value.length]);
  props.modalData.base.title =
    (curIndex.value + 1) + '/' + vNodeList.value.length + ' ' +
    (curNode.value.title ?? "");
}

async function keymap(e: KeyboardEvent) {
  // console.info(e);
  if (mayTyping(e.target)) return;
  if (!props.modalData.layout.active) return;
  // console.info(e);
  let dirNode, parentLsQ, parentLs, len, curParentIndex, targetNode, retryCount;
  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      e.stopPropagation();
      if (["audio", "video"].indexOf(curNode.value.type ?? "") !== -1) return;
      goNav(curIndex.value, -1);
      break;
    case "ArrowRight":
      e.preventDefault();
      e.stopPropagation();
      if (["audio", "video"].indexOf(curNode.value.type ?? "") !== -1) return;
      goNav(curIndex.value, +1);
      break;
    case "PageUp":
      e.preventDefault();
      e.stopPropagation();
      goNav(curIndex.value, -1);
      break;
    case "PageDown":
      e.preventDefault();
      e.stopPropagation();
      goNav(curIndex.value, +1);
      break;
    case '[':
      //根据全局的排序方法选择下一个目录
      if (!crumbList.value.length) return;
      // const crumbLs = await getParent();
      // if (!crumbLs.path || !crumbLs.path.length) return;
      // console.info(crumbLs);
      dirNode = crumbList.value[crumbList.value.length - 1];
      parentLsQ = await getParentDir(dirNode.id_parent ?? '');
      parentLs = sortList(parentLsQ.list, sortVal.value);
      len = parentLs.length;
      if (len < 2) return;
      curParentIndex = 0;
      parentLs.forEach((node, index) => {
        if (node.id == props.data.query.pid) curParentIndex = index;
      });
      retryCount = parentLs.length;
      do {
        curParentIndex -= 1;
        while (curParentIndex < 0) curParentIndex += len;
        while (curParentIndex > len - 1) curParentIndex -= len;
        targetNode = parentLs[curParentIndex];
        props.data.query.pid = `${targetNode.id}`;
        const getNxtRst = await getList();
        if (getNxtRst) break;
      } while (--retryCount > 0);
      break;
    case ']':
      // console.info(crumbList.value);
      if (!crumbList.value.length) return;
      // const crumbLs = await getParent();
      // if (!crumbLs.path || !crumbLs.path.length) return;
      // console.info(crumbLs);
      dirNode = crumbList.value[crumbList.value.length - 1];
      parentLsQ = await getParentDir(dirNode.id_parent ?? '');
      parentLs = sortList(parentLsQ.list, sortVal.value);
      len = parentLs.length;
      if (len < 2) return;
      curParentIndex = 0;
      parentLs.forEach((node, index) => {
        if (node.id == props.data.query.pid) curParentIndex = index;
      });
      retryCount = parentLs.length;
      do {
        curParentIndex += 1;
        while (curParentIndex < 0) curParentIndex += len;
        while (curParentIndex > len - 1) curParentIndex -= len;
        targetNode = parentLs[curParentIndex];
        props.data.query.pid = `${targetNode.id}`;
        const getNxtRst = await getList();
        if (getNxtRst) break;
      } while (--retryCount > 0);
      break;
    case 'NumpadEnter':
    case 'Enter':
      break;
    case 'Delete':
      e.preventDefault();
      e.stopPropagation();
      const idSet = new Set<number>;
      idSet.add(curNode.value.id);
      await opFunctionModule.op_bath_delete(idSet, [], false, () => {
        goNav(curIndex.value, +1);
      });
      break;
  }
}

function locateCurNode(list: col_node[], node: col_node) {
  let index = 0;
  list.forEach((item, ind) => {
    // console.info(item);
    // if (item.type == 'directory') return;
    if (item.id === node.id)
      index = ind;
  });
  return index;
}

// sort btn ------------------

const sortVal: Ref<string> = ref(localConfigure.get("browser_list_sort") ?? "name_asc");

/*const sortKey = localConfigure.listen(
  "file_view_sort",
  (v) => {
    sortVal.value = v;
    const preVal = nodeList.value;
    nodeList.value = [];
    nodeList.value = sortList(preVal);
  }
);*/

function setSort(evt: Event) {
  console.info('setSort', sortVal.value, evt);
  (evt.target as HTMLInputElement)?.blur();
  // sortVal.value = val;
  const orgLs = vNodeList.value;
  vNodeList.value = [];
  sortList(orgLs, sortVal.value);
  vNodeList.value = orgLs;
  curIndex.value = locateCurNode(orgLs, curNode.value);
  modTitle();
  // localConfigure.set("file_view_sort", sortVal);
}

function sortList<K extends api_node_col>(list: K[], sort: string) {
  list = manualSort(list, sort);
  curIndex.value = locateCurNode(list, curNode.value);
  localConfigure.set("browser_list_sort", sortVal.value)
  return list;
}

// filter btn ------------------

const filterVal: Ref<string> = ref(localConfigure.get("browser_list_filter") ?? "any");

function setFilter(target: string) {
  localConfigure.set("browser_list_filter", target);
  let curNode = vNodeList.value[curIndex.value];
  let vList = buildVList();
  vNodeList.value = sortList(vList, sortVal.value);
  curIndex.value = locateCurNode(vNodeList.value, curNode);
  console.info(curIndex.value);
  onModNav();
}

// rate btn ------------------

const rateVal: Ref<string> = ref('0');

function setRater(rateVal: string) {
  let curNode = vNodeList.value[curIndex.value];
  let vList = buildVList();
  vNodeList.value = sortList(vList, sortVal.value);
  curIndex.value = locateCurNode(vNodeList.value, curNode);
  console.info(curIndex.value);
  onModNav();
}
</script>

<template>
  <component
    :is="
      curNode.type && regComponentLs[curNode.type]
        ? regComponentLs[curNode.type]
        : regComponentLs.base
    "
    :data="props.data"
    :modalData="props.modalData"
    :nodeList="nodeList"
    :curNode="curNode"
    :curIndex="curIndex"
    @nav="emitNav"
  >
    <template v-slot:info>
      <div :class="{info:true,detail:showDetail}">
        <p v-if="crumbList.length">Dir : {{ crumbList[crumbList.length - 1].title }}</p>
        <p v-if="showDetail">
          {{ curNode.title }} ({{
            GenFunc.kmgt(curNode.file_index?.raw?.size ?? 0, 2)
          }})
        </p>
        <p v-else>{{ curNode.title }}</p>
        <p v-if="showDetail" class="preLine">{{ curNode.description }}</p>
      </div>
    </template>
    <template v-slot:btnContainer>
      <!--      <div class="btnContainer">-->
      <!--      </div>-->
      <div class="btnContainer">
        <select class="sysIcon" v-model="rateVal" @change="setRater(rateVal)">
          <option v-for="(type,key) in def.rate" :value="key" v-html="type"></option>
        </select>
        <select v-model="filterVal" @change="setFilter(filterVal)">
          <option v-for="(fileType, key) in def.fileType" :value="fileType">
            {{ fileType }}
          </option>
        </select>
        <br>
        <select v-model="sortVal" @change="setSort($event)">
          <option v-for="(sortItem, key) in def.sort" :value="key">
            {{ sortItem }}
          </option>
        </select>
        <button
          :class="['sysIcon', `sysIcon_player_${playMode}`]"
          @click="togglePlayMode"
        ></button>
        <button
          :class="['sysIcon', 'sysIcon_info-cirlce-o']"
          @click="toggleDetail"
        ></button>
        <!--          <button :class="['sysIcon','sysIcon_link',]" @click="browserMeta.act.share"></button>-->
        <button
          v-if="curNode.file_index?.raw?.path"
          :class="['sysIcon', 'sysIcon_download']"
          @click="opFunctionModule.op_download(curNode)"
        ></button>
      </div>
    </template>
    <template v-slot:navigator>
      <div :class="{pagination:1,isMobile:isMobile}">
        <div class="left" @click="goNav(curIndex,-1)">
          <span class="sysIcon sysIcon_arrowleft"></span>
        </div>
        <div class="right" @click="goNav(curIndex,+1)">
          <span class="sysIcon sysIcon_arrowright"></span>
        </div>
      </div>
    </template>
  </component>
</template>

<style lang="scss">
@import "../assets/variables";
@keyframes rotateAnimate {
  0% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.modal_browser {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  //background-color: aqua;
  > div {
    position: absolute;
  }
  .info {
    padding-left: $fontSize * 0.25;
    $blurSize: $fontSize * 0.25;
    text-shadow: 0 0 $blurSize black, 0 0 $blurSize black, 0 0 $blurSize black,
    0 0 $blurSize black;
    color: map-get($colors, font);
    p:first-child {
      color: map-get($colors, font_active);
    }
    p:first-child {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 80%;
    }
    &.detail p:first-child {
      white-space: normal;
    }
  }
  .pagination {
    z-index: 5;
    pointer-events: none;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    .left,
    .right {
      height: 100%;
      pointer-events: all;
      top: 0;
      width: $fontSize * 2;
      //      background-color: blue;
      position: absolute;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      opacity: 0;
      background-color: map-get($colors, popup_active);
      &:hover {
        opacity: 1;
      }
    }
    .left {
      left: 0;
    }
    .right {
      right: 0;
    }
  }
  .pagination.isMobile {
    .left, .right {
      opacity: 1;
      background-color: transparent;
      span {
        //width: $fontSize * 2;
        //height: $fontSize * 2;
        //line-height: $fontSize * 2;
        //border-radius: $fontSize * 2;
        //background-color: map-get($colors, popup_active);
        $blurSize: $fontSize * 0.25;
        text-shadow: 0 0 $blurSize black, 0 0 $blurSize black, 0 0 $blurSize black,
        0 0 $blurSize black;
      }
    }
  }
  .content {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: hidden;
    position: relative;
  }
  .base {
    z-index: 10;
    width: 100%;
    bottom: 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    position: absolute;
    .l,
    .r {
      position: absolute;
      > *:last-child {
        margin-top: $fontSize * 0.5;
      }
    }
    .l {
      left: 0;
    }
    .r {
      right: 0;
      text-align: right;
    }
    .btnContainer {
      button, select {
        vertical-align: bottom;
        font-size: $fontSize;
        line-height: $fontSize;
      }
    }
  }
}
.loader.sysIcon {
  font-size: $fontSize*10;
  //display: block;
  text-align: center;
  z-index: 1;
  color: map-get($colors, font);
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.loader.sysIcon::before {
  display: block;
  animation: rotateAnimate 5s infinite linear;
  $blurSize: $fontSize ;
  text-shadow: 0 0 $blurSize black;
}
.modal_browser.base {
  .content {
    text-align: center;
  }
}
</style>
