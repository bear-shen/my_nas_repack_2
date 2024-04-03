<script setup lang="ts">
import {onMounted, ref, type Ref} from "vue";
import type {ModalConstruct, ModalStruct} from "../modal";
import {queryDemo, query} from "@/Helper";
import type {api_node_col, api_file_list_resp} from "../../../share/Api";
import GenFunc from "@/GenFunc";

const props = defineProps<{
  data: { [key: string]: any };
  modalData: ModalStruct;
  nodeList: api_node_col[];
  curIndex: number;
  curNode: api_node_col;
}>();
</script>

<template>
  <div class="modal_browser pdf">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <slot name="info"></slot>
        <!-- <div class="btnContainer"></div> -->
      </div>
      <div class="r">
        <slot name="btnContainer"></slot>
      </div>
    </div>
    <slot name="navigator"></slot>
    <div class="content">
      <embed type="application/pdf" :src="`${props.curNode.file_index?.raw?.path}?filename=${props.curNode.title}`" frameborder="0" allowfullscreen/>
    </div>
  </div>
</template>

<style lang="scss">
@import "../assets/variables";
.modal_browser.pdf {
  .content {
    text-align: center;
    embed {
      width: 100%;
      height: 100%;
    }
  }
  /*.navigator {
  }
  .base {
  }
  .info {
  }*/
}
</style>
