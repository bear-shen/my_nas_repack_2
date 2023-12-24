<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {query} from "@/Helper";
import type {opModule as opModuleClass} from "@/FileViewHelper";
import * as fHelper from "@/FileViewHelper";
import {manualSort} from "@/FileViewHelper";
import GenFunc from "../../../share/GenFunc";
import type {api_file_list_req, api_file_list_resp, api_file_mkdir_req, api_file_mkdir_resp, api_node_col,} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";
import FileItem from "@/components/FileItem.vue";

const modalStore = useModalStore();
const contentDOM: Ref<HTMLElement | null> = ref(null);
//
// const z = { a: FileItem };
// console.info(z);
const router = useRouter();
const route = useRoute();
const def = {
  fileType: [
    "any",
    "directory",
    "file",
    "audio",
    "video",
    "image",
    "binary",
    "text",
    "pdf",
  ],
  sort: {
    id_asc: "id ↑",
    id_desc: "id ↓",
    name_asc: "name ↑",
    name_desc: "name ↓",
    crt_asc: "crt time ↑",
    crt_desc: "crt time ↓",
    upd_asc: "upd time ↑",
    upd_desc: "upd time ↓",
    rate_asc: "rate ↑",
    rate_desc: "rate ↓",
  },
  listType: ["detail", "text", "img"],
};
let queryData = {
  mode: "",
  pid: "",
  keyword: "",
  tag_id: "",
  node_type: "",
  dir_only: "",
  with: "",
  group: "",
} as api_file_list_req;
// let usePid = false;
//
// defineProps<{
// msg: string;
// }>();
/* onMounted(() => {
  console.info(route.path);
});
let curContainer: RouteRecordRaw | null = null;
watch(route, async (to: RouteLocationNormalizedLoaded) => {
  console.info(to.path, routes);
  routes.forEach((r) => {
    if (r.path !== to.path) return;
    curContainer = r;
    console.info(curContainer.name);
  });
}); */
onBeforeRouteUpdate(async (to) => {
  console.info('onBeforeRouteUpdate', to);
  queryData = Object.assign({
    mode: "",
    pid: "",
    keyword: "",
    tag_id: "",
    node_type: "",
    dir_only: "",
    with: "",
    group: "",
  }, GenFunc.copyObject(to.query));
  await getList();
});

//
let crumbList: Ref<api_node_col[]> = ref([]);
let nodeList: Ref<api_node_col[]> = ref([]);
let opModule: opModuleClass;
// onMounted(async () => {
// getList();
// });
async function getList() {
  console.info('getList', route.name);
  crumbList.value = [];
  nodeList.value = [];
  switch (route.name) {
    default:
      break;
    case 'Recycle':
      queryData.group = 'deleted';
      break;
    case 'Favourite':
      queryData.group = 'favourite';
      break;
  }
  const res = await query<api_file_list_resp>("file/get", queryData);
  if (!res) return;
  // console.info(res);
  crumbList.value = res.path;
  nodeList.value = sortList(res.list, sortVal.value);
  if (opModule) opModule.setList(nodeList.value);
  // console.info(crumbList);
  return {crumb: crumbList.value, node: nodeList.value};
}

function addFolder() {
  let pid = 0;
  let title = 'root';
  if (crumbList.value.length) {
    let curNode = crumbList.value[crumbList.value.length - 1];
    if (curNode) {
      pid = curNode.id ?? 0;
      title = curNode.title ?? 'root';
    }
  }
  modalStore.set({
    title: `mkdir | ${title}`,
    alpha: false,
    key: "",
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
        type: 'text',
      }
    ],
    callback: {
      submit: async (modal) => {
        // console.info(modal);
        const formData = modal.content.form;
        const targetTitle = formData[0].value;
        // console.info(targetTitle)
        if (!targetTitle) return true;
        const res = await query<api_file_mkdir_resp>("file/mkdir", {
          title: targetTitle,
          pid: `${pid}`,
        } as api_file_mkdir_req);
        getList();
        if (!res) return;
      },
    },
  });
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
  modalStore.set({
    title: `upload | ${title}`,
    alpha: false,
    key: "",
    single: false,
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
        componentName: "uploader",
        data: {
          pid: pid,
          emitGo: emitGo,
        },
      },
    ],
  });
}

//
const localConfigure = useLocalConfigureStore();
let mode: Ref<string> = ref(localConfigure.get("file_view_mode") ?? "detail");
const modeKey = localConfigure.listen(
  "file_view_mode",
  (v) => (mode.value = v)
);

function setMode(mode: string) {
  localConfigure.set("file_view_mode", mode);
  if (opModule) opModule.setList(nodeList.value);
}

//
let sortVal: Ref<string> = ref(localConfigure.get("file_view_sort") ?? "name_asc");
// const sortKey = localConfigure.listen(
//   "file_view_sort",
//   (v) => {
//     sortVal.value = v;
//     const preVal = nodeList.value;
//     nodeList.value = [];
//     nodeList.value = sortList(preVal);
//   }
// );

function setSort(sort: string) {
  console.info('setSort', sort);
  localConfigure.set("file_view_sort", sort);
  const preList = nodeList.value;
  nodeList.value = [];
  setTimeout(() => {
    nodeList.value = sortList(preList, sortVal.value);
    if (opModule) opModule.setList(nodeList.value);
  }, fHelper.timeoutDef.sort);
}

function sortList(list: api_node_col[], sort: string) {
  list = manualSort(list, sort);
  return list;
}

//
function search() {
  const tQuery = GenFunc.copyObject(queryData);
  if (tQuery.dir_only && crumbList.value.length) {
    tQuery.pid =
      crumbList.value[crumbList.value.length - 1].id?.toString() ?? "";
    // } else {
    //   delete tQuery.pid;
  }
  tQuery.mode = 'search';
  if (!queryData.keyword && (!queryData.node_type || queryData.node_type == 'any')) {
    return opModule.go({pid: queryData.pid, mode: 'directory',});
  }
  console.info(tQuery);
  router.push({
    path: route.path,
    query: tQuery,
  });
}

function emitGo(type: string, code: number) {
  // console.info("emitGo", type, code);
  switch (type) {
    case "reload":
      getList();
      break;
    case "tag":
      opModule.go({tag_id: `${code}`, mode: 'tag'});
      break;
    case "node":
      let node;
      for (let i1 = 0; i1 < nodeList.value.length; i1++) {
        if (nodeList.value[i1].id !== code) continue;
        node = nodeList.value[i1];
        break;
      }
      if (!node) break;
      switch (node.type) {
        case "directory":
          opModule.go({pid: `${node.id}`, mode: 'directory'});
          break;
        default:
          fHelper.popupDetail(GenFunc.copyObject(queryData), node.id ?? 0);
          break;
      }
      break;
  }
}

// console.info('here');

//
/*let lazyLoadTimer = 0;

function lazyLoad(e: Event) {
  clearTimeout(lazyLoadTimer);
  lazyLoadTimer = setTimeout(triggleLazyLoad, fHelper.timeoutDef.lazyLoad);
}

function triggleLazyLoad() {
  // @todo 这边主要传值不好做, 看看到时候效果怎么样再说吧...
  return;
  // console.info("triggleLazyLoad");
  // if (!contentDOM.value) return;
  // const top = contentDOM.value.scrollTop;
  // console.info(top);
}*/

/*function selectNode(e: MouseEvent, node: api_node_col) {
  console.info(e, node);
}*/

/*function toGo() {
}*/


onMounted(async () => {
  console.info('onMounted');
  localConfigure.release("file_view_mode", modeKey);
  Object.assign(queryData, GenFunc.copyObject(route.query));
  opModule = new fHelper.opModule({
    route: route,
    router: router,
    // nodeList: nodeList,
    getList: getList,
    contentDOM: contentDOM.value as HTMLElement,
    emitGo: emitGo,
    // queryData: queryData,
  });
  await getList();
  opModule.reloadScroll();
  // if (contentDOM.value) {
  //   contentDOM.value.addEventListener("scroll", lazyLoad);
  // }
  // reloadOffset(undefined, fHelper.timeoutDef.offsetDebounce);
});
onUnmounted(() => {
  opModule.destructor();
  // if (contentDOM.value) {
  //   contentDOM.value.removeEventListener("scroll", lazyLoad);
  // }
});
</script>

<template>
  <div class="fr_content">
    <div class="content_meta">
      <div class="crumb" v-if="crumbList.length">
        <a dir="ltr"
           class="item"
           v-for="(node, nodeIndex) in crumbList"
           :key="nodeIndex"
           @click="opModule.go({ pid: `${node?.id}`,mode:'directory' })"
           :title="node.title"
        >{{ node.title }}</a>
      </div>
      <div class="search">
        <label>
          <span>Title : </span><input type="text" v-model="queryData.keyword"/>
        </label>
        <label>
          <span>Type : </span>
          <select v-model="queryData.node_type">
            <option v-for="type in def.fileType">{{ type }}</option>
          </select>
        </label>
        <label v-if="crumbList.length">
          <span>InDir : </span>
          <input type="checkbox" v-model="(queryData.dir_only as any)" id="FV_S_CB"
                 :true-value="1"
                 false-value=""
          />
          <label for="FV_S_CB"></label>
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
          <button class="sysIcon sysIcon_search" @click="search"></button>
        </label>
      </div>
      <div class="display">
        <template v-if="opModule &&opModule.showSelectionOp">
          <a @click="opModule.bathOp('browser')">OP</a>
          <a @click="opModule.bathOp('favourite')">FAV</a>
          <a @click="opModule.bathOp('rename')">RN</a>
          <a @click="opModule.bathOp('move')">MV</a>
          <a v-if="route.name!=='Recycle'" @click="opModule.bathOp('delete')">DEL</a>
          <a v-if="route.name==='Recycle'" @click="opModule.bathOp('delete_forever')">rDEL</a>
          <a class="sysIcon sysIcon_fengefu"></a>
        </template>
        <a class="sysIcon sysIcon_addfolder" @click="addFolder"></a>
        <a class="sysIcon sysIcon_addfile" @click="addFile"></a>
        <a class="sysIcon sysIcon_fengefu"></a>
        <label>
          <span>Sort : </span>
          <select v-model="sortVal" @change="setSort(sortVal)">
            <option v-for="(sortItem, key) in def.sort" :value="key">
              {{ sortItem }}
            </option>
          </select>
        </label>
        <a class="sysIcon sysIcon_fengefu"></a>
        <a
          v-for="type in def.listType"
          :class="[
            'sysIcon',
            `sysIcon_listType_${type}`,
            { active: mode === type },
          ]"
          @click="setMode(type)"
        ></a>
      </div>
    </div>
    <div :class="['content_detail', `mode_${mode}`]" ref="contentDOM">
      <FileItem
        v-for="(node, nodeIndex) in nodeList"
        :key="nodeIndex"
        :node="node"
        :index="nodeIndex"
        :selected="false"
        @go="emitGo"
      ></FileItem>
      <!--      @on-select="emitSelect"-->
    </div>
    <!--    @click="selectNode($event,node)"-->
    <!--    @dblclick="toGo"-->
    <!-- <directory-layout></directory-layout> -->
  </div>
</template>

<style scoped lang="scss">
.fr_content {
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
  .content_meta {
    /*position: fixed;
    top: $fontSize*1.5;
    @include fillAvailable(width);
    z-index: 1;
    //left:0;*/
    $metaBk: map-get($colors, bar_meta);
    background-color: $metaBk;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 0 $fontSize * 0.5;
    //height: $fontSize * 1.5;
    line-height: $fontSize * 1.5;
    //margin-bottom: $fontSize;
    * {
      height: $fontSize * 1.5;
      line-height: $fontSize * 1.5;
      padding-top: 0;
      padding-bottom: 0;
    }
    > * {
      display: inline-block;
      overflow: hidden;
    }
    label {
      margin-right: $fontSize;
    }
    input,
    button,
    select {
      background-color: $metaBk;
      padding: 0;
    }
    a,
    span {
      font-size: $fontSize;
      //line-height: 1.5em;
      padding: 0 0.125em;
      display: inline-block;
    }
    a:hover {
      background-color: map-get($colors, bar_meta_active);
    }
    @media (min-width: 640px) {
      .crumb { max-width: 50%;}
    }
    @media (min-width: 1280px) {
      .crumb { max-width: 90%;}
    }
    @media (min-width: 1920px) {
      .crumb { max-width: 50%;}
    }
    .crumb {
      font-size: $fontSize;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      //direction: rtl;
      /*max-width: $fontSize*30;
      text-align: right;*/
      .item {
        //unicode-bidi: bidi-override;
        //float: left;
        //direction: ltr;
        display: inline-block;
        padding-right: $fontSize * 0.25;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: $fontSize*10;
      }
      .item:hover {
        background-color: map-get($colors, bar_meta_active);
      }
      .item::before {
        content: "/";
        font-size: $fontSize;
        padding-left: $fontSize * 0.25;
        padding-right: $fontSize * 0.25;
      }
    }
    .display a {
      cursor: pointer;
    }
  }
}
.content_detail {
  //height: 90vh;
  overflow: auto;
  height: 100%;
  @include smallScroll();
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
}
</style>
