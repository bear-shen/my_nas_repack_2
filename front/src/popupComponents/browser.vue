<script setup lang="ts">
import { onMounted } from "vue";
import type { ModalConstruct, ModalStruct } from "../modal";
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
</script>

<template>
  <div class="browser">
    <div class="controller"></div>
    <div class="pagination"></div>
    <div class="info"></div>
    <div class="content">browser content</div>
  </div>
</template>

<style scoped lang="scss">
.browser {
  width: 100%;
  height: 100%;
}
</style>
