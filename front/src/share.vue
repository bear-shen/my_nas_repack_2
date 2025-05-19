<script setup lang="ts">
import Config from "@/Config";
import {useUserStore} from "@/stores/userStore";
import type {api_node_col, api_share_get_req, api_share_list_resp, api_share_node_list_resp} from "../../share/Api";
import {onMounted, ref, type Ref} from "vue";
import GenFunc from "@/GenFunc";

import type {JSZipObject} from "jszip";
import JSZip from 'jszip';
import { FileStreamDownloaderV2,type StreamDownloadInputFileType } from "./FileStreamDownloaderV2";

const errMsg: Ref<string> = ref('');

let shareId = '';
let parentNode = 0;
const list: Ref<api_node_col[]> = ref([]);
const cur: Ref<api_node_col> = ref({});
const parent: Ref<api_node_col> = ref({});

const selectedId: Ref<number[]> = ref([]);

let downloading = true;
const countProcessTxt: Ref<string> = ref('');
const countProcessStyle: Ref<string> = ref('');

onMounted(async () => {
  // console.info('onMounted');
  //https://stackoverflow.com/questions/70594292/how-do-i-get-current-route-in-onmounted-on-page-refresh
  // await router.isReady()
  const url = new URL(location.href);
  loadId(url);
});

function pushRoute(sid:string, pid?:number) {
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

async function loadId(url:URL) {
  shareId = url.searchParams.get('id')??'';
  if(!shareId)return throwError('invalid uuid');
  let parentId = url.searchParams.get('node');
  selectedId.value = [];
  const queryRes = await getList(shareId, parentId??false);
  if(!queryRes)return throwError('data fetch failed');
  list.value = queryRes.node??[];
  parent.value = queryRes.parent as api_node_col;
  cur.value = queryRes.cur as api_node_col;
}

async function clickFile(item: api_node_col) {
  if (item.type === 'directory') {
    pushRoute(shareId, item.id)
  } else {
    // console.info('file');
    if (!item?.file_index?.raw) return;
    await mkDownload('single', item);
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

async function mkDownload(selMode:string, target?:api_node_col) {
  downloading = true;
  //
  const rootNodes: api_node_col[] = [];
  switch (selMode) {
    case 'list':
      selectedId.value.forEach(id => {
        list.value.forEach(node => {
          if (node.id !== id) return;
          rootNodes.push(node);
        })
      })
      break;
    case 'total':
      list.value.forEach(node => {
        rootNodes.push(node);
      })
      break;
    case 'single':
      if(target){
      rootNodes.push(target);
      }
      break;
  }
  const downloader=new FileStreamDownloaderV2(buildDownloadInputFileFromNodeCol('',rootNodes),async (inNode)=>{
    const sNode=await getList(shareId,inNode.id);
    if(!sNode)return [];
    return buildDownloadInputFileFromNodeCol(inNode.path,sNode.node??[]);
  });
  await downloader.prepare();
  await downloader.download((pre:number,cur:number,total:number,index:number,fileSize:number)=>{
    let percent = cur / total;
    percent *= 10000;
    percent = Math.round(percent)
    percent /= 100;
    countProcessTxt.value = `${index}/${fileSize} Files, ${percent}%, ${GenFunc.kmgt(cur)} / ${GenFunc.kmgt(total)}`;
    countProcessStyle.value = `width: ${percent}%;`;
  });
  await downloader.build();
  downloader.complete();
  //
  downloading=false;
}


async function getList(sid:string, pid?:any):Promise<false|api_share_node_list_resp> {
  const queryRes = await query<api_share_node_list_resp>('share/node_list', pid?{
    id: sid,
    id_node: pid,
  }:{
    id: sid,
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
        return throwError(`${xhr.status}: ${xhr.statusText}`);
      const res = JSON.parse(xhr.responseText);
      if (res.code) throwError(res.msg);
      resolve(res.data);
    };
    if (extra && extra.upload) xhr.upload.onprogress = extra.upload;
    xhr.open('POST', Config.apiPath + path);
    xhr.send(formData);
  })
}

function buildDownloadInputFileFromNodeCol(pNodePath:string,orgNodeLs:api_node_col[]){
    const resLs:StreamDownloadInputFileType[]=[];
    orgNodeLs.forEach(node=>{
        const res:StreamDownloadInputFileType={
            id:node.id,
            id_parent:node.id_parent,
            path:'',
            url:'',
            size:0,
            type:node.type??'',
        };
        res.path=[pNodePath??'',node.title??''].join('/');
        if(node.type==='directory'){
        }else{
            const rawDef=node.file_index?.raw;
            if(!rawDef)return;
            const fUrl=new URL(location.href);
            fUrl.pathname=`${Config.apiPath}share/get`
            fUrl.searchParams.forEach((v,k)=>fUrl.searchParams.delete(k));
            //
            fUrl.searchParams.append('id',shareId);
            fUrl.searchParams.append('id_node',`${node.id}`);
            fUrl.searchParams.append('filename',`${node.title}`);
                res.url=fUrl.toString();
            res.size=rawDef.size??0;
        }              
        resLs.push(res);
    });
    return resLs;
}

function throwError(msg:string) {
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
            @click="mkDownload('list')"
      >{{ selectedId.length }} Selected</span>
      <span class="pointer sysIcon sysIcon_download"
            @click="mkDownload('total')"
      >Down All</span>
    </div>
  </div>
  <div class="sh_fr_body">
    <template v-if="errMsg.length">
      <p class="err_msg">{{ errMsg }}</p>
    </template>
    <template v-else>
      <ul class="sh_fr_list">
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
            <span v-if="item.type!=='directory'">{{ GenFunc.kmgt(item?.file_index?.raw?.size??0) }}</span>
            <span>{{ item.time_update }}</span>
            <span v-if="item.type==='directory'" class="pointer sysIcon sysIcon_folder" @click="clickFile(item)"></span>
            <span v-else class="pointer sysIcon sysIcon_download" @click="clickFile(item)"></span>
          </p>
        </li>
      </ul>
    </template>
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
  .sh_fr_list {
    max-width: $fontSize*80;
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
@media (max-width: ($fontSize*90)) {
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
@media (max-width: ($fontSize*40)) {
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
          white-space: normal;
          width: 100%;
          //max-height: $fontSize*6;
          span {
            height: auto;
            max-height: $fontSize*7.5;
            overflow: auto;
            //max-width: $fontSize*10;
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
