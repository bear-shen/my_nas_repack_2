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
  api_tag_group_col, api_tag_group_list_req, api_tag_group_list_resp,
  api_tag_col, api_tag_list_req, api_tag_list_resp, api_node_col,
  api_tag_group_mod_req, api_tag_group_mod_resp,
} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";
import ContentEditable from "@/components/ContentEditable.vue";
import Hinter from "@/components/Hinter.vue";

//
const localConfigure = useLocalConfigureStore();
const modalStore = useModalStore();
const contentDOM: Ref<HTMLElement | null> = ref(null);
const router = useRouter();
const route = useRoute();
let queryData = {
  id: "",
  keyword: "",
  is_del: "",
} as api_tag_group_list_req;

const groupList: Ref<(api_tag_group_col & { edit?: boolean })[]> = ref([]);
const tagList: Ref<api_tag_col[]> = ref([]);
const curGroup: Ref<api_tag_group_col | null> = ref(null);
onMounted(async () => {
  Object.assign(queryData, GenFunc.copyObject(route.query));
  getGroup();
});

onBeforeRouteUpdate(async (to) => {
  getGroup();
});

function getCurGroup() {
  const curId = parseInt(queryData.id);
  let selGroup = {
    id: 0,
    id_node: 0,
    title: '',
    description: '',
    sort: 1,
    status: 1,
    time_create: '',
    time_update: '',
  } as api_tag_group_col;
  for (let i1 = 0; i1 < groupList.value.length; i1++) {
    if (groupList.value[i1].id !== curId) continue;
    selGroup = groupList.value[i1];
    break;
  }
  curGroup.value = selGroup;
}

async function getGroup() {
  const res = await query<api_tag_group_list_resp>("tag_group/get", queryData);
  if (!res) return;
  groupList.value = res;
  getCurGroup();
}

async function getList() {
  const res = await query<api_tag_list_resp>("tag/get", queryData);
  if (!res) return;
  tagList.value = res;
  // console.info(crumbList);
}

//
onUnmounted(() => {
});

//
function go(ext: api_file_list_req) {
  if (!ext.tid) ext.tid = "";
  if (!ext.keyword) ext.keyword = "";
  if (!ext.type) ext.type = "";
  const tQuery = Object.assign(GenFunc.copyObject(queryData), ext);
  router.push({
    path: route.path,
    query: tQuery,
  });
}

async function modGroup(index: number) {
  console.info(index);
  if (!groupList.value[index].edit) {
    groupList.value[index].edit = true;
    return;
  }
  const res = await query<api_tag_group_mod_resp>("tag_group/mod", groupList.value[index]);
  groupList.value[index].edit = false;
  return;
}

async function delGroup(index: number) {
  console.info(index);
  const group = groupList.value.splice(index, 1)[0];
  const res = await query<api_tag_group_mod_resp>("tag_group/del", {
    id: group.id,
  });
}

async function addGroup() {
  const curLs = groupList.value;
  groupList.value = [];
  curLs.unshift({
    title: '',
    description: '',
    id_node: 0,
    sort: 0,
    status: 1,
    node: {},
    edit: true,
  });
  setTimeout(() => {
    groupList.value = curLs;
    console.info(groupList.value);
  }, 20);
}

async function node_hint(text: string): Promise<api_node_col[] | false> {
  console.info('node_hint');
  let queryData = {
    sort: "",
    type: "directory",
    keyword: text,
    pid: "",
    tid: "",
    no_file: '1',
    with_crumb: '1',
    limit: '20',
  } as api_file_list_req;
  const res = await query<api_file_list_resp>("file/get", queryData);
  if (!res) return false;
  console.info(res)
  return res.list;
}

function node_submit(item: api_node_col, groupIndex: number) {
  console.info('node_add', item, groupIndex);
  groupList.value[groupIndex].id_node = item.id;
  groupList.value[groupIndex].node = item;
}

function node_parse(item: api_node_col) {
  console.info('node_parse');
  if (!item) return '';
  const treeMap = [] as string[];
  item.crumb_node?.forEach(crumb => {
    if (crumb.title)
      treeMap.push(crumb.title);
  });
  if (item.title) treeMap.push(item.title);
  return `/ ${treeMap.join(' / ')}`;
}
</script>

<template>
  <div class="fr_content" ref="contentDOM">
    <div class="list_tag_group" v-if="curGroup">
      <div :class="{
        tag_group:true,
        tag_group_add:true,
        active:curGroup.id===0,
}"
           @click="addGroup"
      >
        <span class="sysIcon sysIcon_plus-square-o"></span>
      </div>
      <div v-for="(group,index) in groupList"
           :key="`tagView_group_${index}`"
           :class="{
        active:curGroup.id===group.id,
        tag_group:true,
        edit:group.edit,
        }"
      >
        <template v-if="!group.edit">
          <div class="title">
            <div>{{ group.title }}</div>
            <div class="operator">
              <span class="sysIcon sysIcon_edit" @click="modGroup(index)"></span>
              <span class="sysIcon sysIcon_delete" @click="delGroup(index)"></span>
            </div>
          </div>
          <div class="description">{{ group.description }}</div>
          <div class="node">
            <template v-if="group.node.crumb_node">
          <span v-for="sub in group.node.crumb_node">
            {{ sub.title }}
          </span>
            </template>
            <span>{{ group.node.title }}</span>
          </div>
          <!--          <div class="operator">-->
          <!--          <div class="sort">-->
          <!--            {{ group.sort }}-->
          <!--          </div>-->
          <!--          <div class="operate">-->
          <!--          </div>-->
          <!--          </div>-->
        </template>
        <template v-else>
          <content-editable class="title" v-model="group.title"></content-editable>
          <content-editable class="description" v-model="group.description"></content-editable>
          <hinter
            class="node"
            :get-list="node_hint"
            :submit="node_submit"
            :parse-text="node_parse"
            v-model="group.node"
            :meta="index"
          ></hinter>
          <div class="operator">
            <content-editable class="sort" v-model="group.sort"></content-editable>
            <!--          <div class="operate">-->
            <div>
              <span class="sysIcon sysIcon_save" @click="modGroup(index)"></span>
              <span class="sysIcon sysIcon_delete" @click="delGroup(index)"></span>
            </div>
            <!--          </div>-->
          </div>
        </template>
      </div>
    </div>
    <div class="list_tag">
      <div class="tag"
           v-for="tag in tagList">
        <div class="title">{{ tag.title }}</div>
        <div class="description">{{ tag.description }}</div>
        <div class="alt">{{ tag.alt }}</div>
        <div class="operator">
          <span>delete</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.fr_content {
  padding-bottom: 0;
  height: 100%;
  .list_tag_group {
    width: $fontSize*20;
    background-color: mkColor(map-get($colors, bk), 4);
    height: 100%;
    @include smallScroll();
    overflow-y: scroll;
    .active {
      background-color: mkColor(map-get($colors, bk), 2);
    }
    .tag_group_add {
      span {
        font-size: $fontSize*2;
        line-height: $fontSize*4;
      }
      //text-align: center;
    }
    .tag_group {
      padding: $fontSize*0.5 $fontSize;
      &:hover {
        background-color: mkColor(map-get($colors, bk), 2);
      }
      > div {
        font-size: $fontSize;
        color: map-get($colors, font_sub);
      }
      .title {
        color: map-get($colors, font);
        display: flex;
        justify-content: space-between;
      }
      .node {
        span::before {
          padding: 0 $fontSize*0.125;
          content: '/';
        }
        span:last-child {
          color: mkColor(map-get($colors, font_sub), 4);
          //color: map-get($colors, font_sub);
        }
        span {
        }
      }
      .operator {
        /*display: flex;
        div {
          display: inline-block;
        }*/
        .sysIcon {
          margin-left: $fontSize;
          cursor: pointer;
        }
        //justify-content: space-between;
      }
      .sort {
        width: $fontSize*5;
      }
      &.edit {
        .title, .description, .sort {
          padding: 0 $fontSize*0.5;
        }
        .title, .description,.operator {
          display: block;
          background-color: mkColor(map-get($colors, bk), 2);
        }
        .title::before {
          content: 'T: ';
        }
        .description::before {
          content: 'D: ';
        }
        .sort::before {
          content: 'S: ';
        }
        .operator {
          display: flex;
          justify-content: space-between;
          padding-right: $fontSize*0.5;
        }
      }
    }
    .hinter > div, .content_editor {
      background-color: mkColor(map-get($colors, bk), 2);
    }
  }
  .list_tag {}
}
</style>
