<script setup lang="ts">
import type { nodePropsType } from '@/types/browser';


const props = defineProps<{
  extId: string,
  curIndex: number,
  isActive: boolean,
  //
  file: nodePropsType,
  dom:{
    w:number,
    h:number,
  }
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
      <span
        :class="['listIcon', 'listIcon_file_binary']"
      ></span>
      <span class="title">{{ props.file.title }}</span>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
</style>
