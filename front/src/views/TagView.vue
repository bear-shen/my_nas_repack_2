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
  api_tag_col, api_tag_list_req, api_tag_list_resp,
} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";

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

const groupList: Ref<api_tag_group_col[]> = ref([]);
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
</script>

<template>
  <div class="fr_content" ref="contentDOM">
    <div class="list_tag_group">
      <div class="tag_group tag_group_add">
        <span class="sysIcon sysIcon_plus-square-o"></span>
      </div>
      <div class="tag_group"
           v-for="group in groupList">
        <div class="title">{{ group.title }}</div>
        <div class="description">{{ group.description }}</div>
        <div class="node">
          <template v-if="group.node.tree">
          <span v-for="sub in group.node.tree">
            {{ sub.title }}
          </span>
          </template>
          <span>{{ group.node.title }}</span>
        </div>
        <div class="operator">
          <span class="sort">
            {{ group.sort }}
          </span>
          <!--          <div class="operate">-->
          <span class="sysIcon sysIcon_delete"></span>
          <!--          </div>-->
        </div>
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

<style scoped lang="scss">
.fr_content {
  padding-bottom: 0;
  height: 100%;
  .list_tag_group {
    width: $fontSize*20;
    background-color: mkColor(map-get($colors, bk), 4);
    height: 100%;
    @include smallScroll();
    overflow-y: scroll;
    .tag_group_add {
      span {
        font-size: $fontSize*3;
        line-height: $fontSize*5;
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
        display: flex;
        span {
          display: inline-block;
        }
        justify-content: space-between;
      }
    }
  }
  .list_tag {}
}
</style>
