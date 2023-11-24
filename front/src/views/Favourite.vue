<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import GenFunc from "../../../share/GenFunc";
import {useModalStore} from "@/stores/modalStore";
import ContentEditable from "@/components/ContentEditable.vue";
import type {col_favourite_group} from "../../../share/Database";
import type {api_favourite_group_list_req, api_favourite_group_list_resp, api_favourite_group_mod_resp, api_file_list_req, api_file_list_resp, api_node_col} from "../../../share/Api";
import {query} from "@/Helper";
import FileItem from "@/components/FileItem.vue";
import * as fHelper from "@/FileViewHelper";
import {opModule as opModuleClass} from "@/FileViewHelper";

//
const localConfigure = useLocalConfigureStore();
const modalStore = useModalStore();
const contentDOM: Ref<HTMLElement | null> = ref(null);
const router = useRouter();
const route = useRoute();
let queryData = {
  id: "",
  keyword: "",
} as api_favourite_group_list_req;
type api_favourite_group_col_local = (col_favourite_group & { edit?: boolean, ext_key?: number });
const groupList: Ref<(api_favourite_group_col_local)[]> = ref([]);
const nodeList: Ref<api_node_col[]> = ref([]);
const curGroup: Ref<api_favourite_group_col_local | null> = ref(null);
const curGroupIndex: Ref<number> = ref(-1);
let opModule: opModuleClass;

onMounted(async () => {
  Object.assign(queryData, GenFunc.copyObject(route.query));
  await getGroup();
  opModule = new fHelper.opModule({
    route: route,
    // nodeList: nodeList,
    getList: getList,
    contentDOM: contentDOM.value as HTMLElement,
    // queryData: queryData,
  });
  if (queryData.id) {
    locateGroup();
    getList();
  }
});
onUnmounted(() => {
  opModule.destructor();
});

onBeforeRouteUpdate(async (to) => {
  console.info(to);
  queryData.id = (to.query.id as string) ?? '';
  queryData.keyword = to.query.keyword as string ?? '';
  // await getGroup();
  if (queryData.id) {
    locateGroup();
    getList();
  }
});

async function getGroup() {
  const res = await query<api_favourite_group_list_resp>("favourite_group/get", queryData);
  if (!res) return;
  const targetList = [];
  res.forEach((item) => {
    (item as api_favourite_group_col_local).edit = false;
    (item as api_favourite_group_col_local).ext_key = item.id;
  });
  groupList.value = res ? res : [];
}

async function delGroup(index: number) {
  const target = groupList.value[index];
  const res = await query<api_favourite_group_mod_resp>("favourite_group/del", target);
}

async function modGroup(index: number) {
  const target = groupList.value[index];
  if (target.edit) {
    target.edit = false;
    const res = await query<api_favourite_group_mod_resp>("favourite_group/mod", target);
    if (!res) return;
    groupList.value[index].id = parseInt(res.id ?? '');
  } else {
    target.edit = true;
  }
}

function addGroup() {
  groupList.value.unshift({
    title: '',
    status: 1,
    edit: true,
    ext_key: (new Date()).valueOf(),
  });
}

function locateGroup() {
  if (!queryData.id) return;
  let groupId = parseInt(queryData.id);
  groupList.value.forEach((item, index) => {
    if (groupId !== item.id) return;
    curGroupIndex.value = index;
    curGroup.value = item;
  });
}

async function goGroup(index: number) {
  const target = groupList.value[index];
  // curGroupIndex.value = index;
  // curGroup.value = target;
  router.push({
    path: route.path,
    query: {
      id: target.id,
    },
  });
}

async function getList() {
  // const group = groupList.value[index];
  const res = await query<api_file_list_resp>("file/get", {
    mode: 'favourite',
    pid: queryData.id,
    with: 'file,tag',
  } as api_file_list_req);
  if (!res) return;
  nodeList.value = res.list;
  opModule.setList(nodeList.value);
}

async function detach() {
}

async function attach() {
}

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
    dir_only: "",
    with: "",
    group: "",
  }, ext);
  router.push({
    path: '/',
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
          fHelper.popupDetail(GenFunc.copyObject(queryData), node.id ?? 0);
          break;
      }
      break;
  }
}

</script>

<template>
  <div class="fr_content view_fav" ref="contentDOM">
    <div class="list_fav_group">
      <div :class="{
        fav_group:true,
        fav_group_add:true,
        active:curGroupIndex===-1,
}"
           @click="addGroup"
      >
        <span class="sysIcon sysIcon_plus-square-o"></span>
      </div>
      <div v-for="(group,index) in groupList"
           :key="`favView_group_${group.ext_key?group.ext_key:group.id}`"
           :class="{
        active:curGroupIndex===index,
        fav_group:true,
        edit:group.edit,
        }"
      >
        <template v-if="!group.edit">
          <div :class="{active:curGroupIndex==index}" @click="goGroup(index)">
            <div class="title">{{ group.title }}</div>
            <div class="operator" @click.stop>
              <span class="sysIcon sysIcon_edit" @click="modGroup(index)"></span>
              <span class="sysIcon sysIcon_delete" @click="delGroup(index)"></span>
            </div>
          </div>
        </template>
        <template v-else>
          <div>
            <content-editable class="title" v-model="group.title" :auto-focus="true"></content-editable>
            <div class="operator">
              <span class="sysIcon sysIcon_save" @click="modGroup(index)"></span>
              <span class="sysIcon sysIcon_delete" @click="delGroup(index)"></span>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="list_fav">
      <FileItem
        v-for="(node, nodeIndex) in nodeList"
        :key="nodeIndex"
        :node="node"
        :index="nodeIndex"
        :selected="false"
        @go="emitGo"
      ></FileItem>
      <!--      @go="emitGo"-->
    </div>
  </div>
</template>

<style lang="scss">
.fr_content.view_fav {
  padding-bottom: 0;
  height: 100%;
  display: flex;
  justify-content: space-between;
  .list_fav_group {
    width: $fontSize*20;
    background-color: map-get($colors, bar_meta);
    height: 100%;
    @include smallScroll();
    overflow-y: scroll;
    .fav_group_add {
      span {
        font-size: $fontSize*1.5;
        line-height: $fontSize*3;
      }
      //text-align: center;
    }
    .fav_group {
      padding: $fontSize*0.5 $fontSize;
      &:hover, &.active {
        background-color: map-get($colors, bar_meta_active);
      }
      > div {
        font-size: $fontSize;
        color: map-get($colors, font_sub);
        display: flex;
        justify-content: space-between;
      }
      //>div
      .title {
        color: map-get($colors, font);
        padding: 0 $fontSize*0.5;
        background-color: transparent;
        min-width: $fontSize*10;
        overflow: hidden;
        word-break: break-all;
        //display: flex;
        //justify-content: space-between;
      }
      .operator {
        .sysIcon {
          margin-left: $fontSize;
          cursor: pointer;
        }
      }
    }
  }
  .list_fav {
    width: calc(100% - $fontSize * 20);
    max-height: 100%;
    //columns: $fontSize * 20 6;
    //column-gap: 0;
    display: flex;
    flex-wrap: wrap;
    //justify-content: space-around;
    justify-content: left;
    align-content: flex-start;
  }
}
</style>
<!---->