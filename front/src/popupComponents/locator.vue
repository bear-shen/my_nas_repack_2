<script setup lang="ts">
import type {Ref} from "vue";
import {onMounted, onUnmounted, ref} from "vue";
import type {ModalStruct} from "@/modal";
import {query} from "@/Helper";
import type {api_file_list_req, api_file_list_resp, api_node_col} from "../../../share/Api";
import GenFunc from "@/GenFunc";
import {useModalStore} from "@/stores/modalStore";


type valType = api_node_col & { _sel?: boolean };
//------------------
const locatorInput: Ref<HTMLInputElement | null> = ref(null);

let queryData: api_file_list_req = {
  mode: 'directory',
  id_dir: '',
  keyword: '',
  id_tag: '',
  cascade_dir: '1',
  node_type: 'directory',
  with: 'crumb',
  limit: '20',
};

const props = defineProps<{
  data: {
    query: api_file_list_req;
    call: (node: valType) => any;
    [key: string]: any;
  };
  modalData: ModalStruct;
}>();
// const list = ref(new Map() as Map<string, uploadFile>);
const list: Ref<valType[]> = ref([] as valType[]);
onMounted(() => {
  // Object.assign(queryData, JSON.parse(JSON.stringify(props.data.query)));
  locatorInput.value?.focus();
});
onUnmounted(() => {
});

async function getList() {
  const res = await query<api_file_list_resp>("file/get", queryData);
  if (!res || !res.list) return;
  if (queryData.keyword && 'root'.indexOf(queryData.keyword) !== -1) {
    res.list.unshift({
      id: 0, title: 'root', status: 1, type: 'directory', crumb_node: [],
    });
  }
  list.value = res.list;
  if (list.value.length) {
    list.value[0]._sel = true;
    if (props.modalData.layout.h < 220) {
      props.modalData.layout.h = 220;
    }
  }
}


async function onChange(e: KeyboardEvent) {
  console.info(e);
  const useHotkey = await keydownEvt(e);
  if (useHotkey) return;
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

async function onConfirm(node: valType) {
  console.info(node);
  const modalStore = useModalStore();
  const res = await props.data.call(node);
  if (!res)
    return modalStore.close(props.modalData.nid);
}

// async function onSwitch() {
// }


async function keydownEvt(e: KeyboardEvent): Promise<boolean> {
  let curIndex: number, targetIndex: number;
  let hasHotkey = false;
  switch (e.code) {
    case 'ArrowDown':
      hasHotkey = true;
      e.stopPropagation();
      e.preventDefault();
      if (!list.value.length) break;
      curIndex = -1;
      list.value.forEach((item, index) => {
        if (item._sel) curIndex = index;
      });
      targetIndex = curIndex + 1;
      while (targetIndex < 0) {
        targetIndex += list.value.length;
      }
      while (targetIndex >= list.value.length) {
        targetIndex -= list.value.length;
      }
      list.value.forEach((item, index) => {
        item._sel = index == targetIndex;
      });
      break;
    case 'ArrowUp':
      hasHotkey = true;
      e.stopPropagation();
      e.preventDefault();
      if (!list.value.length) break;
      curIndex = 0;
      list.value.forEach((item, index) => {
        if (item._sel) curIndex = index;
      });
      targetIndex = curIndex - 1;
      while (targetIndex < 0) {
        targetIndex += list.value.length;
      }
      while (targetIndex >= list.value.length) {
        targetIndex -= list.value.length;
      }
      list.value.forEach((item, index) => {
        item._sel = index == targetIndex;
      });
      break;
    case 'NumpadEnter':
    case 'Enter':
      hasHotkey = true;
      e.stopPropagation();
      e.preventDefault();
      if (!list.value.length) break;
      curIndex = -1;
      list.value.forEach((item, index) => {
        if (item._sel) curIndex = index;
      });
      if (curIndex == -1) break;
      const curItem = list.value[curIndex];
      onConfirm(curItem);
      break;
  }
  return hasHotkey;
}
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
      <div v-for="node in list" @click="onConfirm(node)"
           :class="{active:node._sel}"
      >
        <p class="type">
          {{ node.type }}
        </p>
        <p class="tree">
          <span class="title">{{ node.title }}</span>
          <span v-if="node.crumb_node" v-for="dir in node.crumb_node">
            {{ dir.title }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
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
    //@include smallScroll();
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
            color:  map.get($colors, font);
          }
          color:  map.get($colors, font_sub);
          &::after {
            content: '/';
            padding: 0 $fontSize*0.25;
          }
        }
      }
      &:hover, &.active {
        background-color:  map.get($colors, bk_active);
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
        background-color:  map.get($colors, bk), 4
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
