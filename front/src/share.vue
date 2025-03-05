<script setup lang="ts">
import Config from "@/Config";
import {useUserStore} from "@/stores/userStore";
import type {api_node_col, api_share_get_req, api_share_list_resp, api_share_node_list_resp} from "../../share/Api";
import {onMounted, ref, type Ref} from "vue";
import GenFunc from "@/GenFunc";

import type {JSZipObject} from "jszip";
import JSZip from 'jszip';

const errMsg: Ref<string> = ref('');

let shareId = 0;
let parentNode = 0;
const list: Ref<api_node_col[]> = ref([]);
const cur: Ref<api_node_col> = ref(null);
const parent: Ref<api_node_col> = ref(null);

const selectedId: Ref<number[]> = ref([]);

let downloading = true;
let queuedNodes: api_node_col[] = [];
let countFile = 0;
let countTotalFile = 0;
let countSize = 50;
let countTotalSize = 100;
const countProcessTxt: Ref<string> = ref('');
const countProcessStyle: Ref<string> = ref('');

onMounted(async () => {
  // console.info('onMounted');
  //https://stackoverflow.com/questions/70594292/how-do-i-get-current-route-in-onmounted-on-page-refresh
  // await router.isReady()
  const url = new URL(location.href);
  reloadId(url);
});

async function reloadId(url) {
  shareId = url.searchParams.get('id');
  let parentId = url.searchParams.get('node');
  selectedId.value = [];
  const queryRes = await getList(shareId, parentId);
  list.value = queryRes.node;
  parent.value = queryRes.parent;
  cur.value = queryRes.cur;
}

async function clickFile(item: api_node_col) {
  if (item.type === 'directory') {
    pushRoute(shareId, item.id)
  } else {
    // console.info('file');
    if (!item.file_index.raw) return;
    await prepareDownload('single', item);
  }
}

type DownloadedNodeInfo = {
  id: number,
  pid: number,
  title: string,
  type: string,
  path: string,
  buffer: ArrayBuffer,
};

async function prepareDownload(selMode, target) {
  downloading = true;
  queuedNodes = [];
  countFile = 0;
  countTotalFile = 0;
  countSize = 0;
  countTotalSize = 0;
  const rootNodes: api_node_col[] = [];
  switch (selMode) {
    case 'list':
      selectedId.value.forEach(id => {
        list.value.forEach(node => {
          if (node.id !== id) return;
          queuedNodes.push(node);
          rootNodes.push(node);
        })
      })
      break;
    case 'total':
      list.value.forEach(node => {
        queuedNodes.push(node);
        rootNodes.push(node);
      })
      break;
    case 'single':
      queuedNodes.push(target);
      rootNodes.push(target);
      break;
  }
  for (let i1 = 0; i1 < queuedNodes.length; i1++) {
    if (queuedNodes[i1].type !== 'directory') continue;
    const subLs = await getCascadeNode(queuedNodes[i1]);
    subLs.forEach(sub => queuedNodes.push(sub));
  }
  queuedNodes.forEach(node => {
    if (node.file_index?.raw?.size) {
      countTotalFile += 1;
      countTotalSize += node.file_index.raw.size;
    }
  });
  // const queueMap: Map<number, api_node_col> = new Map<number, api_node_col>();
  const targetMap: Map<number, DownloadedNodeInfo> = new Map<number, DownloadedNodeInfo>();
  // queuedNodes.forEach(node => queueMap.set(node.id, node));
  for (let i1 = 0; i1 < queuedNodes.length; i1++) {
    const cur = queuedNodes[i1];
    const res: DownloadedNodeInfo = {
      id: cur.id,
      pid: cur.id_parent,
      title: cur.title,
      type: cur.type,
      path: cur.title,
    };
    if (queuedNodes[i1].type !== 'directory') {
      if (queuedNodes[i1].file_index?.raw?.size) {
        res.buffer = await downloadOne(queuedNodes[i1]);
        // console.info(res.buffer);
      }
    }
    targetMap.set(cur.id, res);
  }
  if (queuedNodes.length === 1) {
    const node = targetMap.get(queuedNodes[0].id);
    if (node) {
      const buffer = node.buffer;
      if (buffer)
        downloadBuffer(queuedNodes[0].title, buffer);
    }
  } else {
    const zipRoot = new JSZip();
    targetMap.forEach((info, key, map) => {
      info.path = buildPath(info, targetMap);
      if (info.type === 'directory') {
        zipRoot.folder(info.path);
      } else {
        zipRoot.file(info.path, info.buffer);
      }
    });
    zipRoot.generateAsync({type: "blob"}).then((content) => {
      let link = document.createElement('a');
      link.style.display = 'none';
      link.href = URL.createObjectURL(content);
      link.target = '_blank';
      link.setAttribute('download', `share.${(new Date().toISOString()).replace(/[-:\s]/, '')}.zip`)
      link.click();
    });
  }
}

async function getCascadeNode(node): Promise<api_node_col[]> {
  const subLs = [];
  const subQueryRes = await getList(shareId, node.id);
  const subRes: api_node_col[] = subQueryRes.node;
  // console.info(subRes);
  for (let i1 = 0; i1 < subRes.length; i1++) {
    subLs.push(subRes[i1]);
    if (subRes[i1].type === 'directory') {
      const tRes = await getCascadeNode(subRes[i1]);
      tRes.forEach(t => subLs.push(t));
    }
  }
  return subLs;
}

function buildPath(info, targetMap: Map<number, DownloadedNodeInfo>) {
  const pathArr = [info.title];
  const nodeArr = [info.pid];
  while (true) {
    let hasParent = false;
    targetMap.forEach(tInfo => {
      if (tInfo.id === nodeArr[0]) {
        hasParent = true;
        pathArr.unshift(tInfo.title);
        nodeArr.unshift(tInfo.pid);
      }
    });
    if (!nodeArr[0]) break;
    if (!hasParent) break;
  }
  // console.info(pathArr, nodeArr);
  return pathArr.join('/');
}

function downloadBuffer(title, buffer) {
  const blob = new Blob([buffer], {type: 'application/octet-stream'});
  let link = document.createElement('a');
  link.style.display = 'none';
  link.href = URL.createObjectURL(blob);
  link.target = '_blank';
  link.setAttribute('download', title)
  link.click();
}


async function downloadOne(node) {
  const formData = new FormData();
  formData.append('id', shareId);
  formData.append('id_node', node.id);
  const res = await downloadApi(Config.apiPath + `share/get`, formData, downloadProcess);
  countFile += 1;
  countSize += node.file_index.raw.size;
  mkProcessStr();
  return res;
}

function downloadApi(src: string, formData: FormData, progress?: (this: any, ev: ProgressEvent) => any): Promise<ArrayBuffer> {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 400)
        return throwError(`${xhr.status}:${xhr.statusText}`);
      resolve(xhr.response as ArrayBuffer);
    };
    if (progress)
      xhr.onprogress = progress;
    xhr.open('POST', src);
    xhr.send(formData);
  })
}

function downloadProcess(ev: ProgressEvent) {
  mkProcessStr(ev);
}

function mkProcessStr(ev: ProgressEvent) {
  let cur = countSize + (ev ? ev.loaded : 0);
  let percent = cur / countTotalSize;
  percent *= 10000;
  percent = Math.round(percent)
  percent /= 100;
  percent += '%';
  countProcessTxt.value = `${countFile}/${countTotalFile} Files, ${percent}, ${GenFunc.kmgt(cur)} / ${GenFunc.kmgt(countTotalSize)}`;
  countProcessStyle.value = `width: ${percent};`;
}

function pushRoute(sid, pid) {
  const url = new URL(location.href);
  url.searchParams.set('id', sid);
  if (pid) url.searchParams.set('node', pid);
  else url.searchParams.delete('node');
  history.pushState(null, null, url);
  reloadId(url);
}

addEventListener("popstate", (event) => {
  // console.info('popstate', event);
  reloadId(new URL(location.href));
});


async function getList(sid, pid) {
  const queryRes: api_share_node_list_resp = await query<api_share_node_list_resp>('share/node_list', {
    id: sid,
    id_node: pid,
  });
  return queryRes;
}

function query<K>(
  path: string, data: { [key: string]: any } | FormData,
  extra?: {
    upload: (e: ProgressEvent) => any
  }
): Promise<K | false> {
  return new Promise<any>((resolve, reject) => {
    let formData: FormData;
    if (data instanceof FormData) {
      formData = data;
      // } else if (data) {
    } else {
      formData = new FormData();
      for (const dataKey in data) {
        if (!Object.prototype.hasOwnProperty.call(data, dataKey)) continue;
        formData.append(dataKey, data[dataKey]);
      }
    }
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 400)
        return throwError(`${xhr.status}:${xhr.statusText}`);
      const res = JSON.parse(xhr.responseText);
      if (res.code) throwError(res.msg);
      resolve(res.data);
    };
    if (extra && extra.upload) xhr.upload.onprogress = extra.upload;
    xhr.open('POST', Config.apiPath + path);
    xhr.send(formData);
  })
}


function throwError(msg) {
  // alert(msg);
  errMsg.value = msg;
  throw new Error(msg)
}
</script>

<template>
  <div class="sh_fr_header">
    <div>
      <img src="@/assets/logobl.png">
      <span>MyNas Share</span>
    </div>
    <div class="operator">
      <span v-if="selectedId.length"
            class="pointer sysIcon sysIcon_download"
            @click="prepareDownload('list')"
      >{{ selectedId.length }} Selected</span>
      <span class="pointer sysIcon sysIcon_download"
            @click="prepareDownload('total')"
      >Down All</span>
    </div>
  </div>
  <div class="sh_fr_body">
    <template v-if="errMsg.length">
      <p class="err_msg">{{ errMsg }}</p>
    </template>
    <ul v-else>
      <template v-if="cur && cur.id">
        <li class="pointer" @click="pushRoute(shareId,parent?parent.id:0)">
          <p>
            <span :class="['thumb', 'listIcon', `listIcon_file_directory`]"></span>
            <span>../</span>
          </p>
        </li>
      </template>
      <li
        v-for="item in list" :key="item.id"
      >
        <p>
          <input type="checkbox" name="selector" :id="`selector_${item.id}`" :value="item.id" v-model="selectedId">
          <label :for="`selector_${item.id}`" class="pointer"></label>
          <span :class="['thumb', 'listIcon', `listIcon_file_${item.type}`]"></span>
          <span
            class="pointer" @click="clickFile(item)"
          >{{ item.title }}</span>
        </p>
        <p>
          <span v-if="item.type!=='directory'">{{ GenFunc.kmgt(item.file_index.raw.size) }}</span>
          <span>{{ item.time_update }}</span>
          <span v-if="item.type==='directory'" class="pointer sysIcon sysIcon_folder" @click="clickFile(item)"></span>
          <span v-else class="pointer sysIcon sysIcon_download" @click="clickFile(item)"></span>
        </p>
      </li>
    </ul>
  </div>
  <div class="sh_fr_footer">
    <div class="process" :style="countProcessStyle">{{ countProcessTxt }}</div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.sh_fr_header, .sh_fr_footer {
  height: $fontSize*2;
  background-color: map.get($colors, bar_horizon);
  font-size: $fontSize;
}
.sh_fr_header {
  padding: 0 $fontSize;
  display: flex;
  justify-content: space-between;
  div {
    line-height: $fontSize*2;
    height: $fontSize*2;
    * {
      vertical-align: baseline;
      height: inherit;
      line-height: inherit;
    }
  }
  img {
    height: $fontSize;
    display: inline-block;
    margin-right: 0.5*$fontSize;
  }
  .operator span {
    margin-left: $fontSize*2;
  }
  .operator span::before {
    padding-right: 0.5em;
  }
}
.sh_fr_body {
  height: calc(100vh - $fontSize * 4);
  overflow: auto;
  .err_msg {
    font-size: $fontSize*5;
    text-align: center;
    display: block;
  }
  ul {
    width: $fontSize*80;
    margin: 0 auto;
    li {
      padding: 0 $fontSize;
      //width:;
      font-size: $fontSize;
      line-height: 2.5*$fontSize;
      height: 2.5*$fontSize;
      display: flex;
      justify-content: space-between;
      * {
        line-height: 2.5*$fontSize;
        height: 2.5*$fontSize;
      }
      &:nth-child(2n-1) {
        background-color: map.get($colors, bk_active);
      }
      &:hover {
        background-color: map.get($colors, font);
        color: map.get($colors, bk);
      }
      p {
        display: inline-block;
        white-space: nowrap;
        height: 100%;
        * {
          padding: 0 $fontSize*0.5;
          vertical-align: top;
          font-size: $fontSize;
          line-height: 2.5*$fontSize;
          height: 2.5*$fontSize;
          display: inline-block;
        }
        span {
          max-width: $fontSize*60;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        input {
          display: none;
        }
      }
      .listIcon, .sysIcon {
        font-size: $fontSize*1.5;
      }
    }
  }
  input[type='checkbox'],
  input[type='radio'] {
    + label {
      font-size: $fontSize*1.5;
      &::after {
        content: '\e833';
      }
    }
    &:checked {
      + label {
        &::after {
          content: '\e62e';
        }
      }
    }
  }
}
.sh_fr_footer {
  .process {
    //width: 50%;
    width: 0;
    height: 100%;
    line-height: $fontSize*2;
    background-image: url("assets/bg.png");
    background-color: map.get($colors, font);
    color: map.get($colors, font);
    text-align: center;
    white-space: nowrap;
    margin: 0 auto;
  }
}
.pointer {
  cursor: pointer;
}
@media (max-width: $fontSize*90) {
  .sh_fr_body {
    ul {
      width: 100%;
      li {
        flex-wrap: wrap;
        justify-content: space-between;
        height: auto;
        p {
          //width: 100%;
          span {
            max-width: $fontSize*15;
          }
        }
      }
    }
  }
}
@media (max-width: $fontSize*40) {
  .sh_fr_header {
    height: auto;
    flex-wrap: wrap;
  }
  .sh_fr_body {
    ul {
      li {
        display: block;
        p {
          display: block;
          //max-height: $fontSize*6;
          span {
            height: auto;
            max-height: $fontSize*7.5;
            overflow: auto;
            max-width: $fontSize*10;
            word-break: break-all;
            white-space: normal;
          }
        }
        p:nth-child(2){
          text-align: right;
        }
      }
    }
  }
}
</style>
