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
    emitGo: Function;
    [key: string]: any;
  };
  modalData: ModalStruct;
}>();
type uploadFileType = {
  size: number;
  name: string;
  loaded: number;
  status: "waiting" | "uploading" | "complete" | "error";
  start: number;
  file: File;
};
// const list = ref(new Map() as Map<string, uploadFileType>);
const list = ref([] as uploadFileType[]);
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

let uploading = ref(false);

async function goUpload() {
  if (!list.value.length) return;
  uploading.value = true;
  console.info("goUpload");
  for (let i1 = 0; i1 < list.value.length; i1++) {
    if (list.value[i1].status !== "waiting") continue;
    await uploadFile(list.value[i1]);
  }
  uploading.value = false;
  props.data.emitGo('reload');
}

async function uploadFile(file: uploadFileType) {
  const formData = new FormData();
  formData.set('pid', `${props.data.pid}`);
  formData.set('file', file.file);
  file.status = 'uploading';
  const res = await query<api_file_upload_resp>('file/upd', formData, {
    upload: (e) => {
      // console.info(e);
      file.loaded = e.loaded;
    }
  });
  file.status = 'complete';
}

function remove(index: number) {
  list.value.splice(index, 1);
}
</script>

<template>
  <div class="modal_uploader" @drop="onDrop" @dragover="onDragover">
    <div class="upload_list">
      <!-- <div v-for="[key, file] in list"> -->
      <div v-for="(file,index) in list" :key='`file_upload_${index}`'>
        <div class="title">{{ file.name }}</div>
        <div class="meta">
          <span v-if="file.status==='uploading'">
            {{ Math.round(100 * file.loaded / file.size) }} %
          </span>
          <span v-else>{{ file.status }}</span>
          <span>{{ GenFunc.kmgt(file.size) }}</span>
          <span v-if="file.status==='waiting'"
                @click="remove(index)"
                class="pointer"
          >X</span>
        </div>
      </div>
      <div>drag / drop files here...</div>
    </div>
    <div class="upload_menu">
      <button v-if="!uploading" @click="goUpload">upload</button>
      <button v-else>uploading</button>
    </div>
  </div>
</template>

<style lang="scss">
@import "../assets/variables";
.modal_uploader {
  width: 100%;
  //height: calc(100% - $fontSize);
  @include fillAvailable(height);
  position: relative;
  .upload_list {
    height: calc(100% - $fontSize * 2);
    overflow: auto;
    @include smallScroll();
    > div {
      @include fillAvailable(width);
      //width: calc(100% - $fontSize * 0.5);
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
        background-color: map-get($colors, popup_active);
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
        span {
          margin-left: $fontSize*0.5;
        }
      }
    }
  }
  .upload_menu {
    text-align: center;
  }
}
</style>
