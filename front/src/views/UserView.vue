<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {query} from "@/lib/Helper";
import GenFunc from "@/lib/GenFunc";
import type {api_user_col, api_user_del_resp, api_user_group_col, api_user_group_list_req, api_user_group_list_resp, api_user_group_mod_req, api_user_group_mod_resp, api_user_list_req, api_user_list_resp, api_user_mod_resp,} from "../../../share/Api";
import type {api_file_list_req, api_file_list_resp, api_node_col} from "../../../share/Api";
import ContentEditable from "@/components/ContentEditable.vue";
import Hinter from "@/components/Hinter.vue";

//
const contentDOM: Ref<HTMLElement | null> = ref(null);
const router = useRouter();
const route = useRoute();
let queryData = {
  id: "",
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
  // console.info(to);
  queryData.id = to.query.id ?? '';
  // queryData.keyword = to.query.keyword as string ?? '';
  // queryData.is_del = to.query.is_del as string ?? '';
  getGroup();
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
  // console.info(userList);
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
  const val: api_user_group_mod_req = {
    title: groupList.value[index].title,
    description: groupList.value[index].description,
    admin: groupList.value[index].admin?.toString(),
    status: groupList.value[index].status?.toString(),
    auth: JSON.stringify(groupList.value[index].auth),
  };
  if (groupList.value[index]?.id) val.id = groupList.value[index]?.id?.toString();
  const res = await query<api_user_group_mod_resp>("user_group/mod", val);
  if (!res) return;
  groupList.value[index].edit = false;
  groupList.value[index].id = res.id ?? 0;
  return;
}

async function delGroup(index: number) {
  // console.info(index);
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
    auth: {
      allow: [],
      deny: [],
    },
    admin: 0,
    status: 1,
    edit: true,
    ext_key: (new Date()).valueOf(),
    user: [],
  } as api_user_group_col);
  // setTimeout(() => {
  //   groupList.value = curLs;
  //   console.info(groupList.value);
  // }, 20);
}

async function addAuth(groupIndex: number) {
  console.info('addAuth');
  const group = groupList.value[groupIndex];
  if (!group.auth) group.auth = {};
  if (!group.auth.deny) group.auth.deny = [];
  group.auth.deny.push({
    id: 0, title: 'root', status: 1, type: 'directory', crumb_node: [],
  });
  // console.info(group);
}

async function delAuth(groupIndex: number, authIndex: number) {
  console.info('delAuth');
  const group = groupList.value[groupIndex];
  if (!group.auth) group.auth = {};
  if (!group.auth.deny) group.auth.deny = [];
  group.auth.deny.splice(authIndex, 1);
  groupList.value[groupIndex] = group;
  // console.info(group);
}


async function node_hint(text: string): Promise<api_node_col[] | false> {
  console.info('node_hint');
  let queryData: api_file_list_req = {
    mode: "directory",
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

function node_submit(item: api_node_col, indexLs: number[]) {
  console.info('node_add', item, indexLs);
  const groupIndex = indexLs[0];
  const authIndex = indexLs[1];
  const group = groupList.value[groupIndex];
  group.auth.deny[authIndex] = item;
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

function goGroup(groupIndex: number) {
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
          <div class="title">
            <div @click="goGroup(index)">{{ group.title }}</div>
            <div class="operator">
              <span class="buttonStyle sysIcon sysIcon_edit" @click="modGroup(index)"></span>
              <span class="buttonStyle sysIcon sysIcon_delete" @click="delGroup(index)"></span>
            </div>
          </div>
          <div @click="goGroup(index)" class="description">{{ group.description }}</div>
          <div @click="goGroup(index)" class="meta">
            <span>{{ group.admin ? 'admin' : 'user' }}</span>
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
          <dl class="auth">
            <dt>denyDir</dt>
            <template v-if="group.auth">
              <dd v-for="(authNode,authIndex) in group.auth.deny" :key="`userView_group_${group.ext_key?group.ext_key:group.id}_${authIndex}`">
                <hinter
                  :get-list="node_hint"
                  :submit="node_submit"
                  :parse-text="node_parse"
                  :model-value="authNode"
                  :meta="[index,authIndex]"
                ></hinter>
                <span class="buttonStyle sysIcon sysIcon_delete" @click="delAuth(index,authIndex)"></span>
              </dd>
            </template>
            <dd class="pointer add" @click="addAuth(index)">+</dd>
          </dl>
          <div class="operator">
            <input type="checkbox" v-model="(group.status as any)"
                   :id="`UV_G_CB_S_${group.ext_key?group.ext_key:group.id}`"
                   :true-value="1"
                   :false-value="0"
            />
            <label class="no_bg" :for="`UV_G_CB_S_${group.ext_key?group.ext_key:group.id}`"></label>
            <!--            -->
            <input type="radio" v-model="group.admin"
                   :id="`UV_G_CB_A_${group.ext_key?group.ext_key:group.id}_1`"
                   :name="`UV_G_CB_A_${group.ext_key?group.ext_key:group.id}`"
                   :value="1"
            />
            <label class="no_bg" :for="`UV_G_CB_A_${group.ext_key?group.ext_key:group.id}_1`">
              isAdmin
            </label>
            <input type="radio" v-model="group.admin"
                   :id="`UV_G_CB_A_${group.ext_key?group.ext_key:group.id}_0`"
                   :name="`UV_G_CB_A_${group.ext_key?group.ext_key:group.id}`"
                   :value="0"
            />
            <label class="no_bg" :for="`UV_G_CB_A_${group.ext_key?group.ext_key:group.id}_0`">
              isUser
            </label>
            <!--          <div class="operate">-->
            <div>
              <span class="buttonStyle sysIcon sysIcon_save" @click="modGroup(index)"></span>
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
            <div>{{ user.name }}</div>
            <div>
              <span class="buttonStyle sysIcon sysIcon_edit" @click="modUser(index)"></span>
              <!--              <span class="sysIcon sysIcon_delete" @click="delUser(index)"></span>-->
            </div>
          </div>
          <div class="mail">{{ user.mail }}</div>
          <div class="status">{{ user.status ? 'activate' : 'inactivate' }}</div>
        </template>
        <template v-else>
          <div class="title">
            <content-editable v-model="user.name" :auto-focus="true"></content-editable>
            <div>
              <input type="checkbox" v-model="(user.status as any)"
                     :id="`UV_U_CB_${user.ext_key?user.ext_key:user.id}`"
                     :true-value="1"
                     :false-value="0"
              />
              <label class="no_bg" :for="`UV_U_CB_${user.ext_key?user.ext_key:user.id}`"></label>
              <span class="buttonStyle sysIcon sysIcon_save" @click="modUser(index)"></span>
              <!--              <span class="sysIcon sysIcon_delete" @click="delUser(index)"></span>-->
            </div>
          </div>
          <content-editable
            v-model="user.mail"
            class="mail"></content-editable>
          <content-editable
            v-model="user.password"
            class="password"></content-editable>
          <label class="status">
          </label>
        </template>

      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.fr_content.view_user {
  padding-bottom: 0;
  height: 100%;
  display: flex;
  justify-content: space-between;
  .list_user_group {
    width: $fontSize*20;
    background-color:  map.get($colors, bar_meta);
    height: 100%;
    //@include smallScroll();
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
        background-color:  map.get($colors, bar_meta_active);
      }
      > * {
        font-size: $fontSize;
        line-height: $fontSize*1.5;
        color:  map.get($colors, font_sub);
      }
      .title {
        color:  map.get($colors, font);
        display: flex;
        justify-content: space-between;
      }
      .meta {
        span {
        }
      }
      .operator {
        /*display: flex;
        div {
          display: inline-block;
        }*/
        //justify-content: space-between;
      }
      .sort {
        width: $fontSize*5;
      }
      &.edit {
        > .content_editor, dl {
          padding: 0 $fontSize*0.5;
        }
        > .content_editor, dl, > div {
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
          padding-right: $fontSize*0.5;
          input[type=radio] + label {
            &::after {
              content: '';
            }
          }
          input[type='checkbox'], input[type='radio'] {
            &:checked + label {
              color:  map.get($colors, font);
            }
          }
        }
        .auth dt {
          color:  map.get($colors, font);
        }
        .auth .add {
          text-indent: 0.5em;
          color:  map.get($colors, font);
          text-align: center;
          width: 100%;
          &:hover {
            background-color:  map.get($colors, bk_active);
          }
        }
        .auth dd {
          display: flex;
          justify-content: space-between;
          > * {
            vertical-align: bottom;
            line-height: 24px;
          }
          .hinter {
            width: 90%;
          }
          .buttonStyle {
            padding-top: 0;
            padding-bottom: 0;
          }
        }
      }
    }
    .hinter > div, .content_editor {
      background-color:  map.get($colors, bk_active);
    }
  }
  .list_user {
    width: calc(100% - $fontSize * 20);
    //height: 100%;
    //@include smallScroll();
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
      display: inline-block;
      //width: calc(100% - $fontSize);
      @include fillAvailable(width);
      .title {
        color:  map.get($colors, font);
        display: flex;
        justify-content: space-between;
        span {
          //margin-left: $fontSize*0.5;
          min-width: $fontSize*2;
        }
      }
      .mail {}
      .password {}
      .operator {}
      > div {
        word-break: break-all;
      }
      //color:  map.get($colors, font_sub);
      color:  map.get($colors, font_sub);
    }
    .user.edit {
      background-color:  map.get($colors, bk_active);
      > div, > div .content_editor {
        background-color:  map.get($colors, bk_active);
      }
      .title .content_editor::before {
        content: 'N: ';
      }
      .mail::before {
        content: 'M: ';
      }
      .password::before {
        content: 'P: ';
      }
    }
    .user:hover {
      background-color:  map.get($colors, bk_active);
    }
  }
  @media (max-width: ($fontSize * 50)) {
    display: block;
    .list_user_group {
      width: 100%;
      height: 30%;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      align-content: flex-start;
      .user_group {
        //min-width: $fontSize*15;
        font-size: 0;
        //height: 10px;
        width: calc(50% - $fontSize * 2);
        //padding-left: 0;
        //padding-right: 0;
      }
      .user_group.edit {
        width: 100%;
      }
    }
    .list_user {
      width: 100%;
      height: 70%;
      //.user {
      //  display: flex;
      //  flex-wrap: wrap;
      //  justify-content: space-around;
      //}
    }
  }
}
</style>
<!---->
