<script setup lang="ts">
import {watch, ref, onUnmounted} from "vue";
import type {Ref} from "vue";
import {
  useRouter,
  useRoute,
  type RouteRecordRaw,
  type RouteLocationNormalizedLoaded,
  onBeforeRouteUpdate,
} from "vue-router";
// import {routes} from "@/router/index";
import {onMounted} from "vue";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import type {
  col_node,
  col_file,
  col_tag_group,
  col_tag,
} from "../../../share/Database";
import {query, queryDemo} from "@/Helper";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import FileItem from "@/components/FileItem.vue";
import type {
  api_file_list_resp,
  api_file_list_req,
  api_node_col, api_file_mkdir_req, api_file_mkdir_resp,
} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";

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
  },
  listType: ["detail", "text", "img"],
};
let queryData = {
  mode: "",
  pid: "",
  keyword: "",
  tag_id: "",
  node_type: "",
  inside: "",
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
function getCurRoute() {
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
    resizable: true,
    movable: false,
    fullscreen: false,
    form: [
      {
        label: 'title',
        type: 'text',
      }
    ],
    callback: {
      submit: async (modal) => {
        console.info(modal);
        const formData = modal.content.form;
        const targetTitle = formData[0].value;
        console.info(targetTitle)
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
    resizable: true,
    movable: false,
    fullscreen: false,
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
let crumbList: Ref<api_node_col[]> = ref([]);
let nodeList: Ref<api_node_col[]> = ref([]);
// onMounted(async () => {
// getList();
// });
async function getList() {
  console.info('getList', route.name);
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
  nodeList.value = sortList(res.list);

  // console.info(crumbList);
}

function sortList(list: col_node[]) {
  let sortType: [keyof col_node, string] = ['id', 'asc'];
  switch (sortVal.value) {
    default:
    case 'id_asc':
      sortType = ['id', 'asc',];
      break;
    case 'id_desc':
      sortType = ['id', 'desc',];
      break;
    case 'name_asc':
      sortType = ['title', 'asc',];
      break;
    case 'name_desc':
      sortType = ['title', 'desc',];
      break;
    case 'crt_asc':
      sortType = ['time_create', 'asc',];
      break;
    case 'crt_desc':
      sortType = ['time_create', 'desc',];
      break;
    case 'upd_asc':
      sortType = ['time_update', 'asc',];
      break;
    case 'upd_desc':
      sortType = ['time_update', 'desc',];
      break;
  }
  list.sort((a, b) => {
    const va = a[sortType[0]];
    const vb = b[sortType[0]];
    const rev = sortType[1] == 'desc' ? -1 : 1;
    return (va ? va : 0) > (vb ? vb : 0) ? rev * 1 : rev * -1;
  })
  return list;
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

function setSort(sortVal: string) {
  console.info('setSort', sortVal);
  localConfigure.set("file_view_sort", sortVal);
}

onMounted(async () => {
  console.info('onMounted');
  localConfigure.release("file_view_mode", modeKey);
  Object.assign(queryData, GenFunc.copyObject(route.query));
  await getList();
  if (contentDOM.value) {
    contentDOM.value.addEventListener("scroll", lazyLoad);
  }
});
onUnmounted(() => {
  if (contentDOM.value) {
    contentDOM.value.removeEventListener("scroll", lazyLoad);
  }
});

//
function go(ext: api_file_list_req) {
  if (!ext.tag_id) ext.tag_id = "";
  if (!ext.keyword) ext.keyword = "";
  if (!ext.node_type) ext.node_type = "";
  const tQuery = Object.assign({
    mode: "",
    pid: "",
    keyword: "",
    tag_id: "",
    node_type: "",
    inside: "",
    with: "",
    group: "",
  }, ext);
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
      go({tag_id: `${code}`, mode: 'tag'});
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
          go({pid: `${node.id}`, mode: 'directory'});
          break;
        default:
          popupDetail(GenFunc.copyObject(queryData), node.id ?? 0);
          break;
      }
      break;
  }
}

function popupDetail(queryData: { [key: string]: any }, curNodeId: number) {
  modalStore.set({
    title: "file browser",
    alpha: false,
    key: "",
    single: false,
    w: 400,
    h: 400,
    minW: 400,
    minH: 400,
    // h: 160,
    resizable: true,
    movable: false,
    fullscreen: false,
    component: [
      {
        componentName: "fileBrowser",
        data: {
          query: GenFunc.copyObject(queryData),
          curId: curNodeId,
        },
      },
    ],
    /* callback: {
      close: function (modal) {
        console.info(modal);
      },
    }, */
  });
}

//
function search() {
  const tQuery = GenFunc.copyObject(queryData);
  if (tQuery.inside && crumbList.value.length) {
    tQuery.pid =
      crumbList.value[crumbList.value.length - 1].id?.toString() ?? "";
  }
  tQuery.mode = 'search';
  if (!queryData.keyword && (!queryData.node_type || queryData.node_type == 'any')) {
    return go({pid: queryData.pid, mode: 'directory',});
  }
  console.info(tQuery);
  router.push({
    path: route.path,
    query: tQuery,
  });
}

// console.info('here');

onBeforeRouteUpdate(async (to) => {
  console.info('onBeforeRouteUpdate', to);
  queryData = Object.assign({
    mode: "",
    pid: "",
    keyword: "",
    tag_id: "",
    node_type: "",
    inside: "",
    with: "",
    group: "",
  }, GenFunc.copyObject(to.query));
  await getList();
});
//
let lazyLoadTimer = 0;

function lazyLoad(e: Event) {
  clearTimeout(lazyLoadTimer);
  lazyLoadTimer = setTimeout(triggleLazyLoad, 200);
}

function triggleLazyLoad() {
  // @todo 这边主要传值不好做, 看看到时候效果怎么样再说吧...
  return;
  // console.info("triggleLazyLoad");
  // if (!contentDOM.value) return;
  // const top = contentDOM.value.scrollTop;
  // console.info(top);
}

/*function selectNode(e: MouseEvent, node: api_node_col) {
  console.info(e, node);
}*/

/*function toGo() {
}*/
</script>

<template>
  <div class="fr_content" ref="contentDOM">
    <div class="content_meta">
      <div class="crumb" v-if="crumbList.length">
        <a
          class="item"
          v-for="(node, nodeIndex) in crumbList"
          :key="nodeIndex"
          @click="go({ pid: `${node?.id}`,mode:'directory' })"
        >{{ node.title }}
        </a>
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
          <input type="checkbox" v-model="queryData.inside" id="FV_S_CB"
                 true-value="1"
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
    <div :class="['content_detail', `mode_${mode}`]">
      <FileItem
        v-for="(node, nodeIndex) in nodeList"
        :key="nodeIndex"
        :node="node"
        :index="nodeIndex"
        @go="emitGo"
      ></FileItem>
    </div>
    <!--    @click="selectNode($event,node)"-->
    <!--    @dblclick="toGo"-->
    <!-- <directory-layout></directory-layout> -->
  </div>
</template>

<style scoped lang="scss">
.fr_content {
  .content_meta {
    $metaBk: mkColor(map-get($colors, bk), 2);
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
    .crumb {
      white-space: nowrap;
      .item {
        padding-left: $fontSize * 0.25;
      }
      .item:hover {
        background-color: mkColor(map-get($colors, bk), 6);
      }
      .item::after {
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
  .content_detail.mode_detail {
    //columns: $fontSize * 20 6;
    //column-gap: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  .content_detail.mode_img {
    //columns: $fontSize * 10 12;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  .content_detail.mode_text {
    display: table;
    width: 100%;
  }
}
</style>
