<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import GenFunc from "@/GenFunc";
import {useModalStore} from "@/stores/modalStore";
import ContentEditable from "@/components/ContentEditable.vue";
import type {api_favourite_group_col, api_favourite_group_list_req, api_favourite_group_list_resp, api_favourite_group_mod_req, api_favourite_group_mod_resp, api_file_list_req, api_file_list_resp, api_node_col, api_tag_col, api_tag_list_resp} from "../../../share/Api";
import {query} from "@/Helper";
import FileItem from "@/components/FileItem.vue";
import type {opModule as opModuleClass} from "@/FileViewHelper";
import * as fHelper from "@/FileViewHelper";
import {manualSort} from "@/FileViewHelper";
import Hinter from "@/components/Hinter.vue";
import Rater from "@/components/Rater.vue";

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
};
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
type api_favourite_group_col_local = (api_favourite_group_col & {
  edit?: boolean, ext_key?: number,
  node?: api_node_col,
});
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
    router: router,
    // nodeList: nodeList,
    getList: getList,
    contentDOM: contentDOM.value as HTMLElement,
    emitGo: emitGo,
    // queryData: queryData,
  });
  if (queryData.id) {
    locateGroup();
    await getList();
    opModule.reloadScroll();
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
    await getList();
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
  console.info(groupList.value[index]);
  const target = GenFunc.copyObject(groupList.value[index]) as api_favourite_group_mod_req;
  if (target.edit) {
    groupList.value[index].edit = false;
    target.meta = JSON.stringify(target.meta);
    const res = await query<api_favourite_group_mod_resp>("favourite_group/mod", target);
    if (!res) return;
    groupList.value[index].id = parseInt(res.id ?? '');
  } else {
    groupList.value[index].edit = true;
  }
}

function addGroup(auto: 0 | 1) {
  groupList.value.unshift({
    title: '',
    status: 1,
    auto: auto,
    meta: {
      node_type: 'any',
      tag_id: '',
      rate: '',
      pid: '',
    },
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
  nodeList.value = [];
  const res = await query<api_file_list_resp>("file/get", {
    mode: 'favourite',
    fav_id: queryData.id,
    with: 'file,tag',
  } as api_file_list_req);
  if (!res) return;
  nodeList.value = manualSort(res.list, 'name_asc');
  opModule.setList(nodeList.value);
}

async function detach() {
}

async function attach() {
}

function emitGo(type: string, code?: number) {
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
      // console.info(node);
      if (!node) break;
      switch (node.type) {
        case "directory":
          opModule.go({pid: `${node.id}`, mode: 'directory'});
          break;
        default:
          fHelper.popupDetail({
            mode: 'favourite',
            fav_id: queryData.id,
            with: 'file',
          }, node.id ?? 0);
          break;
      }
      break;
  }
}


async function node_hint(text: string): Promise<api_node_col[] | false> {
  console.info('node_hint');
  let queryData: api_file_list_req = {
    mode: "search",
    node_type: "directory",
    keyword: text,
    with: 'crumb',
    limit: '20',
  };
  const res = await query<api_file_list_resp>("file/get", queryData);
  if (!res) return false;
  // console.info(res)
  if ('root'.indexOf(text) !== -1) {
    res.list.unshift({
      id: 0, title: 'root', status: 1, type: 'directory', crumb_node: [],
    });
  }
  return res.list;
}

function node_submit(item: api_node_col, groupIndex: number) {
  console.info('node_add', item, groupIndex);
  const curGroup = groupList.value[groupIndex];
  curGroup.meta = Object.assign(curGroup.meta ?? {}, {
    pid: item.id,
  });
  groupList.value[groupIndex].node = item;
  // groupList.value[groupIndex].node = item;
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


async function tag_hint(text: string): Promise<api_tag_list_resp | false> {
  const formData = new FormData();
  formData.set('keyword', text);
  formData.set('size', '20');
  const res = await query<api_tag_list_resp>('tag/get', formData);
  return res;
}

function tag_add(item: api_tag_col, groupIndex: number) {
  // console.info(item);
  const curGroup = groupList.value[groupIndex];
  if (!curGroup.tag) curGroup.tag = [];
  curGroup.tag.push(item);
  const tagIdLs: number[] = [];
  curGroup.tag.forEach(tag => tagIdLs.push(tag.id ?? 0));
  curGroup.meta = Object.assign(curGroup.meta ?? {}, {
    tag_id: tagIdLs.join(','),
  });
}

function tag_parse(item: api_tag_col) {
  if (!item) return '';
  // console.info(item);
  return `${item.group.title} : ${item.title}`;
}

function delTag(groupIndex: number, tagIndex: number) {
  const curGroup = groupList.value[groupIndex];
  if (!curGroup.tag) curGroup.tag = [];
  curGroup.tag.splice(tagIndex, 1);
  const tagIdLs: number[] = [];
  curGroup.tag.forEach(tag => tagIdLs.push(tag.id ?? 0));
  curGroup.meta = Object.assign(curGroup.meta ?? {}, {
    tag_id: tagIdLs.join(','),
  });
}


</script>

<template>
  <div class="fr_content view_fav">
    <div class="list_fav_group">
      <div :class="{
        fav_group:true,
        fav_group_add:true,
        active:curGroupIndex===-1,
}"
      >
        <span
          class="sysIcon sysIcon_plus-square-o"
          @click="addGroup(0)"
        ></span>
        <span
          class="sysIcon sysIcon_A"
          @click="addGroup(1)"
        ></span>
      </div>
      <div v-for="(group,index) in groupList"
           :key="`favView_group_${group.ext_key?group.ext_key:group.id}`"
           :class="{
        active:curGroupIndex===index,
        fav_group:true,
        edit:group.edit,
        }"
      >
        <template v-if="group.auto">
          <template v-if="!group.edit">
            <div :class="{active:curGroupIndex==index,auto:true}" @click="goGroup(index)">
              <div class="title">{{ group.title }}</div>
              <div class="operator" @click.stop>
                <span class="sysIcon sysIcon_edit" @click="modGroup(index)"></span>
                <span class="sysIcon sysIcon_delete" @click="delGroup(index)"></span>
              </div>
            </div>
          </template>
          <template v-else>
            <div :class="{active:curGroupIndex==index,auto:true}">
              <content-editable class="title" v-model="group.title" :auto-focus="true"></content-editable>
              <div class="operator">
                <span class="sysIcon sysIcon_save" @click="modGroup(index)"></span>
                <span class="sysIcon sysIcon_delete" @click="delGroup(index)"></span>
              </div>
              <table>
                <tr>
                  <td>nodeType</td>
                  <td>
                    <select v-model="(group.meta as api_file_list_req).node_type as string">
                      <option v-for="(fileType, key) in def.fileType" :value="fileType">
                        {{ fileType }}
                      </option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>withTag</td>
                  <td class="favTagLs">
                    <div>
                      <p v-for="(tag,tagIndex) in group.tag">
                        <span>{{ tag_parse(tag) }}</span>
                        <span class="sysIcon sysIcon_delete" @click="delTag(index,tagIndex)"></span>
                      </p>
                    </div>
                    <hinter
                      :get-list="tag_hint"
                      :submit="tag_add"
                      :parse-text="tag_parse"
                      :meta="index"
                    ></hinter>
                  </td>
                </tr>
                <tr>
                  <td>root</td>
                  <td>
                    <hinter
                      :get-list="node_hint"
                      :submit="node_submit"
                      :parse-text="node_parse"
                      v-model="group.node"
                      :meta="index"
                    ></hinter>
                  </td>
                </tr>
                <tr>
                  <td>rate</td>
                  <td>
                    <rater :node="null" v-model="(group.meta as api_file_list_req).rate"></rater>
                  </td>
                </tr>
              </table>
            </div>
          </template>
        </template>
        <template v-else>
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
            <div :class="{active:curGroupIndex==index}">
              <content-editable class="title" v-model="group.title" :auto-focus="true"></content-editable>
              <div class="operator">
                <span class="sysIcon sysIcon_save" @click="modGroup(index)"></span>
                <span class="sysIcon sysIcon_delete" @click="delGroup(index)"></span>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
    <div class="list_fav" ref="contentDOM">
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
@import "../assets/variables";
.fr_content.view_fav {
  padding-bottom: 0;
  height: 100%;
  display: flex;
  justify-content: space-between;
  .list_fav_group {
    width: $fontSize*20;
    background-color: map-get($colors, bar_meta);
    height: 100%;
    //@include smallScroll();
    overflow-y: scroll;
    .fav_group_add {
      span {
        font-size: $fontSize*1.5;
        line-height: $fontSize*3;
        cursor: pointer;
        padding: $fontSize*0.5;
        margin-right: $fontSize;
      }
      //text-align: center;
    }
    .fav_group {
      padding: $fontSize*0.5 $fontSize;
      &:hover, &.active {
        background-color: map-get($colors, bar_meta_active);
      }
      > div {
        cursor: pointer;
        font-size: $fontSize;
        color: map-get($colors, font_sub);
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        > div {
          width: 100%;
        }
        .title {
          width: $fontSize*12;
        }
        .operator {
          width: $fontSize*4;
        }
      }
      .auto .title:before {
        font-family: "sysIcon" !important;
        font-size: 16px;
        font-style: normal;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        margin-right: $fontSize*0.5;
        content: "\e603";
      }
      //>div
      .title {
        color: map-get($colors, font);
        padding: 0 $fontSize*0.5;
        background-color: transparent;
        overflow: hidden;
        word-break: break-all;
        //display: flex;
        //justify-content: space-between;
        //span.sysIcon {
        //  margin-right: $fontSize*0.5;
        //}
      }
      .operator {
        .sysIcon {
          margin-left: $fontSize;
          cursor: pointer;
        }
      }
      table {
        margin-top: $fontSize*0.5;
        font-size: $fontSize*0.9;
        color: map-get($colors, font_sub);
        width: 100%;
        overflow: hidden;
        display: block;
        td {
          //height: $fontSize*1.5;
          line-height: $fontSize*1.5;
        }
        td:first-child {
          width: $fontSize*4;
        }
        td:last-child {
          padding-left: $fontSize*0.5;
          width: $fontSize*12;
          label::after {
            display: none;
          }
          select {
            color: map-get($colors, font_sub);
            padding: 0 $fontSize;
            text-align: center;
          }
        }
        .favTagLs {
          > div {
            display: block;
            p {
              display: inline-block;
              margin-right: $fontSize*0.5;
              white-space: break-spaces;
              word-break: break-all;
            }
            .sysIcon {
              margin-left: $fontSize*0.25;
            }
          }
          .hinter {
          }
        }
      }
    }
  }
  .list_fav {
    width: calc(100% - $fontSize * 20);
    height: 100%;
    overflow: auto;
    //@include smallScroll();
    //columns: $fontSize * 20 6;
    //column-gap: 0;
    display: flex;
    flex-wrap: wrap;
    //justify-content: space-around;
    justify-content: left;
    align-content: flex-start;
  }
  @media (max-width: $fontSize*50) {
    display: block;
    .list_fav_group {
      width: 100%;
      height: 30%;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      .tag_group {
        min-width: $fontSize*15;
        max-width: 30%;
      }
    }
    .list_fav {
      width: 100%;
      height: 70%;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
    }
  }
}
</style>
<!---->