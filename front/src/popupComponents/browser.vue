<script setup lang="ts">
import {onMounted, ref, watch, onUnmounted} from "vue";
import type {Ref} from "vue";
import type {ModalConstruct, ModalStruct} from "../modal";
import {queryDemo, query} from "@/Helper";
import type {api_node_col, api_file_list_resp} from "../../../share/Api";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import browserBaseVue from "./browserBase.vue";
import browserImageVue from "./browserImage.vue";
import browserAudioVue from "./browserAudio.vue";
import browserVideoVue from "./browserVideo.vue";
import browserPDFVue from "./browserPDF.vue";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {useEventStore} from "@/stores/event";
import type {type_file, col_node} from "../../../share/Database";
//------------------
const props = defineProps<{
  data: {
    query: { [key: string]: any };
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
  },
  listType: ["detail", "text", "img"],
};
const regComponentLs = {
  audio: browserAudioVue,
  video: browserVideoVue,
  image: browserImageVue,
  pdf: browserPDFVue,
  base: browserBaseVue,
} as { [key: string]: any };

//------------------
const localConfigure = useLocalConfigureStore();
//------------------
const playModes = [/*"queue",*/ "loop", "single", "shuffle"];
let playMode: Ref<string> = ref(
  localConfigure.get("browser_play_mode") ?? "loop"
);
const ignoreFileType = [
  'directory',
  'subtitle',
] as type_file[];

function togglePlayMode() {
  let curModeIndex = playModes.indexOf(playMode.value);
  curModeIndex += 1;
  if (curModeIndex > playModes.length - 1) curModeIndex = 0;
  playMode.value = playModes[curModeIndex];
  localConfigure.set("browser_play_mode", playMode.value);
  checkNext();
}

//------------------
let showDetail: Ref<boolean> = ref(
  localConfigure.get("browser_show_detail") ?? false
);

function toggleDetail() {
  showDetail.value = !showDetail.value;
  localConfigure.set("browser_show_detail", showDetail.value);
}

//------------------
onMounted(() => {
  console.info("mounted");
  document.addEventListener("keydown", keymap);
});
onUnmounted(() => {
  console.info("unmounted");
  document.removeEventListener("keydown", keymap);
});
// setTimeout(() => {
// props.modalData.base.title = "dev browser";
// }, 1000);

let crumbList: Ref<api_node_col[]> = ref([]);
//注意这个是全量的nodeList，传递到内部遍历的也是这个
let nodeList: Ref<api_node_col[]> = ref([]);
//这个是筛选后的nodeList，但是想了一下这个在导航阶段做掉就可以了
// let nodeList: Ref<api_node_col[]> = ref([]);
let curIndex: Ref<number> = ref(0);
let curNode: Ref<api_node_col> = ref({});
// onMounted(async () => {
// getList();
// });

// watch(curNode, async to => {
// })

getList();

async function getList() {
  const res = await query<api_file_list_resp>("file/get", props.data.query);
  if (!res) return;
  //
  let index = 0;
  let node = null;
  for (let i1 = 0; i1 < res.list.length; i1++) {
    if (res.list[i1].id !== props.data.curId) continue;
    index = i1;
    node = res.list[i1];
    break;
  }
  if (!node) node = res.list[0];
  // console.info(res);
  console.warn(node.title);
  crumbList.value = res.path;
  nodeList.value = sortList(res.list);
  curIndex.value = locateCurNode(nodeList.value, node);
  // nodeList.value = sortList(res.list);
  // curNode.value = node;
  // console.info(crumbList);
  onModNav();
  checkNext();
}

//------------------
let hasNext = ref(true);
let hasPrev = ref(true);

function checkNext() {
  //queue去掉以后这个没有用了
  return;
  console.info('checkNext',);
  // console.log()
  let hasPrevL = true;
  let hasNextL = true;
  //
  let validListLen = 0;
  nodeList.value.forEach((node, index) => {
    validListLen += isValidNav(index) ? 1 : 0
  })
  if (!validListLen) {
    hasPrev.value = false;
    hasNext.value = false;
    return;
  }
  let isStart = curIndex.value === 0;
  let isEnd = curIndex.value === nodeList.value.length - 1;
  console.info(isStart, isEnd);
  switch (playMode.value) {
    case "queue":
      if (isStart) hasPrevL = false;
      if (isEnd) hasNextL = false;
      break;
    case "loop":
    case "single":
    case "shuffle":
      break;
  }
  hasPrev.value = hasPrevL;
  hasNext.value = hasNextL;
  // console.info(hasPrev.value, hasNext.value)
}

//
const eventStore = useEventStore();

function goNav(curNavIndex: number, offset: number, counter: number = 0): any {
  // console.info('goNav', [curNavIndex, offset, counter,]);
  let listLen = nodeList.value.length;

  if (playMode.value === "shuffle") {
    offset = Math.round(Math.random() * listLen);
  }
  let nextIndex = curNavIndex + offset;
  while (nextIndex < 0) nextIndex += listLen;
  while (nextIndex > listLen - 1) nextIndex -= listLen;
  if (!counter) counter = 0;
  counter += 1;
  if (counter > listLen) return;
  // console.info(isValidNav(nextIndex));
  if (!isValidNav(nextIndex)) return goNav(nextIndex, offset, counter);
  curIndex.value = nextIndex;
  onModNav();
}

function emitNav(index: number) {
  let delta = index - curIndex.value;
  goNav(curIndex.value, delta);
}

function isValidNav(nextIndex: number) {
  const node = nodeList.value[nextIndex];
  // console.info([node.type, filterVal.value, ignoreFileType.indexOf(node.type ?? 'directory')]);
  if (filterVal.value != 'any') {
    return filterVal.value == node.type;
  }
  return ignoreFileType.indexOf(node.type ?? 'directory') === -1;
}

function onModNav() {
  const changeType = curNode.value.type !== nodeList.value[curIndex.value].type;
  // curIndex.value = locateCurNode(nodeList.value, curNode.value);
  curNode.value = nodeList.value[curIndex.value];
  modTitle();
  //类型相同的时候添加一个事件用于预处理
  console.warn(changeType);
  if (!changeType)
    eventStore.trigger(
      `modal_browser_change_${props.modalData.nid}`,
      curNode.value.id
    );
  checkNext();
}

function modTitle() {
  console.info(['modTitle', curIndex.value, nodeList.value.length]);
  props.modalData.base.title =
    (curIndex.value + 1) + '/' + nodeList.value.length + ' ' +
    (curNode.value.title ?? "");
}

//------------------

function keymap(e: KeyboardEvent) {
  if ((e.target as HTMLElement).tagName !== "BODY") return;
  if (!props.modalData.layout.active) return;
  if (["audio", "video"].indexOf(curNode.value.type ?? "") !== -1) return;
  // console.info(e);
  switch (e.key) {
    case "ArrowLeft":
      goNav(curIndex.value, -1);
      break;
    case "ArrowRight":
      goNav(curIndex.value, +1);
      break;
  }
}

function goDownload() {
  let filePath = curNode.value.file?.raw?.path;
  if (!filePath) return;
  window.open(`${filePath}?filename=${curNode.value.title}`);
}

function locateCurNode(list: col_node[], node: col_node) {
  let index = 0;
  list.forEach((item, ind) => {
    if (item.id === node.id)
      index = ind;
  });
  return index;
}


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

function setSort(val: string) {
  console.info('setSort', val);
  sortVal.value = val;
  const orgLs = nodeList.value;
  nodeList.value = [];
  sortList(orgLs);
  nodeList.value = orgLs;
  curIndex.value = locateCurNode(orgLs, curNode.value);
  modTitle();
  // localConfigure.set("file_view_sort", sortVal);
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
  curIndex.value = locateCurNode(nodeList.value, curNode.value);
  localConfigure.set("browser_list_sort", sortVal)
  return list;
}

const filterVal: Ref<string> = ref(localConfigure.get("browser_list_filter") ?? "any");

function setFilter(target: string) {
  localConfigure.set("browser_list_filter", target);
  checkNext();
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
      <div class="info">
        <p v-if="showDetail">
          {{ curNode.title }} ({{
            GenFunc.kmgt(curNode.file?.raw?.size ?? 0, 2)
          }})
        </p>
        <p v-else>{{ curNode.title }}</p>
        <p v-if="showDetail">{{ curNode.description }}</p>
      </div>
    </template>
    <template v-slot:btn>
      <div class="btn">
      </div>
      <div class="btn">
        <select v-model="filterVal" @change="setFilter(filterVal)">
          <option v-for="(fileType, key) in def.fileType" :value="fileType">
            {{ fileType }}
          </option>
        </select>
        <br>
        <select v-model="sortVal" @change="setSort(sortVal)">
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
          v-if="curNode.file?.raw?.path"
          :class="['sysIcon', 'sysIcon_download']"
          @click="goDownload"
        ></button>
      </div>
    </template>
    <template v-slot:navigator>
      <div class="pagination">
        <div v-if="hasPrev" class="left" @click="goNav(curIndex,-1)">
          <span class="sysIcon sysIcon_arrowleft"></span>
        </div>
        <div v-if="hasNext" class="right" @click="goNav(curIndex,+1)">
          <span class="sysIcon sysIcon_arrowright"></span>
        </div>
      </div>
    </template>
  </component>
</template>

<style lang="scss">
.modal_browser {
  width: 100%;
  height: 100%;
  position: relative;
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
  }
  .pagination {
    z-index: 1;
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
      background-color: fade-out(mkColor(map-get($colors, bk), 4), 0.5);
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
  .content {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: hidden;
    position: relative;
  }
  .base {
    z-index: 5;
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
    .btn {
      button, select {
        vertical-align: bottom;
        font-size: $fontSize;
        line-height: $fontSize;
      }
    }
  }
}
.modal_browser.base {
  .content {
    text-align: center;
  }
}
</style>
