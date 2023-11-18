<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import GenFunc from "../../../share/GenFunc";
import {useModalStore} from "@/stores/modalStore";
import ContentEditable from "@/components/ContentEditable.vue";
import type {col_favourite_group} from "../../../share/Database";
import type {api_favourite_group_list_req, api_favourite_group_list_resp, api_node_col, api_tag_group_col} from "../../../share/Api";
import {query} from "@/Helper";

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
const curGroup: Ref<api_tag_group_col | null> = ref(null);
const curGroupIndex: Ref<number> = ref(-1);
onMounted(async () => {
  Object.assign(queryData, GenFunc.copyObject(route.query));
  getGroup();
});

onBeforeRouteUpdate(async (to) => {
  console.info(to);
  queryData.id = (to.query.id as string) ?? '';
  queryData.keyword = to.query.keyword as string ?? '';
  getGroup();
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
}

async function modGroup(index: number) {
  const target = groupList.value[index];
  if (target.edit) {
    target.edit = false;
  } else {
    target.edit = true;
  }
}

function addGroup() {
  groupList.value.push({
    title: '',
    status: 1,
    edit: true,
    ext_key: (new Date()).valueOf(),
  });
}

function checkGroup(index: number) {
}

async function detach() {
}

async function attach() {
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
          <div>
            <div class="title" @click="checkGroup(index)">{{ group.title }}</div>
            <div class="operator">
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
      <div v-for="(node,index) in nodeList"
           :class="{node:true,}"></div>
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
    .hinter > div, .content_editor {
      background-color: map-get($colors, bk_active);
    }
  }
  .list_tag {
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
    .tag_add .sysIcon {
      font-size: $fontSize*2;
      line-height: $fontSize*4;
    }
    .tag {
      //width: $fontSize*15;
      margin: $fontSize*0.5;
      padding: $fontSize*0.5;
      display: inline-block;
      //width: calc(100% - $fontSize);
      @include fillAvailable(width);
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
    .tag.edit {
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
    .tag:hover {
      background-color: map-get($colors, bk_active);
    }
  }
}
</style>
<!---->