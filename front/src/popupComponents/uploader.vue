<script setup lang="ts">
import {onMounted, ref, watch, onUnmounted} from "vue";
import type {Ref} from "vue";
import type {ModalConstruct, ModalStruct} from "@/types/modal";
import {queryDemo, query} from "@/Helper";
import type {api_node_col, api_file_list_resp, api_file_upload_resp} from "../../../share/Api";
import GenFunc from "@/GenFunc";
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
  name: string;
  size: number;
  file: File;
  isDir: boolean;
  status: "waiting" | "uploading" | "complete" | "error";
  start: number;
  loaded: number;
};
// const list = ref(new Map() as Map<string, uploadFileType>);
const list: Ref<uploadFileType[]> = ref([]);
const pidMap: Map<string, number> = new Map<string, number>();
onMounted(() => {
});
onUnmounted(() => {
});

function onSelectFile(e: MouseEvent) {
  console.info('onSelectFile', e);
  const input = document.createElement('input');
  input.type = 'file';
  input.setAttribute('multiple', true);
  input.onchange = (e) => {
    if (!input.files?.length) return;
    for (let i1 = 0; i1 < input.files.length; i1++) {
      const file = input.files[i1];
      list.value.push({
        name: '/' + file.name,
        size: file.size,
        file: file,
        isDir: false,
        status: "waiting",
        start: 0,
        loaded: 0,
      } as uploadFileType);
    }
  };
  input.click();
}

function onDrop(e: DragEvent) {
  console.debug("onDrop", e.type, e.dataTransfer?.files, e);
  e.preventDefault();
  e.stopPropagation();
  if (!e.dataTransfer || !e.dataTransfer.files.length) return;
  for (let i1 = 0; i1 < e.dataTransfer?.files.length; i1++) {
    const item = e.dataTransfer?.items[i1];
    const entry = item.webkitGetAsEntry();
    // list.value.set(Math.random().toString(32), {
    if (entry.isFile) {
      const file = item.getAsFile();
      list.value.push({
        name: entry.fullPath,
        size: file.size,
        file: file,
        isDir: false,
        status: "waiting",
        start: 0,
        loaded: 0,
      } as uploadFileType);
    } else {
      recursiveReader(entry).then(sList => {
        sList.forEach(s => list.value.push(s));
      });
    }
  }
  console.info(list.value);
}


async function recursiveReader(dirEntry: FileSystemDirectoryEntry): Promise<uploadFileType[]> {
  const ls: uploadFileType[] = [];
  ls.push({
    name: dirEntry.fullPath,
    size: 0,
    file: null,
    isDir: true,
    status: "waiting",
    start: 0,
    loaded: 0,
  });
  const reader = dirEntry.createReader();
  const entries: FileSystemEntry[] = await asyncReadEntries(reader);
  for (let i1 = 0; i1 < entries.length; i1++) {
    const entry = entries[i1];
    if (entry.isFile) {
      const file = await asyncEntryGetFile(entry);
      ls.push({
        name: entry.fullPath,
        size: file.size,
        file: file,
        isDir: false,
        status: "waiting",
        start: 0,
        loaded: 0,
      });
    }
    if (entry.isDirectory) {
      let subLs = await recursiveReader(entry);
      subLs.forEach(sub => ls.push(sub));
    }
  }
  return ls;
}

function asyncEntryGetFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise(resolve => {
    entry.file(file => resolve(file));
  });
}

function asyncReadEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    reader.readEntries(entries => {
      resolve(entries);
    })
  });
}


function onDragover(e: DragEvent) {
  e.stopPropagation();
  e.preventDefault();
}

let uploading = ref(false);

async function goUpload() {
  if (!list.value.length) return;
  uploading.value = true;
  // console.info("goUpload");
  for (let i1 = 0; i1 < list.value.length; i1++) {
    if (list.value[i1].status !== "waiting") continue;
    await uploadFile(list.value[i1]);
  }
  uploading.value = false;
  props.data.emitGo('reload');
}

async function uploadFile(file: uploadFileType) {
  let res = null;
  let [pid, pPath, title] = mkPidAndTitle(file.name);
  // console.warn(pid, pPath, title, file);
  // return;
  if (!file.isDir) {
    const formData = new FormData();
    formData.set('pid', pid);
    formData.set('file', file.file);
    file.status = 'uploading';
    res = await query<api_file_upload_resp>('file/upd', formData, {
      upload: (e) => {
        // console.info(e);
        file.loaded = e.loaded;
      }
    });
  } else {
    const formData = new FormData();
    formData.set('pid', pid);
    formData.set('title', title);
    file.status = 'uploading';
    res = await query<api_file_upload_resp>('file/mkdir', formData);
    pidMap.set(pPath + title + '/', res.id);
  }
  file.status = 'complete';
  return res;
}

function mkPidAndTitle(filePath: string) {
  const pathArr = filePath.replace(/[\\/]+$/i).split(/[\\/]/i);
  const title = pathArr.pop();
  if (!pathArr.length) return [props.data.pid, '/', title];
  let path = '';
  for (let i1 = 0; i1 < pathArr.length; i1++) {
    path += pathArr[i1] + '/';
  }
  // console.info(path);
  if (path == '/') return [props.data.pid, path, title];
  const pid = pidMap.get(path);
  return [pid, path, title];
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
      <div @click="onSelectFile">drag / drop files here...</div>
    </div>
    <div class="upload_menu">
      <button v-if="!uploading" @click="goUpload">upload</button>
      <button v-else>uploading</button>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.modal_uploader {
  width: 100%;
  //height: calc(100% - $fontSize);
  @include fillAvailable(height);
  position: relative;
  .upload_list {
    height: calc(100% - $fontSize * 2);
    overflow: auto;
    //@include smallScroll();
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
        background-color: map.get($colors, popup_active);
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
