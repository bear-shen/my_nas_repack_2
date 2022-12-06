<script setup lang="ts">
import { watch } from "vue";
import {
  useRouter,
  useRoute,
  type RouteRecordRaw,
  type RouteLocationNormalizedLoaded,
} from "vue-router";
import { routes } from "../router/index";
import { onMounted } from "vue";
import { useLocalConfigureStore } from "../stores/localConfigure";
import type { API_FILE_LIST_RESP } from "../../../share/Api";
import type { NodeCol, FileCol } from "../../../share/Database";
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
  pid: false,
};
const localConfigure = useLocalConfigureStore();
//
let mode = localConfigure.get("file_view_mode") ?? "detail";
localConfigure.watch("file_view_mode", (v) => (mode = v));
function setMode(mode: string) {
  localConfigure.set("file_view_mode", "mode");
}
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
let crumbList: NodeCol[] = [];
let nodeList: NodeCol & {
  file?: {
    preview?: FileCol;
    normal?: FileCol;
    cover?: FileCol;
    raw?: FileCol;
    [key: string]: FileCol | undefined;
  };
} = [];
//
function go() {
  const tQuery = {} as { [key: string]: any };
  for (const key in query) {
    if (!Object.prototype.hasOwnProperty.call(query, key)) continue;
    const val = query[key as keyof typeof query];
    if (!val) continue;
    tQuery[key] = val;
  }
  router.push({
    path: route.path,
    query: JSON.parse(JSON.stringify(tQuery)),
  });
}
//
function search() {
  const tQuery = {} as { [key: string]: any };
  for (const key in query) {
    if (!Object.prototype.hasOwnProperty.call(query, key)) continue;
    const val = query[key as keyof typeof query];
    if (!val) continue;
    tQuery[key] = val;
  }
  console.info(tQuery);
  router.push({
    path: route.path,
    query: JSON.parse(JSON.stringify(tQuery)),
  });
}
</script>

<template>
  <div class="fr_content">
    <div class="content_meta">
      <div class="crumb" v-if="crumbList.length">
        <a
          class="item"
          v-for="(tree_title, tree_index) in crumbList"
          :key="tree_index"
          @click="go()"
          >{{ tree_title }}
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
          <input type="checkbox" v-model="query.pid" id="FV_S_CB" />
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
    }
  }
}
</style>
