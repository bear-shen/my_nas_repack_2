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
import {useModalStore} from "@/stores/modalStore";
//------------------
const locatorInput: Ref<HTMLInputElement | null> = ref(null);

let queryData: api_file_list_req = {
  mode: 'search',
  pid: '',
  keyword: '',
  tag_id: '',
  dir_only: '',
  node_type: 'directory',
  with: 'crumb',
  group: '',
  limit: '20',
};

const props = defineProps<{
  data: {
    query: api_file_list_req;
    call: (node: api_node_col) => any;
    [key: string]: any;
  };
  modalData: ModalStruct;
}>();
// const list = ref(new Map() as Map<string, uploadFile>);
const list = ref([] as api_node_col[]);
onMounted(() => {
  Object.assign(queryData, JSON.parse(JSON.stringify(props.data.query)));
  locatorInput.value?.focus();
});
onUnmounted(() => {
});

async function getList() {
  const res = await query<api_file_list_resp>("file/get", queryData);
  if (!res || !res.list) return;
  if (queryData.keyword === 'root') {
    res.list.unshift({
      id: 0,
      title: 'root',
      description: '',
      type: 'directory',
      crumb_node: [],
    })
  }
  list.value = res.list;
  if (list.value.length) {
    if (props.modalData.layout.h < 220) {
      props.modalData.layout.h = 220;
    }
  }
}


async function onChange(e: KeyboardEvent) {
  console.info(e);
  GenFunc.debounce(() => {
    let val = locatorInput.value?.value;
    if (!val || !val.length) {
      list.value = [];
      return;
    }
    console.info(val);
    console.info(props.modalData);
    queryData.keyword = val;
    getList();
  }, 200, 'locator');
}

async function onConfirm(node: api_node_col) {
  console.info(node);
  const modalStore = useModalStore();
  const res = await props.data.call(node);
  if (!res)
    return modalStore.close(props.modalData.nid);
}

// async function onSwitch() {
// }
</script>

<template>
  <div class="modal_locator">
    <input type="text"
           class="locator_input"
           placeholder="type title/desc here ..."
           ref="locatorInput"
           @keydown="onChange"
    >
    <div class="locator_list">
      <div v-for="node in list" @click="onConfirm(node)">
        <p class="type">
          {{ node.type }}
        </p>
        <p class="tree">
          <span class="title">{{ node.title }}</span>
          <span v-if="node.crumb_node" v-for="dir in node.crumb_node.reverse()">
            {{ dir.title }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.modal_locator {
  width: 100%;
  //min-height: 90%;
  position: relative;
  .locator_input {
    @include fillAvailable(width);
  }
  .locator_list {
    //top: 0;
    //position: absolute;
    margin-top: $fontSize*0.5;
    width: 100%;
    max-height: $fontSize*10;
    overflow: auto;
    position: relative;
    @include smallScroll();
    font-size: $fontSize*0.8;
    > div {
      @include fillAvailable(width);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      //display: flex;
      //justify-content: space-between;
      .type {
        width: $fontSize*4;
        display: inline-block;
      }
      .tree {
        display: inline;
        > span {
          &:first-child {
            color: map-get($colors, font);
          }
          color: map-get($colors, font_sub);
          &::after {
            content: '/';
            padding: 0 $fontSize*0.25;
          }
        }
      }
      &:hover {
        background-color: mkColor(map-get($colors, bk), 6);
        cursor: pointer;
      }
    }
    /*> div {
      @include fillAvailable(width);
      overflow: hidden;
      display: table-row;
      flex-wrap: nowrap;
      justify-content: space-between;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: $fontSize * 0.8;
      line-height: $fontSize * 1.5;
      padding: 0 $fontSize * 0.25;
      > div {
        display: table-cell;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 50%;
      }
      &:nth-child(2n) {
        background-color: mkColor(map-get($colors, bk), 4);
      }
      > span {
        display: inline-block;
      }
      .title {
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }*/
  }
  .upload_menu {
    text-align: center;
  }
}
</style>
