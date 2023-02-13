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
import type {col_node, type_file} from "../../../share/Database";
import type {api_file_list_req} from "../../../share/Api";
//------------------

let queryData = {
  sort: "",
  type: "",
  keyword: "",
  pid: "",
  tid: "",
} as api_file_list_req;

const props = defineProps<{
  data: {
    query: api_file_list_req;
    call: number;
    [key: string]: any;
  };
  modalData: ModalStruct;
}>();
// const list = ref(new Map() as Map<string, uploadFile>);
const list = ref([] as col_node[]);
onMounted(() => {
});
onUnmounted(() => {
});

async function getList() {
  const res = await query<api_file_list_resp>("file/get", queryData);
  if (!res) return;
  // console.info(res);
  // console.info(crumbList);
}
async function onChange() {
}

async function onConfirm() {
}

async function onSwitch() {
}
</script>

<template>
  <div class="modal_locator">
    <input type="text"
           class="locator_input"
           placeholder="type title/desc here ..."
    >
    <div class="locator_list">
      <!-- <div v-for="[key, file] in list"> -->
      <div v-for="(file,index) in list">
        <div class="title">{{ file.name }}</div>
        <div class="meta">
          <span v-if="file.status==='uploading'">
            {{ parseInt(100 * file.loaded / file.size) }} %
          </span>
          <span v-else>{{ file.status }}</span>
          <span>{{ GenFunc.kmgt(file.size) }}</span>
          <span v-if="file.status==='waiting'"
                @click="remove(index)"
                class="pointer"
          >X</span>
        </div>
      </div>
    </div>
    <div class="upload_menu">
      <button v-if="!uploading" @click="goUpload">upload</button>
      <button v-else>uploading</button>
    </div>
  </div>
</template>

<style lang="scss">
.modal_locator {
  width: 100%;
  min-height: 90%;
  position: relative;
  .locator_input{
    @include fillAvailable(width);
  }
  .upload_list {
    height: calc(100% - $fontSize * 2);
    overflow: auto;
    @include smallScroll();
    > div {
      @include fillAvailable(width);
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
