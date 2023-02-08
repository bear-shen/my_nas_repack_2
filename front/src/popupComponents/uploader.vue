<script setup lang="ts">
import {onMounted, ref, watch, onUnmounted} from "vue";
import type {Ref} from "vue";
import type {ModalConstruct, ModalStruct} from "@/modal";
import {queryDemo, query} from "@/Helper";
import type {api_node_col, api_file_list_resp, api_file_upload_resp} from "../../../share/Api";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import browserBaseVue from "./browserBase.vue";
import browserImageVue from "./browserImage.vue";
import browserAudioVue from "./browserAudio.vue";
import browserVideoVue from "./browserVideo.vue";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {useEventStore} from "@/stores/event";
import type {type_file} from "../../../share/Database";
//------------------
const props = defineProps<{
  data: {
    pid: number;
    [key: string]: any;
  };
  modalData: ModalStruct;
}>();
type uploadFile = {
  size: number;
  name: string;
  loaded: number;
  status: "waiting" | "uploading" | "complete" | "error";
  start: number;
  file: File;
};
// const list = ref(new Map() as Map<string, uploadFile>);
const list = ref([] as uploadFile[]);
onMounted(() => {
});
onUnmounted(() => {
});

function onDrop(e: DragEvent) {
  console.debug("onDrag", e.type, e.dataTransfer?.files, e);
  e.preventDefault();
  e.stopPropagation();
  if (!e.dataTransfer || !e.dataTransfer.files.length) return;
  for (let i1 = 0; i1 < e.dataTransfer?.files.length; i1++) {
    const item = e.dataTransfer?.files[i1] as File;
    // list.value.set(Math.random().toString(32), {
    list.value.push({
      name: item.name,
      size: item.size,
      file: item,
      status: "waiting",
      loaded: 0,
      start: 0,
    });
  }
}

function onDragover(e: DragEvent) {
  e.stopPropagation();
  e.preventDefault();
}

async function goUpload() {
  console.info("goUpload");
  for (let i1 = 0; i1 < list.value.length; i1++) {
    if (list.value[i1].status !== "waiting") continue;
    uploadFile(list.value[i1]);
  }
}

async function uploadFile(file: uploadFile) {
  const formData = new FormData();
  formData.set('pid', `${props.data.pid}`);
  formData.set('file', file.file);
  const res = await query<api_file_upload_resp>('file/upd', formData, {
    upload: (e) => {
      console.info(e);
    }
  });
}
</script>

<template>
  <div class="modal_uploader" @drop="onDrop" @dragover="onDragover">
    <div class="upload_list">
      <!-- <div v-for="[key, file] in list"> -->
      <div v-for="file in list">
        <div class="title">{{ file.name }}</div>
        <div class="meta">
          <span>{{ file.status }}</span>
          <span>{{ GenFunc.kmgt(file.size) }}</span>
        </div>
      </div>
      <div>drag / drop files here...</div>
    </div>
    <div class="upload_menu">
      <button @click="goUpload">upload</button>
    </div>
  </div>
</template>

<style lang="scss">
.modal_uploader {
  width: 100%;
  height: 100%;
  position: relative;
  .upload_list {
    height: calc(100% - $fontSize * 2);
    overflow: auto;
    @include smallScroll();
    > div {
      width: calc(100% - $fontSize * 0.5);
      overflow: hidden;
      display: flex;
      flex-wrap: nowrap;
      justify-content: space-between;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: $fontSize * 0.8;
      line-height: $fontSize * 1.5;
      padding: 0 $fontSize * 0.25;
      &:nth-child(2n) {
        background-color: mkColor(map-get($colors, bk), 4);
      }
      > span {
        display: inline-block;
      }
      .title {
        max-width: 60%;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .meta {
        span:last-child {
          margin-left: $fontSize;
        }
      }
    }
  }
  .upload_menu {
    text-align: center;
  }
}
</style>
