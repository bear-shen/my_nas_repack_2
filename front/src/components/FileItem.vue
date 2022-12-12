<script setup lang="ts">
import { useLocalConfigureStore } from "@/stores/localConfigure";
import { onMounted } from "vue";
import type { api_node_col } from "../../../share/Api";
defineProps<{
  node: api_node_col;
}>();
//
const localConfigure = useLocalConfigureStore();
let mode = localConfigure.get("file_view_mode") ?? "detail";
localConfigure.watch("file_view_mode", (v) => (mode = v));
//
onMounted(() => {
  console.info();
});
let renaming = false;
let tagging = false;
function go() {}
function op_download() {}
function op_rename() {}
function op_move() {}
function op_tag() {}
function op_imp_tag_eh() {}
function op_set_cover() {}
function op_set_favourite() {}
function op_delete_forever() {}
function op_delete() {}
</script>

<template>
  <div class="node_node">
    <div class="content">
      <div v-if="node.file?.cover" class="thumb">
        <img :src="node.file?.cover.path" />
      </div>
      <div
        v-else
        :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
      ></div>
      <div class="meta">
        <p class="title">{{ node.title }}</p>
        <p v-if="node.description">{{ node.description }}</p>
        <p>{{ node.time_update }}</p>
        <p class="bar">
          <!---->
          <button
            v-if="node.is_file"
            :class="['sysIcon', 'sysIcon_download']"
            @click="op_download"
          >
            DL
          </button>
          <button
            v-if="!node.is_file"
            :class="['sysIcon', 'sysIcon_stack']"
            @click="go"
          >
            IN
          </button>
          <button
            :class="['sysIcon', 'sysIcon_edit', { active: renaming }]"
            @click="op_rename"
          >
            RN
          </button>
          <button :class="['sysIcon', 'sysIcon_folderopen']" @click="op_move">
            MV
          </button>
          <button
            :class="['sysIcon', 'sysIcon_tag-o', { active: tagging }]"
            @click="op_tag"
          >
            TAG
          </button>
          <button :class="['sysIcon', 'sysIcon_tag-o']" @click="op_imp_tag_eh">
            IMP EH TAG
          </button>
          <button
            v-if="node.file?.cover?.path"
            :class="['sysIcon', 'sysIcon_scan']"
            @click="op_set_cover"
          >
            COV
          </button>
          <button
            :class="['sysIcon', 'sysIcon_star-o', { active: node.is_fav }]"
            @click="op_set_favourite"
          >
            FAV
          </button>
          <!--        <button :class="['sysIcon','sysIcon_link',]" @click="op_share">SHR</button>-->
          <template v-if="node.status">
            <button :class="['sysIcon', 'sysIcon_delete']" @click="op_delete">
              DEL
            </button>
          </template>
          <template v-else>
            <button
              :class="['sysIcon', 'sysIcon_delete']"
              @click="op_delete_forever"
            >
              rDEL
            </button>
            <button :class="['sysIcon', 'sysIcon_delete']" @click="op_delete">
              REC
            </button>
          </template>
        </p>
      </div>
    </div>
    <div v-if="node.tag" class="tag_list"></div>
  </div>
</template>

<style scoped lang="scss">
.node_node {
  padding: 0 0 $fontSize * 0.5 0;
  display: block;
  $contentHeight: $fontSize * 5;
  .content {
    display: flex;
    min-height: $contentHeight;
    .thumb {
      width: calc(25% - $fontSize);
      padding: 0 $fontSize * 0.5;
      text-align: center;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
    .listIcon {
      line-height: $contentHeight;
      font-size: $contentHeight * 0.6;
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
