<script setup lang="ts">
import { useLocalConfigureStore } from "@/stores/localConfigure";
import { onMounted } from "vue";
import type { api_node_col } from "../../../share/Api";
defineProps<{
  nodeData: api_node_col;
}>();
//
const localConfigure = useLocalConfigureStore();
let mode = localConfigure.get("file_view_mode") ?? "detail";
localConfigure.watch("file_view_mode", (v) => (mode = v));
//
onMounted(() => {
  console.info();
});
</script>

<template>
  <div class="node_item">
    <div class="content">
      <div v-if="nodeData.file?.cover" class="thumb">
        <img :src="nodeData.file?.cover.path" />
      </div>
      <div v-else-if="nodeData.file?.preview" class="thumb">
        <img :src="nodeData.file?.preview.path" />
      </div>
      <div
        v-else
        :class="['thumb', 'listIcon', `listIcon_file_${nodeData.type}`]"
      ></div>
      <div class="meta">
        <p>{{ nodeData.title }}</p>
        <p v-if="nodeData.description">{{ nodeData.description }}</p>
        <p>{{ nodeData.time_update }}</p>
      </div>
    </div>
    <div v-if="nodeData.tag" class="tag_list"></div>
  </div>
</template>

<style scoped lang="scss">
.node_item {
  display: block;
  > div {
    height: $fontSize * 10;
  }
  .content {
    display: flex;
    .thumb {
      width: 25%;
      text-align: center;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
    .listIcon {
      font-size: $fontSize * 5;
    }
    .meta {
      width: 75%;
    }
  }
  .tag_list {
    width: 100%;
  }

  p {
    font-size: $fontSize;
  }
}
</style>
