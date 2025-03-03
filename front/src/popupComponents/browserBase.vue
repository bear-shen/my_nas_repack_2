<script setup lang="ts">
import {onMounted, ref, type Ref} from "vue";
import type {ModalConstruct, ModalStruct} from "@/types/modal";
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
  <div class="modal_browser base">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <slot name="info"></slot>
        <!-- <div class="btn"></div> -->
      </div>
      <div class="r">
        <slot name="btnContainer"></slot>
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
@use "sass:map";
@use '@/assets/variables.scss' as *;
</style>
