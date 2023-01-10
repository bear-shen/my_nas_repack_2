<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { Ref } from "vue";
import type { ModalConstruct, ModalStruct } from "../modal";
import { queryDemo, query } from "@/Helper";
import type { api_node_col, api_file_list_resp } from "../../../share/Api";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import browserBaseVue from "./browserBase.vue";
import browserImageVue from "./browserImage.vue";
import browserAudioVue from "./browserAudio.vue";
import browserVideoVue from "./browserVideo.vue";
import { useLocalConfigureStore } from "@/stores/localConfigure";
import { useEventStore } from "@/stores/event";
import type { type_file } from "../../../share/Database";
//------------------
const props = defineProps<{
  data: {
    query: { [key: string]: any };
    curId: number;
    [key: string]: any;
  };
  modalData: ModalStruct;
}>();
const regComponentLs = {
  audio: browserAudioVue,
  video: browserVideoVue,
  image: browserImageVue,
  base: browserBaseVue,
} as { [key: string]: any };

//------------------
const localConfigure = useLocalConfigureStore();
//------------------
const playModes = ["queue", "loop", "single", "shuffle"];
let playMode: Ref<string> = ref(
  localConfigure.get("browser_play_mode") ?? "loop"
);
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
/* onMounted(() => {
  console.info("mounted");
});
setTimeout(() => {
  props.modalData.base.title = "dev browser";
}, 1000); */

let crumbList: Ref<api_node_col[]> = ref([]);
let nodeList: Ref<api_node_col[]> = ref([]);
let curIndex: Ref<number> = ref(0);
let curNode: Ref<api_node_col> = ref({});
// onMounted(async () => {
// getList();
// });
getList();
async function getList() {
  const res: api_file_list_resp = await queryDemo(
    "file/get",
    props.data.query,
    smp_file_list_resp
  );
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
  crumbList.value = res.path;
  nodeList.value = res.list;
  curIndex.value = index;
  curNode.value = node;
  // console.info(crumbList);
  checkNext();
}

//------------------
let hasNext = ref(true);
let hasPrev = ref(true);
function checkNext() {
  let isEnd = false;
  let isStart = false;
  let listLen = nodeList.value.length;
  if (listLen < 1) {
    hasNext.value = false;
    hasPrev.value = false;
    return;
  }
  if (curIndex.value === 0) isStart = true;
  if (curIndex.value === listLen - 1) isEnd = true;
  switch (playMode.value) {
    case "queue":
      if (isEnd) hasNext.value = false;
      if (isStart) hasPrev.value = false;
      return;
      break;
    case "loop":
    case "single":
    case "shuffle":
      hasNext.value = true;
      hasPrev.value = true;
      break;
  }
}
//
const eventStore = useEventStore();
function goNext() {
  let listLen = nodeList.value.length;
  if (playMode.value === "shuffle") {
    curIndex.value += Math.round(Math.random() * listLen);
  } else {
    curIndex.value += 1;
  }
  goNav();
}
function goPrev() {
  let listLen = nodeList.value.length;
  if (playMode.value === "shuffle") {
    curIndex.value += Math.round(Math.random() * listLen);
  } else {
    curIndex.value -= 1;
  }
  goNav();
}
function emitNav(index: number) {
  let listLen = nodeList.value.length;
  if (playMode.value === "shuffle") {
    curIndex.value += Math.round(Math.random() * listLen);
  } else {
    curIndex.value = index;
  }
  goNav();
}
function goNav() {
  const listLen = nodeList.value.length;
  if (curIndex.value < 0) curIndex.value = nodeList.value.length - 1;
  while (curIndex.value > listLen - 1) curIndex.value -= listLen;
  const changeType = curNode.value.type !== nodeList.value[curIndex.value].type;
  curNode.value = nodeList.value[curIndex.value];
  props.modalData.base.title = curNode.value.title ?? "";
  console.warn(changeType);
  //类型相同的时候添加一个事件用于预处理
  if (!changeType)
    eventStore.trigger(
      `modal_browser_change_${props.modalData.nid}`,
      curNode.value.id
    );
  checkNext();
}
//------------------

function goDownload() {}
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
        <div v-if="hasPrev" class="left" @click="goPrev">
          <span class="sysIcon sysIcon_arrowleft"></span>
        </div>
        <div v-if="hasNext" class="right" @click="goNext">
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
    text-shadow: 1px 1px 1px black;
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
    .l,
    .r {
      > *:last-child {
        margin-top: $fontSize * 0.5;
      }
    }
    .r {
      text-align: right;
    }
  }
}
</style>
