<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {query} from "@/lib/Helper";
import GenFunc from "@/lib/GenFunc";
import type {api_file_list_req, api_file_list_resp, api_node_col, api_tag_col, api_tag_del_resp, api_tag_group_col, api_tag_group_list_req, api_tag_group_list_resp, api_tag_group_mod_resp, api_tag_list_req, api_tag_list_resp, api_tag_mod_resp,} from "../../../share/Api";
import * as Modal from "@/shares/Modal";
import ContentEditable from "@/components/ContentEditable.vue";
import Hinter from "@/components/Hinter.vue";

//
const contentDOM: Ref<HTMLElement | null> = ref(null);
const router = useRouter();
const route = useRoute();
let queryData = {
  id: "",
  keyword: "",
  is_del: "",
} as api_tag_group_list_req;
type api_tag_col_local = (api_tag_col & { alt_text?: string, edit?: boolean, ext_key?: number });
const groupList: Ref<(api_tag_group_col & { edit?: boolean, ext_key?: number })[]> = ref([]);
const tagList: Ref<api_tag_col_local[]> = ref([]);
const curGroup: Ref<api_tag_group_col | null> = ref(null);
const curGroupIndex: Ref<number> = ref(-1);
onMounted(async () => {
  Object.assign(queryData, GenFunc.copyObject(route.query));
  getGroup();
});

onBeforeRouteUpdate(async (to) => {
  console.info(to);
  queryData.id = to.query.id ?? '';
  queryData.keyword = to.query.keyword as string ?? '';
  queryData.is_del = to.query.is_del as string ?? '';
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
  getTagList();
}

async function getGroup() {
  // console.info('getGroup');
  // groupList.value = [];
  if (!groupList.value || !groupList.value.length) {
    const res = await query<api_tag_group_list_resp>("tag_group/get", queryData);
    if (!res) return;
    groupList.value = res;
  }
  let curId = parseInt(queryData.id);
  if (curId) {
    let hasCurGroup = false;
    for (let i1 = 0; i1 < groupList.value.length; i1++) {
      // console.info([queryData.id, groupList.value[i1].id]);
      if (curId && curId === groupList.value[i1].id) {
        hasCurGroup = true;
        curGroupIndex.value = i1;
      }
    }
    if (!hasCurGroup)
      curGroupIndex.value = -1;
    // console.info(curGroupIndex.value)
    getTagList();
  }
  // console.info(curGroupIndex.value);
  // console.info(groupList.value);
  // getCurGroup();
}

async function getTagList() {
  // console.info('getTagList');
  // console.info(curGroupIndex.value);
  tagList.value = [];
  if (curGroupIndex.value === -1) return;
  const curGroup = groupList.value[curGroupIndex.value];
  const tagQueryData = {
    id_group: curGroup.id
  } as api_tag_list_req;
  const res = await query<api_tag_list_resp>("tag/get", tagQueryData);
  if (!res) return;
  (res as api_tag_col_local[]).forEach(tag => {
    tag.alt_text = tag.alt?.join(',');
  });
  tagList.value = res;
  console.info(tagList);
}

//
onUnmounted(() => {
});

async function modGroup(index: number) {
  // console.info(index);
  if (!groupList.value[index].edit) {
    groupList.value[index].edit = true;
    return;
  }
  const res = await query<api_tag_group_mod_resp>("tag_group/mod", groupList.value[index]);
  if (!res) return;
  groupList.value[index].edit = false;
  groupList.value[index].id = parseInt(res.id ?? '');
  return;
}

async function delGroup(index: number) {
  console.info(index);
  const group = groupList.value.splice(index, 1)[0];
  if (!group.id) return;
  const res = await query<api_tag_group_mod_resp>("tag_group/del", {
    id: group.id,
  });
}

async function addGroup() {
  const curLs = groupList.value;
  // groupList.value = [];
  curLs.unshift({
    title: '',
    description: '',
    id_node: 0,
    sort: 0,
    status: 1,
    node: {},
    edit: true,
    ext_key: (new Date()).valueOf(),
  });
  // setTimeout(() => {
  //   groupList.value = curLs;
  //   console.info(groupList.value);
  // }, 20);
}

async function node_hint(text: string): Promise<api_node_col[] | false> {
  console.info('node_hint');
  let queryData: api_file_list_req = {
    mode: "search",
    node_type: "directory",
    keyword: text,
    with: 'none',
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

function checkGroup(groupIndex: number) {
  let targetId = 0;
  if (groupIndex !== -1) {
    const curGroup = groupList.value[groupIndex]
    targetId = curGroup.id ?? 0;
  }
  router.push({
    path: route.path,
    query: {id: targetId},
  });
  // curGroupIndex.value = groupIndex;
  // getTagList();
}

function addTag() {
  if (curGroupIndex.value == -1) return;
  const curLs = tagList.value;
  const curGroup = groupList.value[curGroupIndex.value];
  // tagList.value = [];
  curLs.unshift({
    title: '',
    description: '',
    group: {},
    id_group: curGroup.id,
    alt_text: '',
    ext_key: (new Date()).valueOf(),
    edit: true,
  });
  // setTimeout(() => {
  //   tagList.value = curLs;
  //   // console.info(groupList.value);
  // }, 0);
}

async function delTag(index: number) {
  const tag = tagList.value.splice(index, 1)[0];
  if (!tag.id) return;
  const res = await query<api_tag_del_resp>("tag/del", {
    id: tag.id,
  });
}

async function modTag(index: number) {
  // console.info(index);
  if (!tagList.value[index].edit) {
    tagList.value[index].edit = true;
    return;
  }
  tagList.value[index].alt = tagList.value[index].alt_text?.split(/,/m)
  const res = await query<api_tag_mod_resp>("tag/mod", tagList.value[index]);
  if (!res) return;
  tagList.value[index].edit = false;
  tagList.value[index].id = parseInt(res.id ?? '');
}


</script>

<template>
  <div class="fr_content view_tag" ref="contentDOM">
    <div class="list_tag_group">
      <div :class="{
        tag_group:true,
        tag_group_add:true,
        active:curGroupIndex===-1,
}"
           @click="addGroup"
      >
        <span class="sysIcon sysIcon_plus-square-o"></span>
      </div>
      <template v-if="groupList && groupList.length">
        <div v-for="(group,index) in groupList"
             :key="`tagView_group_${group.ext_key?group.ext_key:group.id}`"
             :class="{
        active:curGroupIndex===index,
        tag_group:true,
        edit:group.edit,
        }"
        >
          <template v-if="!group.edit">
            <div class="title">
              <div @click="checkGroup(index)">{{ group.title }}</div>
              <div class="operator">
                <span class="buttonStyle sysIcon sysIcon_edit" @click="modGroup(index)"></span>
                <span class="buttonStyle sysIcon sysIcon_delete" @click="delGroup(index)"></span>
              </div>
            </div>
            <div @click="checkGroup(index)" class="description">{{ group.description }}</div>
            <div @click="checkGroup(index)" class="node">
              <template v-if="group.node && group.node.crumb_node">
          <span v-for="(sub,crumbIndex) in group.node.crumb_node" :key="`tagView_group_${group.ext_key?group.ext_key:group.id}_CR_${crumbIndex}`">
            {{ sub.title }}
          </span>
              </template>
              <span>{{ group.node?.title }}</span>
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
            <content-editable class="title" v-model="group.title" :auto-focus="true"></content-editable>
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
                <span class="buttonStyle sysIcon sysIcon_save" @click="modGroup(index)"></span>
                <span class="buttonStyle sysIcon sysIcon_delete" @click="delGroup(index)"></span>
              </div>
              <!--          </div>-->
            </div>
          </template>
        </div>
      </template>
    </div>
    <div class="list_tag">
      <div :class="{
        tag:true,
        tag_add:true,
}"
           @click="addTag"
      >
        <span class="sysIcon sysIcon_plus-square-o"></span>
      </div>
      <div v-for="(tag,index) in tagList"
           :class="{
        tag:true,
        edit:tag.edit
      }"
           :key="`tag_view_${tag.ext_key?tag.ext_key:tag.id}`"
      >
        <template v-if="!tag.edit">
          <div class="title">
            <div>{{ tag.title }}</div>
            <div>
              <span class="buttonStyle sysIcon sysIcon_edit" @click="modTag(index)"></span>
              <span class="buttonStyle sysIcon sysIcon_delete" @click="delTag(index)"></span>
            </div>
          </div>
          <div v-if="tag.description" class="description">{{ tag.description }}</div>
          <div v-if="tag.alt" class="alt">{{ tag.alt_text }}</div>
        </template>
        <template v-else>
          <div class="title">
            <content-editable v-model="tag.title" :auto-focus="true"></content-editable>
            <div>
              <span class="buttonStyle sysIcon sysIcon_save" @click="modTag(index)"></span>
              <span class="buttonStyle sysIcon sysIcon_delete" @click="delTag(index)"></span>
            </div>
          </div>
          <content-editable
            v-model="tag.description"
            class="description"></content-editable>
          <content-editable
            v-model="tag.alt_text"
            class="alt"></content-editable>
        </template>

      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.fr_content.view_tag {
  padding-bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  .list_tag_group {
    width: $fontSize*20;
    background-color:  map.get($colors, bar_meta);
    height: 100%;
    //@include smallScroll();
    overflow-y: scroll;
    .tag_group_add {
      span {
        font-size: $fontSize*2;
        line-height: $fontSize*4;
      }
      //text-align: center;
    }
    .tag_group {
      padding: $fontSize*0.5 $fontSize;
      &:hover, &.active {
        background-color:  map.get($colors, bar_meta_active);
      }
      > div {
        font-size: $fontSize;
        color:  map.get($colors, font_sub);
      }
      .title {
        color:  map.get($colors, font);
        display: flex;
        justify-content: space-between;
      }
      .node {
        span::before {
          padding: 0 $fontSize*0.125;
          content: '/';
        }
        span:last-child {
          color:  map.get($colors, font_sub);
          //color:  map.get($colors, font_sub);
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
          //margin-left: $fontSize;
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
        .title, .description, .operator, .hinter > div, .content_editor {
          display: block;
          background-color:  map.get($colors, bar_meta_active);
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
          //padding-right: $fontSize*0.5;
          div:last-child {
            margin-top: $fontSize*-0.5;
            //width: $fontSize*4;
            //background-color: white;
            z-index: 5;
          }
        }
      }
    }
    .hinter > div, .content_editor {
      background-color:  map.get($colors, bk_active);
    }
  }
  .list_tag {
    width: calc(100% - $fontSize * 20);
    //height: 100%;
    //@include smallScroll();
    overflow-y: scroll;
    > div {
      font-size: $fontSize;
      -webkit-column-break-inside: avoid;
    }
    //columns: $fontSize * 15 5;
    //column-gap: 0;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    .tag_add .sysIcon {
      font-size: $fontSize*2;
      line-height: $fontSize*4;
    }
    .tag {
      min-width: $fontSize*10;
      width: calc(20% - $fontSize*2);
      //width: $fontSize*15;
      margin: $fontSize*0.5;
      padding: $fontSize*0.5;
      display: inline-block;
      //width: calc(100% - $fontSize);
      //@include fillAvailable(width);
      .title {
        color:  map.get($colors, font);
        display: flex;
        justify-content: space-between;
        span {
          //margin-left: $fontSize*0.5;
          min-width: $fontSize*2;
        }
      }
      .description {}
      .alt {}
      .operator {}
      > div {
        word-break: break-all;
      }
      //color:  map.get($colors, font_sub);
      color:  map.get($colors, font_sub);
    }
    .tag.edit {
      background-color:  map.get($colors, bk_active);
      > div, > div .content_editor {
        background-color:  map.get($colors, bk_active);
      }
      .title .content_editor::before {
        content: 'T: ';
      }
      .description::before {
        content: 'D: ';
      }
      .alt::before {
        content: 'A: ';
      }
    }
    .tag:hover, .tag.active {
      background-color:  map.get($colors, bk_active);
    }
  }
  @media (max-width: ($fontSize*50)) {
    display: block;
    .list_tag_group {
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
    .list_tag {
      width: 100%;
      height: 70%;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      .tag {
        min-width: $fontSize*15;
        max-width: 30%;
      }
    }
  }
}
</style>
<!---->
