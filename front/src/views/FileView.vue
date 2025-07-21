<script setup lang='ts'>
import type {Ref} from 'vue';
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from 'vue';
import {onBeforeRouteUpdate, useRoute, useRouter} from 'vue-router';
import {query, mayTyping} from '@/lib/Helper';
import type {opModule as opModuleClass} from '@/lib/FileViewHelper';
import * as fHelper from '@/lib/FileViewHelper';
// import {manualSort} from '@/lib/FileViewHelper';
import GenFunc from "@/lib/GenFunc";
import type {api_file_list_req, api_file_list_resp, api_file_mkdir_req, api_file_mkdir_resp, api_node_col} from '../../../share/Api';
import * as Modal from "@/shares/Modal";
import FileItem from '@/components/FileItem.vue';
import Config from "@/Config";
import * as Pastebin from "@/shares/Pastebin";

const contentDOM: Ref<HTMLElement | null> = ref(null);
//
const router = useRouter();
const route = useRoute();
const isMobile = window.navigator.userAgent.toLowerCase().indexOf('mobile') !== -1;
let queryData: api_file_list_req = {
  mode: 'directory',
  id_dir: '0',
  id_tag: '',
};
let searchBarQuery: api_file_list_req = {
  keyword: '',
  node_type: 'any',
  rate: '',
  cascade_dir: '1',
};

function syncQuery(tQuery: api_file_list_req) {
  if (!tQuery) return;
  for (let key in queryData) {
    if (!Object.prototype.hasOwnProperty.call(queryData, key)) continue;
    const wKey = key as keyof api_file_list_req;
    // if (typeof tQuery[wKey] === 'undefined') continue;
    switch (wKey) {
      default:
        queryData[wKey] = (tQuery[wKey] ?? '') as any;
        break;
      case 'mode':
        queryData[wKey] = tQuery[wKey] ?? 'directory';
        break;
      case 'id_dir':
        queryData[wKey] = tQuery[wKey] ?? '0';
        break;
    }
  }
  for (let key in searchBarQuery) {
    if (!Object.prototype.hasOwnProperty.call(searchBarQuery, key)) continue;
    const wKey = key as keyof api_file_list_req;
    // if (typeof tQuery[key] === 'undefined') continue;
    switch (wKey) {
      default:
        searchBarQuery[wKey] = (tQuery[wKey] ?? '') as any;
        break;
      case 'cascade_dir':
        searchBarQuery[wKey] = tQuery[wKey] ?? '1';
        break;
    }
  }
}

// let usePid = false;
onBeforeRouteUpdate(async (to) => {
  // console.info('onBeforeRouteUpdate', to);
  console.warn('onBeforeRouteUpdate', to, JSON.stringify(to.query));
  if (to.query) syncQuery(to.query);
  await getList();
});

//
let crumbList: Ref<api_node_col[]> = ref([]);
let nodeList: Ref<api_node_col[]> = ref([]);
let opModule: opModuleClass;

async function getList(replaceWith?: api_file_list_resp[]) {
  console.info('getList', route.name);
  // console.warn('getList', route.name, JSON.stringify(queryData), JSON.stringify(searchBarQuery));
  nodeList.value = [];
  if (!replaceWith) {
    crumbList.value = [];
    switch (route.name) {
      default:
        break;
      case 'Recycle':
        queryData.status = 'deleted';
        break
      case 'Favourite':
        // queryData.group = 'favourite';
        break
    }
    let tQueryData: api_file_list_req = {};
    switch (queryData.mode) {
      case 'directory':
        tQueryData = Object.assign(tQueryData, queryData);
        break;
      case 'search':
        tQueryData = Object.assign(tQueryData, queryData, searchBarQuery);
        break;
    }
    const res = await query<api_file_list_resp>('file/get', tQueryData);
    if (!res) return;
    // console.info(res);
    crumbList.value = res.path;
    nodeList.value = opModule.sortList(res.list, opModule.sortVal.value);
  } else {
    nodeList.value = replaceWith as api_node_col[];
  }
  if (opModule) opModule.setList(nodeList.value);
  // console.info(crumbList);
  return {crumb: crumbList.value, node: nodeList.value};
}

function addFolder() {
  let pid = 0
  let title = 'root'
  if (crumbList.value.length) {
    let curNode = crumbList.value[crumbList.value.length - 1]
    if (curNode) {
      pid = curNode.id ?? 0
      title = curNode.title ?? 'root'
    }
  }
  Modal.set({
    title: `mkdir | ${title}`,
    alpha: false,
    key: '',
    single: false,
    w: 400,
    h: 100,
    minW: 400,
    minH: 100,
    // h: 160,
    allow_resize: false,
    allow_move: true,
    allow_fullscreen: false,
    auto_focus: true,
    form: [
      {
        label: 'title',
        type: 'text'
      }
    ],
    callback: {
      submit: async (modal) => {
        // console.info(modal);
        const formData = modal.content.form;
        const targetTitle = formData[0].value;
        // console.info(targetTitle)
        if (!targetTitle) return true;
        const res = await query<api_file_mkdir_resp>('file/mkdir', {
          title: targetTitle,
          pid: `${pid}`
        } as api_file_mkdir_req);
        getList();
        if (!res) return;
      }
    }
  })
}

function addFile() {
  let pid = 0;
  let title = 'root';
  if (crumbList.value.length) {
    let curNode = crumbList.value[crumbList.value.length - 1];
    if (curNode) {
      pid = curNode.id ?? 0;
      title = curNode.title ?? 'root';
    }
  }
  Modal.set({
    title: `upload | ${title}`,
    alpha: false,
    key: `FileView_addFile_${pid}`,
    single: true,
    w: 400,
    h: 200,
    minW: 400,
    minH: 200,
    // h: 160,
    allow_resize: true,
    allow_move: true,
    allow_fullscreen: true,
    auto_focus: true,
    // text: "this is text",
    component: [
      {
        componentName: 'uploader',
        data: {
          pid: pid,
          emitGo: emitGo
        }
      }
    ]
  })
}

//

//
function search() {
  const tQuery = GenFunc.copyObject(searchBarQuery);
  if (queryData.id_tag) tQuery.id_tag = queryData.id_tag;
  if (queryData.id_dir) tQuery.id_dir = queryData.id_dir;
  let isSearch = false;
  if (searchBarQuery.rate) isSearch = true;
  if (searchBarQuery.keyword?.trim()) isSearch = true;
  if (searchBarQuery.node_type && searchBarQuery.node_type != 'any') isSearch = true;
  if (isSearch) {
    tQuery.mode = 'search';
  } else {
    tQuery.mode = 'directory';
  }
  opModule.go(tQuery);
}

function emitGo(type: string, code?: number) {
  console.info('emitGo', type, code);
  switch (type) {
    case 'reload':
      getList();
      break
    case 'tag':
      opModule.go({mode: 'directory', id_tag: `${code}`});
      break
    case 'node':
      let node
      for (let i1 = 0; i1 < nodeList.value.length; i1++) {
        if (nodeList.value[i1].id !== code) continue;
        node = nodeList.value[i1];
        break;
      }
      if (!node) break;
      switch (node.type) {
        case 'directory':
          opModule.go({mode: 'directory', id_dir: `${node.id}`});
          break
        default:
          fHelper.popupDetail(Object.assign(GenFunc.copyObject(queryData), searchBarQuery), node.id ?? 0);
          break
      }
      break
  }
}


onMounted(async () => {
  // console.info('onMounted');
  if (route.query) syncQuery(route.query);
  opModule = new fHelper.opModule({
    route: route,
    router: router,
    // nodeList: nodeList,
    getList: getList,
    contentDOM: contentDOM.value as HTMLElement,
    emitGo: emitGo
    // queryData: queryData,
  });
  const getListRes = await getList();
  if (!getListRes) return;
  opModule.reloadScroll();
  document.addEventListener("keydown", keymap);
  // if (contentDOM.value) {
  //   contentDOM.value.addEventListener("scroll", lazyLoad);
  // }
  // reloadOffset(undefined, fHelper.timeoutDef.offsetDebounce);
  // (contentDOM.value as HTMLElement).addEventListener("scroll", scrollEvt);
});
onUnmounted(() => {
  opModule.destructor();
  document.removeEventListener("keydown", keymap);
  // if (contentDOM.value) {
  //   contentDOM.value.removeEventListener("scroll", lazyLoad);
  // }
});

function keymap(e: KeyboardEvent) {
  // console.info(e);
  //这俩快捷键基本没占用，屏蔽target反而很麻烦
  // if ((e.target as HTMLElement).tagName !== "BODY") return;
  const keyMap = [];
  if (e.ctrlKey) keyMap.push('ctrl');
  if (e.shiftKey) keyMap.push('shift');
  keyMap.push(e.code);
  switch (keyMap.join('_')) {
    default:
      return;
      break;
    case 'ctrl_KeyU':
      if (route.name !== 'Directory') return;
      if (!(crumbList.value.length || queryData.id_dir)) return;
      if (opModule && opModule.showSelectionOp) {
        e.preventDefault();
        addFile();
      }
      break;
    case 'ctrl_KeyM':
      if (route.name !== 'Directory') return;
      if (!(crumbList.value.length || queryData.id_dir)) return;
      if (opModule && opModule.showSelectionOp) {
        e.preventDefault();
        addFolder();
      }
      break;
    case 'ctrl_KeyC':
    case 'ctrl_KeyV':
    case 'ctrl_KeyX':
      if (route.name !== 'Directory') return;
      if (mayTyping(e.target as HTMLElement)) return;
      onPasteBinOperate(keyMap);
      break;
    case 'Enter':
    case 'NumpadEnter':
      if (!e.target) return;
      if ((e.target as HTMLElement).id !== 'searchBarInput') return;
      search();
      break;
  }
}

function onDragover(e: DragEvent) {
  // console.info(e);
  if (!(crumbList.value.length || queryData.id_dir)) return;
  e.stopPropagation();
  e.preventDefault();
  addFile();
}

async function onPasteBinOperate(keyMap: string[]) {
  console.info(keyMap, crumbList.value, queryData.id_dir);
  let resVal: {
    idSet: Set<number>,
    nodeLs: api_node_col[],
  };
  switch (keyMap.join('_')) {
    case 'ctrl_KeyC':
      resVal = opModule.getSelected();
      if (!resVal.nodeLs.length) return;
      Pastebin.nodeList.value = resVal.nodeLs;
      Pastebin.mode.value = 'copy';
      break;
    case 'ctrl_KeyX':
      resVal = opModule.getSelected();
      if (!resVal.nodeLs.length) return;
      Pastebin.nodeList.value = resVal.nodeLs;
      Pastebin.mode.value = 'cut';
      break;
    case 'ctrl_KeyV':
      if (!Pastebin.nodeList.value.length) return;
      if (!queryData.id_dir) return;
      await Pastebin.doPaste(queryData.id_dir);
      await getList();
      break;
  }
}
</script>

<template>
  <div class='fr_content view_file' @dragover="onDragover">
    <div class='content_meta'>
      <div class='crumb' v-if='crumbList.length'>
        <a dir='ltr'
           class='item'
           v-for='(node, nodeIndex) in crumbList'
           :key='nodeIndex'
           @click="opModule.go({ id_dir: `${node?.id}`,mode:'directory' })"
           :title='node.title'
        >{{ node.title }}</a>
      </div>
      <div class='search'>
        <label>
          <span>Title : </span><input id="searchBarInput" type='text' v-model='searchBarQuery.keyword'/>
        </label>
        <label>
          <span>Type : </span>
          <select v-model='searchBarQuery.node_type'>
            <option v-for='(type,key) in Config.fileType'
                    :key="`FV_SCH_NODE_TYPE_${key}`"
            >{{ type }}
            </option>
          </select>
        </label>
        <label>
          <span>Rate : </span>
          <template v-if="isMobile">
            <select class='sysIcon' v-model='searchBarQuery.rate'>
              <option v-for='(type,key) in Config.rateMobile' :value='key' v-html='type'
                      :key="`FV_SCH_CON_RATE_${key}`"
              ></option>
            </select>
          </template>
          <template v-else>
            <select class='sysIcon' v-model='searchBarQuery.rate'>
              <option v-for='(type,key) in Config.rate' :value='key' v-html='type'
                      :key="`FV_SCH_CON_RATE_${key}`"
              ></option>
            </select>
          </template>
        </label>
        <label>
          <span>Cascade : </span>
          <input type='checkbox' v-model='(searchBarQuery.cascade_dir as any)' id='FV_S_CB'
                 :true-value='1'
                 false-value=''
          />
          <label class="buttonStyle" for='FV_S_CB'></label>
        </label>
        <!--      <label>
              <input
                type="checkbox"
                id="content_directory_directory_only_checkbox"
                v-model="queryData.is_fav"
                :true-value="'1'"
                :false-value="'0'"
              >
              <label for="content_directory_directory_only_checkbox">Fav</label>
            </label>-->
        <label>
          <button class='buttonStyle sysIcon sysIcon_search' @click='search'></button>
        </label>
      </div>
      <div class='display'>
        <template v-if='opModule &&opModule.showSelectionOp'>
          <a class="buttonStyle" @click="opModule.bathOp('browser')">OP</a>
          <a class="buttonStyle" @click="opModule.bathOp('favourite')">FAV</a>
          <a class="buttonStyle" @click="opModule.bathOp('rename')">RN</a>
          <a class="buttonStyle" @click="opModule.bathOp('move')">MV</a>
          <a class="buttonStyle" v-if="route.name!=='Recycle'" @click="opModule.bathOp('delete')">DEL</a>
          <a class="buttonStyle" v-if="route.name==='Recycle'" @click="opModule.bathOp('delete_forever')">rDEL</a>
          <a class='sysIcon sysIcon_fengefu'></a>
        </template>
        <template v-if="crumbList.length || queryData.id_dir=='0'">
          <a class='buttonStyle sysIcon sysIcon_addfolder' @click='addFolder'></a>
          <a class='buttonStyle sysIcon sysIcon_addfile' @click='addFile'></a>
          <a class='buttonStyle sysIcon sysIcon_fengefu'></a>
        </template>
        <label v-if="opModule && opModule.sortVal">
          <span>Sort : </span>
          <select v-model='opModule.sortVal.value' @change='opModule.setSort(opModule.sortVal.value)'>
            <option v-for='(sortItem, key) in Config.sort' :value='key'
                    :key="`FV_SCH_CON_SORT_${key}`"
            >
              {{ sortItem }}
            </option>
          </select>
        </label>
        <a class='sysIcon sysIcon_fengefu'></a>
        <template v-if="!!opModule">
          <a
            v-for='(type,index) in Config.listType'
            :class="[
            'buttonStyle',
            'sysIcon',
            `sysIcon_listType_${type}`,
            { active:opModule.mode.value === type},
          ]"
            @click='opModule.setMode(type)'
            :key="`FAV_SCH_BTN_${index}`"
          ></a>
        </template>
      </div>
      <div class="pastebin"
           v-if="Pastebin && Pastebin.nodeList.value.length"
      >
        <span :class="['sysIcon', `sysIcon_${Pastebin.mode.value}`,]">
          {{ Pastebin.nodeList.value.length }}
        </span>
      </div>
    </div>
    <div :class="['content_detail', `mode_${opModule?opModule.mode.value:''}`]" ref='contentDOM'>
      <FileItem
        v-for='(node, nodeIndex) in nodeList'
        :key='node.id'
        :node='node'
        :index='nodeIndex'
        :selected='false'
        @go='emitGo'
      ></FileItem>
      <!--      @on-select="emitSelect"-->
    </div>
    <!--    @click="selectNode($event,node)"-->
    <!--    @dblclick="toGo"-->
    <!-- <directory-layout></directory-layout> -->
  </div>
</template>

<style lang='scss'>
.fr_content.view_file {
  display: flex;
  flex-direction: column;
  /*position: relative;
  padding-top: $fontSize*1.5;
  @media (max-width: 1920px) {
    padding-top: $fontSize*3;
  }
  @media (max-width: 1280px) {
    padding-top: $fontSize*3;
  }
  @media (max-width: 960px) {
    padding-top: $fontSize*4.5;
  }*/
}
.content_detail {
  //height: 90vh;
  overflow: auto;
  height: 100%;
  //@include smallScroll();
}
.content_detail.mode_detail {
  //columns: $fontSize * 20 6;
  //column-gap: 0;
  display: flex;
  flex-wrap: wrap;
  //justify-content: space-around;
  justify-content: left;
  align-content: flex-start;
  //display: grid;
  //grid-template-columns: repeat(8,10%);
}
.content_detail.mode_img {
  //columns: $fontSize * 10 12;
  display: flex;
  flex-wrap: wrap;
  //justify-content: space-around;
  justify-content: left;
  align-content: flex-start;
}
.content_detail.mode_text {
  display: table;
  width: 100%;
  height: auto;
}
</style>
