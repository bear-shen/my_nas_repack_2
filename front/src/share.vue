<script setup lang="ts">
import Config from "@/Config";
import type {api_share_node_list_resp, api_share_node_type} from "../../share/Api";
import {onMounted, ref, type Ref} from "vue";
import GenFunc from "@/GenFunc";

import {FileStreamDownloaderV2, type StreamDownloadInputFileType} from "./FileStreamDownloaderV2";

import browserBaseVue from "./popupComponents/browserBase.vue";
import browserImageVue from "./popupComponents/browserImage.vue";
import browserAudioVue from "./popupComponents/browserAudio.vue";
import browserVideoVue from "./popupComponents/browserVideo.vue";
import browserTextVue from "./popupComponents/browserText.vue";
import browserPDFVue from "./popupComponents/browserPDF.vue";
import type {nodePropsType} from "./types/browser";
import type {col_node_file_index} from "../../share/Database";

const errMsg: Ref<string> = ref('');
const showDetail: Ref<number> = ref(0);


let shareId = '';
const nodeList: Ref<api_share_node_type[]> = ref([]);
const cur: Ref<api_share_node_type | null> = ref(null);
const parent: Ref<api_share_node_type | null> = ref(null);

const selectedId: Ref<number[]> = ref([]);
const detailDOM: Ref<HTMLElement | null> = ref(null);

//----------------------------
//路由部分

onMounted(async () => {
  // console.info('onMounted');
  //https://stackoverflow.com/questions/70594292/how-do-i-get-current-route-in-onmounted-on-page-refresh
  // await router.isReady()
  const url = new URL(location.href);
  loadId(url);
});

function pushRoute(sid: string, pid?: number) {
  const url = new URL(location.href);
  url.searchParams.set('id', sid);
  if (pid) url.searchParams.set('node', pid.toString());
  else url.searchParams.delete('node');
  history.pushState(null, '', url);
  loadId(url);
}

addEventListener("popstate", (event) => {
  // console.info('popstate', event);
  loadId(new URL(location.href));
});

async function loadId(url: URL) {
  shareId = url.searchParams.get('id') ?? '';
  if (!shareId) return throwError('invalid uuid');
  let parentId = url.searchParams.get('node');
  selectedId.value = [];
  const queryRes = await getList(shareId, parentId ?? false);
  if (!queryRes) return throwError('data fetch failed');
  nodeList.value = queryRes.node ?? [];
  parent.value = queryRes.parent ?? null;
  cur.value = queryRes.cur;
}

//----------------------------
//列表下载和操作部分

let downloading = true;
const countProcessTxt: Ref<string> = ref('');
const countProcessStyle: Ref<string> = ref('');

async function clickFile(item: api_share_node_type, mode?: string) {
  if (item.type === 'directory') {
    pushRoute(shareId, item.id);
    closeDetail();
  } else {
    // console.info('file');
    if (!item?.file_index?.raw) return;
    switch (mode) {
      default:
        return await mkDownload('single', item);
      case 'detail':
        curNode.value = item;
        nodeList.value.forEach((node, ind) => {
          if (node.type == 'directory') return;
          if (node.id == item.id) {
            curIndex.value = ind;
          }
        });
        onModNav();
        showDetail.value = 1;
        setTimeout(() => {
          // console.warn(detailDOM.value,detailDOM.value?.clientHeight,detailDOM.value?.clientWidth);
          domProps.value = {
            h: detailDOM.value?.clientHeight ?? 0,
            w: detailDOM.value?.clientWidth ?? 0,
          };
        }, 10);
        break;
    }
  }
}

async function mkDownload(selMode: string, target?: api_share_node_type) {
  downloading = true;
  //
  const rootNodes: api_share_node_type[] = [];
  switch (selMode) {
    case 'list':
      selectedId.value.forEach(id => {
        nodeList.value.forEach(node => {
          if (node.id !== id) return;
          rootNodes.push(node);
        })
      })
      break;
    case 'total':
      nodeList.value.forEach(node => {
        rootNodes.push(node);
      })
      break;
    case 'single':
      if (target) {
        rootNodes.push(target);
      }
      break;
  }
  if (!rootNodes.length) return;
  console.info(rootNodes);
  const downloader = new FileStreamDownloaderV2(buildDownloadInputFileFromNodeCol('', rootNodes), async (inNode) => {
    const sNode = await getList(shareId, inNode.id);
    if (!sNode) return [];
    return buildDownloadInputFileFromNodeCol(inNode.path, sNode.node ?? []);
  });
  await downloader.prepare();
  await downloader.download((pre: number, cur: number, total: number, index: number, fileSize: number) => {
    let percent = (pre + cur) / total;
    percent *= 10000;
    percent = Math.round(percent)
    percent /= 100;
    countProcessTxt.value = `${index}/${fileSize} Files, ${percent}%, ${GenFunc.kmgt(cur)} / ${GenFunc.kmgt(total)}`;
    countProcessStyle.value = `width: ${percent}%;`;
  });
  console.info(rootNodes.length === 1, rootNodes[0].type !== 'directory');
  if (rootNodes.length === 1 && rootNodes[0].type !== 'directory') {
    await downloader.completeFile();
  } else {
    await downloader.build();
    downloader.complete();
  }
  //
  downloading = false;
}

async function getList(sid: string, pid?: any): Promise<false | api_share_node_list_resp> {
  const queryRes = await query<api_share_node_list_resp>('share/node_list', pid ? {
    id: sid,
    id_node: pid,
  } : {
    id: sid,
  });
  return queryRes;
}

function buildDownloadInputFileFromNodeCol(pNodePath: string, orgNodeLs: api_share_node_type[]) {
  const resLs: StreamDownloadInputFileType[] = [];
  orgNodeLs.forEach(node => {
    const res: StreamDownloadInputFileType = {
      id: node.id,
      id_parent: node.id_parent,
      path: '',
      url: '',
      size: 0,
      type: node.type ?? '',
    };
    res.path = [pNodePath ?? '', node.title ?? ''].join('/');
    if (node.type === 'directory') {
    } else {
      const rawDef = node.file_index?.raw;
      if (!rawDef) return;
      res.url = mkDownloadUrl(node, 'raw');
      res.size = rawDef.size ?? 0;
    }
    resLs.push(res);
  });
  return resLs;
}

function mkDownloadUrl(node: api_share_node_type, fileType: string = 'raw') {
  if (!node.file_index[fileType]) return '';
  let pathname = new URL(location.href).pathname;

  // shareId
  return pathname.substring(0, pathname.lastIndexOf('/')) + (node.file_index[fileType] as col_node_file_index).path + '?shareId=' + shareId + '&filename=' + node.title;
}

//----------------------------
//详情部分

const regComponentLs: { [key: string]: any } = {
  audio: browserAudioVue,
  video: browserVideoVue,
  image: browserImageVue,
  pdf: browserPDFVue,
  text: browserTextVue,
  office: browserBaseVue,
  base: browserBaseVue,
};

let curIndex: Ref<number> = ref(-1);
const curNode: Ref<api_share_node_type | null> = ref(null);
const nodeProps: Ref<nodePropsType> = ref({
  id: 0,
  title: '',
  cover: '',
  preview: '',
  normal: '',
  raw: '',
  sameName: [],
});
const domProps: Ref<{
  w: number,
  h: number,
}> = ref({
  w: 0,
  h: 0,
});

function emitNav(index: number) {
  console.info('emitNav', index);
  // let delta = curIndex.value + index;
  goNav(curIndex.value, index);
}

function goNav(curNavIndex: number, offset: number, counter: number = 0): any {
  // console.info('goNav', [curNavIndex, offset, counter,]);
  if (!offset) return;
  let listLen = nodeList.value.length;
  if (listLen < 1) return;
  let nextIndex = curNavIndex;
  let step=0;
  do {
    nextIndex = nextIndex + offset;
    while (nextIndex < 0) nextIndex += listLen;
    while (nextIndex > listLen - 1) nextIndex -= listLen;
    //
    step+=1;
    if(step>listLen){
      return;
    }
    //
    if (!nodeList.value[nextIndex]) continue;
    if (nodeList.value[nextIndex].type === 'directory') continue;
    break;
  } while (true)
  curIndex.value = nextIndex;
  onModNav();
}

function onModNav() {
  const tCurNode = nodeList.value[curIndex.value];
  curNode.value = tCurNode;
  //音视频封面补充
  if (!tCurNode.file_index.preview) {
    if (['audio', 'video'].indexOf(tCurNode.type) !== -1) {
      let has = false
      nodeList.value.forEach(node => {
        if (node.id_parent !== tCurNode.id_parent) return;
        if (has) return;
        let isCover = false;
        Config.coverKeyword.forEach(kw1 => {
          Config.imgKeyword.forEach(kw2 => {
            if (tCurNode.title.toLowerCase().indexOf(kw1) !== -1)
              if (tCurNode.title.toLowerCase().indexOf(kw2) !== -1)
                isCover = true;
          })
        });
        if (isCover) {
          has = true;
          let fileInfo;
          if (!fileInfo) fileInfo = tCurNode.file_index.preview;
          if (!fileInfo) fileInfo = tCurNode.file_index.normal;
          if (!fileInfo) fileInfo = tCurNode.file_index.raw;
          tCurNode.file_index.preview = fileInfo;
        }
      });
    }
    //
  }
  const tNodeProps: nodePropsType = {
    id: tCurNode.id,
    title: tCurNode.title,
    cover: mkDownloadUrl(tCurNode, 'cover'),
    preview: mkDownloadUrl(tCurNode, 'preview'),
    normal: mkDownloadUrl(tCurNode, 'normal'),
    raw: mkDownloadUrl(tCurNode, 'raw'),
    sameName: [],
  };
  // console.info(tCurNode);
  // console.info(tNodeProps);
  //字幕等
  let befInd = tNodeProps.title.lastIndexOf('.');
  if (befInd !== -1) {
    let preStr = tNodeProps.title.substring(0, befInd) ?? '';
    if (preStr) {
      nodeList.value.forEach(node => {
        if (node.id == tNodeProps.id) return;
        if (node.title?.indexOf(preStr) !== 0) return;
        let aftStr = node.title?.substring(preStr.length);
        tNodeProps.sameName.push({
          title: aftStr,
          type: node.type ?? '',
          preview: mkDownloadUrl(node, 'preview'),
          normal: mkDownloadUrl(node, 'normal'),
          raw: mkDownloadUrl(node, 'raw'),
        });
      });
    }
  }
  if (tNodeProps.id == nodeProps.value.id) return;
  nodeProps.value = tNodeProps;
  // console.warn(tNodeProps);
}

function onResizing() {
  setTimeout(() => {
    if (!detailDOM.value) return;
    domProps.value = {
      h: detailDOM.value?.clientHeight ?? 0,
      w: detailDOM.value?.clientWidth ?? 0,
    };
  }, 10);
}

window.addEventListener("resize", onResizing);

function closeDetail() {
  curIndex.value = -1;
  curNode.value = null;
  showDetail.value = 0;
}

async function keymap(e: KeyboardEvent) {
  if (!curNode.value) return;
  switch (e.key) {
    case "ArrowLeft":
      if(!showDetail.value)break;
      e.preventDefault();
      e.stopPropagation();
      if (["audio", "video"].indexOf(curNode.value.type ?? "") !== -1) return;
      goNav(curIndex.value, -1);
      break;
    case "ArrowRight":
      if(!showDetail.value)break;
      e.preventDefault();
      e.stopPropagation();
      if (["audio", "video"].indexOf(curNode.value.type ?? "") !== -1) return;
      goNav(curIndex.value, +1);
      break;
    case "a":
    case "PageUp":
      if(!showDetail.value)break;
      e.preventDefault();
      e.stopPropagation();
      goNav(curIndex.value, -1);
      break;
    case "d":
    case "PageDown":
      if(!showDetail.value)break;
      e.preventDefault();
      e.stopPropagation();
      goNav(curIndex.value, +1);
      break;
  }
}

document.addEventListener("keydown", keymap);

//----------------------------
//基础部分

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
        return throwError(`${xhr.status}: ${xhr.statusText}`);
      const res = JSON.parse(xhr.responseText);
      if (res.code) throwError(res.msg);
      resolve(res.data);
    };
    if (extra && extra.upload) xhr.upload.onprogress = extra.upload;
    let pathname = new URL(location.href).pathname;
    xhr.open('POST', pathname.substring(0, pathname.lastIndexOf('/')) + Config.apiPath + path);
    xhr.send(formData);
  })
}

function throwError(msg: string) {
  // alert(msg);
  errMsg.value = msg;
  throw new Error(msg)
}
</script>

<template>
  <div class="sh_fr_header">
    <div>
      <img src="@/assets/logobw.png">
      <span>MyNas Share</span>
    </div>
    <div class="operator">
      <span v-if="selectedId.length" class="pointer sysIcon sysIcon_download" @click="mkDownload('list')">{{
          selectedId.length
        }} Selected</span>
      <span class="pointer sysIcon sysIcon_download" @click="mkDownload('total')">Down All</span>
      <span v-if="showDetail" class="pointer sysIcon sysIcon_forward" @click="closeDetail()">Close</span>
    </div>
  </div>
  <div :class="{'sh_fr_body':true,showDetail}">
    <template v-if="errMsg.length">
      <p class="err_msg">{{ errMsg }}</p>
    </template>
    <template v-else>
      <ul class="sh_fr_list">
        <!-- 上级 -->
        <template v-if="cur && cur.id">
          <li class="pointer" @click="pushRoute(shareId,parent?parent.id:0)">
            <p>
              <span :class="['thumb', 'listIcon', `listIcon_file_directory`]"></span>
              <span>../</span>
            </p>
          </li>
        </template>
        <!--  -->
        <li v-for="item in nodeList" :key="item.id" :class="{active:(curNode && item.id==curNode.id)}">
          <p>
            <input type="checkbox" name="selector" :id="`selector_${item.id}`" :value="item.id" v-model="selectedId">
            <label :for="`selector_${item.id}`" class="pointer"></label>
            <span :class="['thumb', 'listIcon', `listIcon_file_${item.type}`]"></span>
            <span class="pointer title" @click="clickFile(item,'detail')">{{ item.title }}</span>
          </p>
          <p class="operates">
            <span v-if="item.type !== 'directory'">{{ GenFunc.kmgt(item?.file_index?.raw?.size ?? 0) }}</span>
            <template v-if="item.type === 'directory'">
              <span class="pointer sysIcon sysIcon_folder" @click="clickFile(item)"></span>
            </template>
            <template v-else>
              <span class="pointer sysIcon sysIcon_eye" @click="clickFile(item,'detail')"></span>
              <span class="pointer sysIcon sysIcon_download" @click="clickFile(item)"></span>
            </template>
          </p>
        </li>
      </ul>
      <template v-if="curNode && showDetail">
        <div class="sh_fr_detail" ref="detailDOM" data-ref-id="1">
          <component :is="regComponentLs[curNode.type]
        ? regComponentLs[curNode.type]
        : regComponentLs.base
      "
                     :extId="'1'"
                     :isActive="true"
                     :curIndex="0"

                     :file="nodeProps"
                     :dom="domProps"

                     @nav="emitNav"
          >
            <template v-slot:info>
              <div :class="{ info: true, detail: showDetail }">
                <template v-if="showDetail">
                  <p>
                    {{ curNode.title }} ({{
                      GenFunc.kmgt(curNode.file_index?.raw?.size ?? 0, 2)
                    }})
                  </p>
                  <p v-if="curNode.crumb_node">Dir :
                    <template v-for="node in curNode.crumb_node">/{{ node.title }}</template>
                  </p>
                  <p class="preLine">{{ curNode.description }}</p>
                </template>
                <!--        <p v-else>{{ curNode.title }}</p>-->
              </div>
            </template>
            <template v-slot:btnContainer>
            </template>
            <template v-slot:navigator>
              <div :class="{ pagination: 1, isMobile: false }">
                <div class="left" @click="goNav(curIndex, -1)">
                  <span class="sysIcon sysIcon_arrowleft"></span>
                </div>
                <div class="right" @click="goNav(curIndex, +1)">
                  <span class="sysIcon sysIcon_arrowright"></span>
                </div>
              </div>
            </template>
          </component>
        </div>
      </template>
    </template>
  </div>
  <div class="sh_fr_footer">
    <div class="process" :style="countProcessStyle">{{ countProcessTxt }}</div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;

@use '@/assets/browser.scss' as *;
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
      vertical-align: bottom;
      height: inherit;
      line-height: inherit;
    }
  }
  img {
    height: $fontSize*2;
    line-height: $fontSize*2;
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
  display: flex;
  overflow: auto;
  .err_msg {
    font-size: $fontSize*5;
    text-align: center;
    display: block;
  }
  .sh_fr_list {
    max-width: 90%;
    width: 90*$fontSize;
    margin: 0 auto;
    li {
      padding: 0 $fontSize;
      //width:;
      line-height: 2.5*$fontSize;
      height: 2.5*$fontSize;
      display: flex;
      justify-content: space-between;
      flex-wrap: nowrap;
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
      .title {
        max-width: 40vw;
      }
    }
  }
  input[type='checkbox'],
  input[type='radio'] {
    + label {
      // font-size: $fontSize*1.5;
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
.sh_fr_body.showDetail {
  .sh_fr_list {
    container-type: size;
    width: 30vw;
    position: relative;
    .listIcon {
      display: none;
    }
    p {
      display: block;
    }
    p.operates {
      width: $fontSize*20;
      text-align: right;
    }
    p * {
      font-size: $fontSize*0.8;
    }
    .listIcon, .sysIcon {
      font-size: $fontSize*0.8;
    }
    .title {
      font-size: $fontSize*0.9;
      // width: $fontSize*15;
      width: calc(100cqw - $fontSize * 1.5 * 8);
    }
  }
  .sh_fr_detail {
    width: 70%;
    height: 100%;
    background-color: map.get($colors, font);
    color: map.get($colors, bk);
  }
  .modal_browser {
    width: 100%;
    height: 100%;
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
@media (max-aspect-ratio: 1/1) {
  .sh_fr_body {
    display: block;
    .sh_fr_list {
      width: 100%;
      max-width: 100%;
    }
  }
  .sh_fr_body.showDetail {
    .sh_fr_list {
      width: 100vw;
      container-type: normal;
      height: 30vh;
      overflow: auto;
    }
    .sh_fr_detail {
      width: 100%;
      max-width: 100%;
      height: calc(70vh - $fontSize * 4);
    }
  }
}


</style>
