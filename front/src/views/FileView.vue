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
};
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
function setMode(mode: string) {}
function search() {}
function addFolder() {}
function addFile() {}
let mode = "";
let cur_dir: any = {};
let crumbList = [];
function go(type: string, data: any) {}
</script>

<template>
  <div class="fr_content">
    <div class="content_meta">
      <div class="crumb" v-if="cur_dir && cur_dir.tree">
        <a
          class="item"
          v-for="(tree_title, tree_index) in cur_dir.tree.title"
          :key="tree_index"
          @click="go('node', { id: cur_dir.tree.id[tree_index] })"
          >{{ tree_title }}</a
        >
        <a class="item">{{ cur_dir.title }}</a>
      </div>
      <div class="search">
        <label>
          <span>Title : </span><input type="text" v-model="query.keyword" />
        </label>
        <label>
          <span>Type : </span
          ><select v-model="query.type">
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
