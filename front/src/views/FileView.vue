<script setup lang='ts'>
import type {Ref} from 'vue'
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from 'vue'
import {onBeforeRouteUpdate, useRoute, useRouter} from 'vue-router'
import {useLocalConfigureStore} from '@/stores/localConfigure'
import {query} from '@/Helper'
import type {opModule as opModuleClass} from '@/FileViewHelper'
import * as fHelper from '@/FileViewHelper'
// import {manualSort} from '@/FileViewHelper'
import GenFunc from '@/GenFunc'
import type {api_file_list_req, api_file_list_resp, api_file_mkdir_req, api_file_mkdir_resp, api_node_col} from '../../../share/Api'
import {useModalStore} from '@/stores/modalStore'
import FileItem from '@/components/FileItem.vue'
import Config from "@/Config";

const modalStore = useModalStore()
const contentDOM: Ref<HTMLElement | null> = ref(null)
//
const router = useRouter()
const route = useRoute()
let queryData: api_file_list_req = {
  mode: 'directory',
  pid: '0',
  keyword: '',
  tag_id: '',
  node_type: '',
  cascade_dir: '',
  with: '',
  group: '',
  rate: ''
}
// let usePid = false;
onBeforeRouteUpdate(async (to) => {
  console.info('onBeforeRouteUpdate', to)
  queryData = Object.assign({
    mode: 'directory',
    pid: '0',
    keyword: '',
    tag_id: '',
    node_type: '',
    cascade_dir: '',
    with: '',
    group: '',
    rate: ''
  } as api_file_list_req, GenFunc.copyObject(to.query))
  await getList()
})

//
let crumbList: Ref<api_node_col[]> = ref([])
let nodeList: Ref<api_node_col[]> = ref([])
let opModule: opModuleClass

async function getList(replaceWith?: api_file_list_resp[]) {
  console.info('getList', route.name)
  nodeList.value = [];
  if (!replaceWith) {
    crumbList.value = [];
    switch (route.name) {
      default:
        break;
      case 'Recycle':
        queryData.group = 'deleted';
        break
      case 'Favourite':
        queryData.group = 'favourite';
        break
    }
    const res = await query<api_file_list_resp>('file/get', queryData);
    if (!res) return;
    // console.info(res);
    crumbList.value = res.path;
    nodeList.value = opModule.sortList(res.list, opModule.sortVal.value);
  } else {
    nodeList.value = replaceWith;
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
  modalStore.set({
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
        const formData = modal.content.form
        const targetTitle = formData[0].value
        // console.info(targetTitle)
        if (!targetTitle) return true
        const res = await query<api_file_mkdir_resp>('file/mkdir', {
          title: targetTitle,
          pid: `${pid}`
        } as api_file_mkdir_req)
        getList()
        if (!res) return
      }
    }
  })
}

function addFile() {
  let pid = 0
  let title = 'root'
  if (crumbList.value.length) {
    let curNode = crumbList.value[crumbList.value.length - 1]
    if (curNode) {
      pid = curNode.id ?? 0
      title = curNode.title ?? 'root'
    }
  }
  modalStore.set({
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
const localConfigure = useLocalConfigureStore()

//
function search() {
  const tQuery = GenFunc.copyObject(queryData)
  if (crumbList.value.length) {
    tQuery.pid =
      crumbList.value[crumbList.value.length - 1].id?.toString() ?? ''
    // } else {
    //   delete tQuery.pid;
  }
  tQuery.mode = 'search'
  // console.info(tQuery);
  console.info(!queryData.node_type || queryData.node_type == 'any' || !queryData.rate)
  if (
    !queryData.keyword
    && (
      !queryData.node_type || queryData.node_type == 'any'
    )
    && !queryData.rate
  ) {
    return opModule.go({pid: queryData.pid, mode: 'directory'})
  }
  console.info(tQuery)
  router.push({
    path: route.path,
    query: tQuery
  })
}

function emitGo(type: string, code?: number) {
  console.info('emitGo', type, code)
  switch (type) {
    case 'reload':
      getList()
      break
    case 'tag':
      opModule.go({tag_id: `${code}`, mode: 'tag'})
      break
    case 'node':
      let node
      for (let i1 = 0; i1 < nodeList.value.length; i1++) {
        if (nodeList.value[i1].id !== code) continue
        node = nodeList.value[i1]
        break
      }
      if (!node) break
      switch (node.type) {
        case 'directory':
          opModule.go({pid: `${node.id}`, mode: 'directory'})
          break
        default:
          fHelper.popupDetail(GenFunc.copyObject(queryData), node.id ?? 0)
          break
      }
      break
  }
}


onMounted(async () => {
  console.info('onMounted');
  // localConfigure.release('file_view_mode', modeKey);
  Object.assign(queryData, GenFunc.copyObject(route.query));
  opModule = new fHelper.opModule({
    route: route,
    router: router,
    // nodeList: nodeList,
    getList: getList,
    contentDOM: contentDOM.value as HTMLElement,
    emitGo: emitGo
    // queryData: queryData,
  });
  await getList();
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
  if (!(crumbList.value.length || queryData.pid)) return;
  const keyMap = [];
  if (e.ctrlKey) keyMap.push('ctrl');
  if (e.shiftKey) keyMap.push('shift');
  keyMap.push(e.code);
  switch (keyMap.join('_')) {
    default:
      return;
      break;
    case 'ctrl_KeyU':
      if (opModule && opModule.showSelectionOp) {
        e.preventDefault();
        addFile();
      }
      break;
    case 'ctrl_KeyM':
      if (opModule && opModule.showSelectionOp) {
        e.preventDefault();
        addFolder();
      }
      break;
  }
}

function onDragover(e: DragEvent) {
  // console.info(e);
  if (!(crumbList.value.length || queryData.pid)) return;
  e.stopPropagation();
  e.preventDefault();
  addFile();
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
           @click="opModule.go({ pid: `${node?.id}`,mode:'directory' })"
           :title='node.title'
        >{{ node.title }}</a>
      </div>
      <div class='search'>
        <label>
          <span>Title : </span><input type='text' v-model='queryData.keyword'/>
        </label>
        <label>
          <span>Type : </span>
          <select v-model='queryData.node_type'>
            <option v-for='(type,key) in Config.fileType'
                    :key="`FV_SCH_NODE_TYPE_${key}`"
            >{{ type }}
            </option>
          </select>
        </label>
        <label>
          <span>Rate : </span>
          <select class='sysIcon' v-model='queryData.rate'>
            <option v-for='(type,key) in Config.rate' :value='key' v-html='type'
                    :key="`FV_SCH_CON_RATE_${key}`"
            ></option>
          </select>
        </label>
        <label v-if='crumbList.length'>
          <span>Cascade : </span>
          <input type='checkbox' v-model='(queryData.cascade_dir as any)' id='FV_S_CB'
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
        <template v-if="crumbList.length || queryData.pid=='0'">
          <a class='buttonStyle sysIcon sysIcon_addfolder' @click='addFolder'></a>
          <a class='buttonStyle sysIcon sysIcon_addfile' @click='addFile'></a>
          <a class='buttonStyle sysIcon sysIcon_fengefu'></a>
        </template>
        <label v-if="opModule && opModule.sortVal">
          <span>Sort : </span>
          <select v-model='opModule.sortVal.value' @change='opModule.setSort(sortVal)'>
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
    </div>
    <div :class="['content_detail', `mode_${opModule?opModule.mode.value:''}`]" ref='contentDOM'>
      <FileItem
        v-for='(node, nodeIndex) in nodeList'
        :key='nodeIndex'
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
@import "../assets/variables";
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
}
.content_detail.mode_img {
  //columns: $fontSize * 10 12;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-content: flex-start;
}
.content_detail.mode_text {
  display: table;
  width: 100%;
  height: auto;
}
</style>
