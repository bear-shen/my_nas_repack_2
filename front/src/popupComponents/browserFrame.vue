<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Ref } from "vue";
import type { ModalConstruct, ModalStruct } from "../modal";
import { queryDemo, query } from "@/Helper";
import type { api_node_col, api_file_list_resp } from "../../../share/Api";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
const props = defineProps<{
  data: { [key: string]: any };
  modalData: ModalStruct;
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
  <div class="modal_browser">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <div class="info">
          <p v-if="showDetail">
            {{ curNode.title }} ({{
              GenFunc.kmgt(curNode.file?.raw?.size ?? 0, 2)
            }})
          </p>
          <p v-else>{{ curNode.title }}</p>
          <p v-if="showDetail">{{ curNode.description }}</p>
        </div>
        <div class="btn">
          <button :class="['sysIcon', 'sysIcon_info-cirlce-o']"></button>
          <button :class="['sysIcon', 'sysIcon_info-cirlce-o']"></button>
          <button :class="['sysIcon', 'sysIcon_info-cirlce-o']"></button>
          <button :class="['sysIcon', 'sysIcon_info-cirlce-o']"></button>
        </div>
      </div>
      <div class="r">
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
      </div>
    </div>
    <div class="pagination">
      <div class="left" @click="goPrev">
        <span class="sysIcon sysIcon_arrowleft"></span>
      </div>
      <div class="right" @click="goNext">
        <span class="sysIcon sysIcon_arrowright"></span>
      </div>
    </div>
    <div class="content">browser content</div>
  </div>
</template>

<style scoped lang="scss">
.browser {
  background-color: aqua;
  .pagination {
    background-color: blue;
  }
}
</style>
