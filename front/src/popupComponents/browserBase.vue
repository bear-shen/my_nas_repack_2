<script setup lang="ts">
import { onMounted, ref, type Ref } from "vue";
import type { ModalConstruct, ModalStruct } from "../modal";
import { queryDemo, query } from "@/Helper";
import type { api_node_col, api_file_list_resp } from "../../../share/Api";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
const props = defineProps<{
  data: { [key: string]: any };
  modalData: ModalStruct;
  nodeList: api_node_col;
  curIndex: api_node_col;
  curNode: api_node_col;
}>();
onMounted(() => {
  console.info("mounted");
});
setTimeout(() => {
  props.modalData.base.title = "dev browser";
}, 1000);

let crumbList: Ref<api_node_col[]> = ref([]);
let nodeList: Ref<api_node_col[]> = ref([]);
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
  curNode.value = res.list[3];
  // console.info(crumbList);
}

const modes = ["queue", "loop", "single", "shuffle"];
let playMode = "loop";
let showDetail = true;
function togglePlayMode() {}
function toggleDetail() {}
function goDownload() {}
function goNext() {}
function goPrev() {}
</script>

<template>
  <div class="modal_browser base">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <slot name="info"></slot>
        <div class="btn">
          <button :class="['sysIcon', 'sysIcon_info-cirlce-o']"></button>
          <button :class="['sysIcon', 'sysIcon_info-cirlce-o']"></button>
          <button :class="['sysIcon', 'sysIcon_info-cirlce-o']"></button>
          <button :class="['sysIcon', 'sysIcon_info-cirlce-o']"></button>
        </div>
      </div>
      <div class="r">
        <slot name="btn"></slot>
      </div>
    </div>
    <slot name="navigator"></slot>
    <div class="content">
      <!-- {{ props.curNode.title }} -->
      <span
        :class="['listIcon', `listIcon_file_${props.curNode.type}`]"
        :style="{
          fontSize: props.modalData.layout.h * 0.5 + 'px',
          lineHeight: props.modalData.layout.h * 0.8 + 'px',
        }"
      ></span>
    </div>
  </div>
</template>

<style lang="scss">
.modal_browser.base {
  .content {
    text-align: center;
  }
  .navigator {
  }
  .base {
  }
  .info {
  }
}
</style>
