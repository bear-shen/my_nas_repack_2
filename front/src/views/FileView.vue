<script setup lang="ts">
import { watch, ref } from "vue";
import type { Ref } from "vue";
import {
  useRouter,
  useRoute,
  type RouteRecordRaw,
  type RouteLocationNormalizedLoaded,
  onBeforeRouteUpdate,
} from "vue-router";
import { routes } from "../router/index";
import { onMounted } from "vue";
import { useLocalConfigureStore } from "../stores/localConfigure";
import type {
  col_node,
  col_file,
  col_tag_group,
  col_tag,
} from "../../../share/Database";
import { queryDemo } from "../Helper";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import FileItem from "@/components/FileItem.vue";
import type {
  api_file_list_resp,
  api_file_list_req,
  api_node_col,
} from "../../../share/Api";
//
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
const query = {
  sort: "",
  type: "",
  keyword: "",
  pid: "",
} as api_file_list_req;
let usePid = true;
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
function getCurRoute() {}
function addFolder() {}
function addFile() {}
//
let crumbList: Ref<api_node_col[]> = ref([]);
let nodeList: Ref<api_node_col[]> = ref([]);
// onMounted(async () => {
// getList();
// });
getList();
async function getList() {
  const res: api_file_list_resp = await queryDemo(
    "file/get",
    query,
    smp_file_list_resp
  );
  // console.info(res);
  crumbList.value = res.path;
  nodeList.value = res.list;
  // console.info(crumbList);
}
//
const localConfigure = useLocalConfigureStore();
let mode: Ref<string> = ref(localConfigure.get("file_view_mode") ?? "detail");
localConfigure.watch("file_view_mode", (v) => (mode.value = v));
function setMode(mode: string) {
  localConfigure.set("file_view_mode", mode);
}
//
function go(ext: api_file_list_req) {
  const tQuery = Object.assign(GenFunc.copyObject(query), ext);
  router.push({
    path: route.path,
    query: tQuery,
  });
}
//
function search() {
  const tQuery = GenFunc.copyObject(query);
  if (usePid && crumbList.value.length) {
    tQuery.pid =
      crumbList.value[crumbList.value.length - 1].id?.toString() ?? "";
  }
  console.info(tQuery);
  router.push({
    path: route.path,
    query: tQuery,
  });
}
onBeforeRouteUpdate(async (to) => {
  console.info(to);
  await getList();
});
</script>

<template>
  <div class="fr_content">
    <div class="content_meta">
      <div class="crumb" v-if="crumbList.length">
        <a
          class="item"
          v-for="(node, nodeIndex) in crumbList"
          :key="nodeIndex"
          @click="go({ pid: `${node?.id}` })"
          >{{ node.title }}
        </a>
      </div>
      <div class="search">
        <label>
          <span>Title : </span><input type="text" v-model="query.keyword" />
        </label>
        <label>
          <span>Type : </span>
          <select v-model="query.type">
            <option v-for="type in def.fileType">{{ type }}</option>
          </select>
        </label>
        <label>
          <span>Sort : </span>
          <select v-model="query.sort">
            <option v-for="(sort, key) in def.sort" :value="key">
              {{ sort }}
            </option>
          </select>
        </label>
        <label v-if="crumbList.length">
          <span>InDir : </span>
          <input type="checkbox" v-model="usePid" id="FV_S_CB" />
          <label for="FV_S_CB"></label>
        </label>
        <!--      <label>
              <input
                type="checkbox"
                id="content_directory_directory_only_checkbox"
                v-model="query.is_fav"
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
      ></FileItem>
    </div>
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
    height: $fontSize * 1.5;
    line-height: $fontSize * 1.5;
    margin-bottom: $fontSize;
    * {
      height: $fontSize * 1.5;
      line-height: $fontSize * 1.5;
      padding-top: 0;
      padding-bottom: 0;
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
  }
  .content_detail.mode_detail {
    columns: $fontSize * 20 6;
    column-gap: 0;
  }
  .content_detail.mode_img {
    columns: $fontSize * 10 12;
  }
  .content_detail.mode_text {
    display: table;
    width: 100%;
  }
}
</style>
