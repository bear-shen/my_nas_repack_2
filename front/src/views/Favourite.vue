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
import Config from "@/Config";

//
const localConfigure = useLocalConfigureStore();
const modalStore = useModalStore();
const contentDOM: Ref<HTMLElement | null> = ref(null);
const router = useRouter();
const route = useRoute();
let groupQueryData = {
  id: "",
  keyword: "",
} as api_favourite_group_list_req;
type api_favourite_group_col_local = (api_favourite_group_col & {
  edit?: boolean, ext_key?: number,
  node?: api_node_col,
});
const groupList: Ref<(api_favourite_group_col_local)[]> = ref([]);
const curGroup: Ref<api_favourite_group_col_local | null> = ref(null);
const curGroupIndex: Ref<number> = ref(-1);

onMounted(async () => {
  // Object.assign(groupQueryData, GenFunc.copyObject(route.query));
  //
  groupQueryData.id = (route.query.id as string) ?? '';
  nodeQueryData.keyword = route.query.keyword as string ?? '';
  nodeQueryData.node_type = route.query.node_type as string ?? '';
  nodeQueryData.rate = route.query.rate as string ?? '';
  //
  await getGroup();
  opModule = new fHelper.opModule({
    route: route,
    router: router,
    // nodeList: nodeList,
    getList: getList,
    contentDOM: contentDOM.value as HTMLElement,
    emitGo: emitGo,
    // groupQueryData: groupQueryData,
  });
  if (groupQueryData.id) {
    locateGroup();
    await getList();
    await opModule.reloadScroll();
  }
});
onUnmounted(() => {
  opModule.destructor();
});

onBeforeRouteUpdate(async (to) => {
  console.info(to);
  groupQueryData.id = (to.query.id as string) ?? '';
  nodeQueryData.keyword = to.query.keyword as string ?? '';
  nodeQueryData.node_type = to.query.node_type as string ?? '';
  nodeQueryData.rate = to.query.rate as string ?? '';

  // await getGroup();
  if (groupQueryData.id) {
    locateGroup();
    await getList();
  }
});

async function getGroup() {
  const res = await query<api_favourite_group_list_resp>("favourite_group/get", groupQueryData);
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
      cascade_dir: '1',
      tag_or: '1',
    },
    edit: true,
    ext_key: (new Date()).valueOf(),
  });
}

function locateGroup() {
  if (!groupQueryData.id) return;
  let groupId = parseInt(groupQueryData.id);
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

let nodeQueryData: api_file_list_req = {
  // mode: 'directory',
  // pid: '0',
  keyword: '',
  // tag_id: '',
  node_type: 'any',
  // cascade_dir: '',
  // with: '',
  // group: '',
  rate: ''
};
const nodeList: Ref<api_node_col[]> = ref([]);
let opModule: opModuleClass;

function search() {
  const tQuery = Object.assign({}, groupQueryData, nodeQueryData);
  router.push({
    path: route.path,
    query: tQuery
  })
}

async function getList(replaceWith?: api_file_list_resp[]) {
  // const group = groupList.value[index];
  nodeList.value = [];
  if (!replaceWith) {
    const res = await query<api_file_list_resp>("file/get", Object.assign({},
      {
        mode: 'favourite',
        fav_id: groupQueryData.id,
        with: 'file,tag',
      }, nodeQueryData ? nodeQueryData : {}) as api_file_list_req);
    if (!res) return;
    nodeList.value = manualSort(res.list, 'name_asc');
  } else {
    nodeList.value = replaceWith;
  }
  opModule.setList(nodeList.value);
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
            fav_id: groupQueryData.id,
            with: 'file,crumb',
          }, node.id ?? 0);
          break;
      }
      break;
  }
}

//

async function node_hint(text: string): Promise<api_node_col[] | false> {
  console.info('node_hint');
  let groupQueryData: api_file_list_req = {
    mode: "search",
    node_type: "directory",
    keyword: text,
    with: 'crumb',
    limit: '20',
  };
  const res = await query<api_file_list_resp>("file/get", groupQueryData);
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

//

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

function tag_del(groupIndex: number, tagIndex: number) {
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
                      <option v-for="(fileType, key) in Config.fileType" :value="fileType" :key="`FAV_G_${group.ext_key}_NODE_TYPE_${key}`">
                        {{ fileType }}
                      </option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>withTag</td>
                  <td class="favTagLs">
                    <div>
                      <p v-for="(tag,tagIndex) in group.tag" :key="`FAV_G_${group.ext_key}_TAG_BTN_${tagIndex}`">
                        <span>{{ tag_parse(tag) }}</span>
                        <span class="sysIcon sysIcon_delete" @click="tag_del(index,tagIndex)"></span>
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
                  <td>or</td>
                  <td>
                    <input type="checkbox" v-model="(group.meta.tag_or as any)"
                           :id="`FAV_G_CB_S_${group.ext_key?group.ext_key:group.id}_TAG_OR`"
                           :true-value="'1'"
                           :false-value="''"
                    />
                    <label class="no_bg" :for="`FAV_G_CB_S_${group.ext_key?group.ext_key:group.id}_TAG_OR`"></label>
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
                  <td>cascade</td>
                  <td>
                    <input type="checkbox" v-model="(group.meta.cascade_dir as any)"
                           :id="`FAV_G_CB_S_${group.ext_key?group.ext_key:group.id}_CASCADE`"
                           :true-value="'1'"
                           :false-value="''"
                    />
                    <label class="no_bg" :for="`FAV_G_CB_S_${group.ext_key?group.ext_key:group.id}_CASCADE`"></label>
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
    <div class="fav_content" ref="contentDOM">
      <div class='content_meta'>
        <div class='search'>
          <label>
            <span>Title : </span><input type='text' v-model='nodeQueryData.keyword'/>
          </label>
          <label>
            <span>Type : </span>
            <select v-model='nodeQueryData.node_type'>
              <option v-for='(type,index) in Config.fileType' :key="`FAV_SCH_CON_TYPE_${index}`">{{ type }}</option>
            </select>
          </label>
          <label>
            <span>Rate : </span>
            <select class='sysIcon' v-model='nodeQueryData.rate'>
              <option v-for='(type,key) in Config.rate' :value='key' v-html='type' :key="`FAV_SCH_CON_RATE_${key}`"></option>
            </select>
          </label>
          <label>
            <button class='sysIcon sysIcon_search' @click='search'></button>
          </label>
        </div>
        <template v-if='opModule &&opModule.showSelectionOp'>
          <div class='display'>
            <a @click="opModule.bathOp('browser')">OP</a>
            <!--            <a @click="opModule.bathOp('favourite')">FAV</a>-->
            <a @click="opModule.bathOp('rename')">RN</a>
            <a @click="opModule.bathOp('move')">MV</a>
            <a v-if="route.name!=='Recycle'" @click="opModule.bathOp('delete')">DEL</a>
            <a v-if="route.name==='Recycle'" @click="opModule.bathOp('delete_forever')">rDEL</a>
            <a class='sysIcon sysIcon_fengefu'></a>
            <label v-if="opModule && opModule.sortVal">
              <span>Sort : </span>
              <select v-model='opModule.sortVal.value' @change='opModule.setSort(sortVal)'>
                <option v-for='(sortItem, key) in Config.sort' :value='key'
                        :key="`FV_SCH_CON_SORT_${key}`"
                >
                  {{ sortItem }}
                </option>
              </select>
            </label>
            <a class='sysIcon sysIcon_fengefu'></a>
            <a
              v-for='(type,index) in Config.listType'
              :class="[
            'sysIcon',
            `sysIcon_listType_${type}`,
            { active: opModule.mode.value === type },
          ]"
              @click='opModule.setMode(type)'
              :key="`FAV_SCH_CON_ICON_${index}`"
            ></a>
          </div>
        </template>
      </div>
      <div :class="['list_fav',`mode_${opModule?opModule.mode.value:''}`,]">
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
            //display: none;
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
  .fav_content {
    width: calc(100% - $fontSize * 20);
    height: 100%;
    overflow: auto;
    //@include smallScroll();
    //columns: $fontSize * 20 6;
    //column-gap: 0;
    .list_fav {
      display: flex;
      flex-wrap: wrap;
      //justify-content: space-around;
      justify-content: left;
      align-content: flex-start;
    }
    .list_fav.mode_text {
      display: table;
      width: 100%;
      height: auto;
    }
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
    .fav_content {
      width: 100%;
      height: 70%;
      .list_fav {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
      }
    }
  }
}
</style>
<!---->