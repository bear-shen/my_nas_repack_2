<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { Ref } from "vue";
import type { ModalConstruct, ModalStruct } from "../modal";
import { queryDemo, query } from "@/Helper";
import type { api_node_col, api_file_list_resp } from "../../../share/Api";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import browserBaseVue from "./browserBase.vue";
const props = defineProps<{
  data: { [key: string]: any };
  modalData: ModalStruct;
}>();

const regComponentLs = {
  base: browserBaseVue,
} as { [key: string]: any };

onMounted(() => {
  console.info("mounted");
});
setTimeout(() => {
  props.modalData.base.title = "dev browser";
}, 1000);

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
    query,
    smp_file_list_resp
  );
  // console.info(res);
  crumbList.value = res.path;
  nodeList.value = res.list;
  curIndex.value = 3;
  curNode.value = res.list[3];
  // console.info(crumbList);
}

const modes = ["queue", "loop", "single", "shuffle"];
let playMode = "loop";
let showDetail = true;
function togglePlayMode() {}
function toggleDetail() {}
function goDownload() {}
//
function goNext() {
  curIndex.value += 1;
  goNav();
}
function goPrev() {
  curIndex.value -= 1;
  goNav();
}
function goNav() {
  if (curIndex.value < 0) curIndex.value = nodeList.value.length - 1;
  curNode.value = nodeList.value[curIndex.value];
}
</script>

<template>
  <component
    :is="
      regComponentLs[curNode.type ?? '']
        ? regComponentLs[curNode.type ?? '']
        : regComponentLs.base
    "
    :data="props.data"
    :modalData="props.modalData"
    :nodeList="nodeList"
    :curNode="curNode"
    :curIndex="curIndex"
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
          :class="['sysIcon', 'sysIcon_download']"
          @click="goDownload"
        ></button>
      </div>
    </template>
    <template v-slot:navigator>
      <div class="pagination">
        <div class="left" @click="goPrev">
          <span class="sysIcon sysIcon_arrowleft"></span>
        </div>
        <div class="right" @click="goNext">
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
  }
  .base {
    z-index: 5;
    width: 100%;
    bottom: 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
}
</style>
