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
  col_user_group,
  col_user,
} from "../../../share/Database";
import {query, queryDemo} from "@/Helper";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import FileItem from "@/components/FileItem.vue";
import type {
  api_file_list_resp,
  api_file_list_req,
  api_user_group_col, api_user_group_list_req, api_user_group_list_resp,
  api_user_col, api_user_list_req, api_user_list_resp, api_node_col,
  api_user_group_mod_req, api_user_group_mod_resp, api_user_mod_resp, api_user_del_resp,
} from "../../../share/Api";
// import {useModalStore} from "@/stores/modalStore";
import ContentEditable from "@/components/ContentEditable.vue";
import Hinter from "@/components/Hinter.vue";

//
const localConfigure = useLocalConfigureStore();
// const modalStore = useModalStore();
const contentDOM: Ref<HTMLElement | null> = ref(null);
const router = useRouter();
const route = useRoute();
let queryData = {
  // id: "",
  // keyword: "",
  // is_del: "",
} as api_user_group_list_req;
type api_user_col_local = (api_user_col & { edit?: boolean, ext_key?: number });
const groupList: Ref<(api_user_group_col & { edit?: boolean, ext_key?: number })[]> = ref([]);
const userList: Ref<api_user_col_local[]> = ref([]);
const curGroup: Ref<api_user_group_col | null> = ref(null);
const curGroupIndex: Ref<number> = ref(-1);
onMounted(async () => {
  Object.assign(queryData, GenFunc.copyObject(route.query));
  getGroup();
});

onBeforeRouteUpdate(async (to) => {
  console.info(to);
});

async function getGroup() {
  // console.info('getGroup');
  // groupList.value = [];
  if (!groupList.value || !groupList.value.length) {
    const res = await query<api_user_group_list_resp>("user_group/get", queryData);
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
    getUserList();
  }
  // console.info(curGroupIndex.value);
  // console.info(groupList.value);
  // getCurGroup();
}

async function getUserList() {
  // console.info('getUserList');
  // console.info(curGroupIndex.value);
  userList.value = [];
  if (curGroupIndex.value === -1) return;
  const curGroup = groupList.value[curGroupIndex.value];
  const userQueryData = {
    id_group: curGroup.id
  } as api_user_list_req;
  const res = await query<api_user_list_resp>("user/get", userQueryData);
  if (!res) return;
  // (res as api_user_col_local[]).forEach(user => {
  //   user.alt_text = user.alt?.join(',');
  // });
  userList.value = res;
  console.info(userList);
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
  const res = await query<api_user_group_mod_resp>("user_group/mod", groupList.value[index]);
  if (!res) return;
  groupList.value[index].edit = false;
  groupList.value[index].id = res.id ?? 0;
  return;
}

async function delGroup(index: number) {
  console.info(index);
  const group = groupList.value.splice(index, 1)[0];
  if (!group.id) return;
  const res = await query<api_user_group_mod_resp>("user_group/del", {
    id: group.id,
  });
}

async function addGroup() {
  const curLs = groupList.value;
  // groupList.value = [];
  curLs.unshift({
    title: '',
    description: '',
    auth: [],
    admin: 1,
    status: 1,
    edit: true,
    ext_key: (new Date()).valueOf(),
    user: [],
  });
  // setTimeout(() => {
  //   groupList.value = curLs;
  //   console.info(groupList.value);
  // }, 20);
}

function node_submit(item: api_node_col, groupIndex: number) {
  console.info('node_add', item, groupIndex);
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
  // getUserList();
}

function addUser() {
  if (curGroupIndex.value == -1) return;
  const curLs = userList.value;
  const curGroup = groupList.value[curGroupIndex.value];
  // userList.value = [];
  curLs.unshift({
    name: '',
    mail: '',
    id_group: curGroup.id,
    password: '',
    status: 1,
    ext_key: (new Date()).valueOf(),
    edit: true,
  });
  // setTimeout(() => {
  //   userList.value = curLs;
  //   // console.info(groupList.value);
  // }, 0);
}

async function delUser(index: number) {
  const user = userList.value.splice(index, 1)[0];
  if (!user.id) return;
  const res = await query<api_user_del_resp>("user/del", {
    id: user.id,
  });
}

async function modUser(index: number) {
  // console.info(index);
  if (!userList.value[index].edit) {
    userList.value[index].edit = true;
    return;
  }
  const res = await query<api_user_mod_resp>("user/mod", userList.value[index]);
  if (!res) return;
  userList.value[index].edit = false;
  userList.value[index].id = parseInt(res.id ?? '');
}


</script>

<template>
  <div class="fr_content view_user" ref="contentDOM">
    <div class="list_user_group" v-if="groupList && groupList.length">
      <div :class="{
        user_group:true,
        user_group_add:true,
        active:curGroupIndex===-1,
}"
           @click="addGroup"
      >
        <span class="sysIcon sysIcon_plus-square-o"></span>
      </div>
      <div v-for="(group,index) in groupList"
           :key="`userView_group_${group.ext_key?group.ext_key:group.id}`"
           :class="{
        active:curGroupIndex===index,
        user_group:true,
        edit:group.edit,
        }"
      >
        <template v-if="!group.edit">
          <div @click="checkGroup(index)" class="title">
            <div>{{ group.title }}</div>
            <div class="operator">
              <span class="sysIcon sysIcon_edit" @click="modGroup(index)"></span>
              <span class="sysIcon sysIcon_delete" @click="delGroup(index)"></span>
            </div>
          </div>
          <div @click="checkGroup(index)" class="description">{{ group.description }}</div>
          <div @click="checkGroup(index)" class="node">
            <template v-if="group.node && group.node.crumb_node">
          <span v-for="sub in group.node.crumb_node">
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
    <div class="list_user">
      <div :class="{
        user:true,
        user_add:true,
}"
           @click="addUser"
      >
        <span class="sysIcon sysIcon_plus-square-o"></span>
      </div>
      <div v-for="(user,index) in userList"
           :class="{
        user:true,
        edit:user.edit
      }"
           :key="`user_view_${user.ext_key?user.ext_key:user.id}`"
      >
        <template v-if="!user.edit">
          <div class="title">
            <div>{{ user.title }}</div>
            <div>
              <span class="sysIcon sysIcon_edit" @click="modUser(index)"></span>
              <span class="sysIcon sysIcon_delete" @click="delUser(index)"></span>
            </div>
          </div>
          <div v-if="user.description" class="description">{{ user.description }}</div>
          <div v-if="user.alt" class="alt">{{ user.alt_text }}</div>
        </template>
        <template v-else>
          <div class="title">
            <content-editable v-model="user.title"></content-editable>
            <div>
              <span class="sysIcon sysIcon_save" @click="modUser(index)"></span>
              <span class="sysIcon sysIcon_delete" @click="delUser(index)"></span>
            </div>
          </div>
          <content-editable
            v-model="user.description"
            class="description"></content-editable>
          <content-editable
            v-model="user.alt_text"
            class="alt"></content-editable>
        </template>

      </div>
    </div>
  </div>
</template>

<style lang="scss">
.fr_content.view_user {
  padding-bottom: 0;
  height: 100%;
  display: flex;
  justify-content: space-between;
  .list_user_group {
    width: $fontSize*20;
    background-color: map-get($colors, bar_meta);
    height: 100%;
    @include smallScroll();
    overflow-y: scroll;
    .user_group_add {
      span {
        font-size: $fontSize*2;
        line-height: $fontSize*4;
      }
      //text-align: center;
    }
    .user_group {
      padding: $fontSize*0.5 $fontSize;
      &:hover, &.active {
        background-color: map-get($colors, bar_meta_active);
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
          color: map-get($colors, font_sub);
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
        .title, .description, .operator, .hinter > div, .content_editor {
          display: block;
          background-color: map-get($colors, bar_meta_active);
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
      background-color: map-get($colors, bk_active);
    }
  }
  .list_user {
    width: calc(100% - $fontSize * 20);
    //height: 100%;
    @include smallScroll();
    overflow-y: scroll;
    > div {
      font-size: $fontSize;
      -webkit-column-break-inside: avoid;
    }
    columns: $fontSize * 15 5;
    column-gap: 0;
    //display: flex;
    //justify-content: left;
    //flex-wrap: wrap;
    .user_add .sysIcon {
      font-size: $fontSize*2;
      line-height: $fontSize*4;
    }
    .user {
      //width: $fontSize*15;
      margin: $fontSize*0.5;
      padding: $fontSize*0.5;
      .title {
        color: map-get($colors, font);
        display: flex;
        justify-content: space-between;
        span {
          margin-left: $fontSize*0.5;
          min-width: $fontSize*2;
        }
      }
      .description {}
      .alt {}
      .operator {}
      > div {
        word-break: break-all;
      }
      //color: map-get($colors, font_sub);
      color: map-get($colors, font_sub);
    }
    .user.edit {
      background-color: map-get($colors, bk_active);
      > div, > div .content_editor {
        background-color: map-get($colors, bk_active);
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
    .user:hover {
      background-color: map-get($colors, bk_active);
    }
  }
}
</style>
<!---->