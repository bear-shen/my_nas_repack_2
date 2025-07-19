<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/shares/localConfigure";
import {query} from "@/lib/Helper";
import GenFunc from "@/lib/GenFunc";
import type {
  api_file_list_req, api_file_mov_req, api_import_eht_tag_req,
  api_node_col, api_setting_col, api_setting_del_resp,
  api_setting_list_req, api_setting_list_resp, api_setting_mod_resp,
} from "../../../share/Api";
import ContentEditable from "@/components/ContentEditable.vue";
import type {ModalConstruct} from "@/types/modal";
import {useModalStore} from "@/shares/modalStore";
// import {useModalStore} from "@/shares/modalStore";

type settingType = api_setting_col & {
  edit_key?: boolean,
  edit_val?: boolean,
  ext_key?: string,
  pre_name?: string,
  pre_value?: string,
};
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
} as api_setting_list_req;
const list: Ref<settingType[]> = ref([]);
onMounted(async () => {
  Object.assign(queryData, GenFunc.copyObject(route.query));
  getList();
});

onBeforeRouteUpdate(async (to) => {
  console.info(to);
  // queryData.id = to.query.id ?? '';
  // queryData.keyword = to.query.keyword as string ?? '';
  // queryData.is_del = to.query.is_del as string ?? '';
  getList();
});

//
onUnmounted(() => {
});

async function getList() {
  // console.info('getGroup');
  // groupList.value = [];
  const res = await query<api_setting_list_resp>("setting/get", queryData);
  if (!res) return;
  const target: settingType[] = [];
  for (let i1 = 0; i1 < res.length; i1++) {
    target.push(Object.assign(res[i1], {
      edit_key: false,
      edit_val: false,
      ext_key: `${(new Date().valueOf())}_${Math.random()}`,
      pre_name: res[i1].name,
      pre_value: res[i1].value,
    }));
  }
  list.value = target;
}

function add() {
  list.value.unshift({
    name: "new_key",
    value: '"json format value"',
    pre_name: '',
    pre_value: '',
    edit_key: false,
    edit_val: false,
    ext_key: `${(new Date().valueOf())}_${Math.random()}`,
  });
}

async function del(index: number) {
  const row = list.value.splice(index, 1)[0];
  if (!row.id) return;
  const res = await query<api_setting_del_resp>("setting/del", {
    id: row.id,
  });
}

async function mod(key: string) {
  let target: settingType | null = null;
  for (let i1 = 0; i1 < list.value.length; i1++) {
    const row = list.value[i1];
    if (row.ext_key !== key) continue;
    target = row;
  }
  // console.info(target);
  if (!target) return;
  if (target?.pre_name == target?.name)
    if (target?.pre_value == target?.value) {
      return;
    }
  const res = await query<api_setting_mod_resp>("setting/mod", target);
  if (!res) return;
  target.id = parseInt(res.id ?? '');
  target.pre_name = target.name;
  target.pre_value = target.value;
}

function onFocus(dom: HTMLElement) {
  const key = dom.getAttribute('data-key');
  const type = dom.getAttribute('data-type');
  // console.info(type, key);
  list.value.forEach(row => {
    if (row.ext_key !== key) return;
    switch (type) {
      case 'key':
        row.edit_key = true;
        break;
      case 'val':
        row.edit_val = true;
        break;
    }
  });
}

function onBlur(dom: HTMLElement) {
  const key = dom.getAttribute('data-key');
  const type = dom.getAttribute('data-type');
  // console.info(type, key);
  list.value.forEach(row => {
    if (row.ext_key !== key) return;
    switch (type) {
      case 'key':
        row.edit_key = false;
        break;
      case 'val':
        row.edit_val = false;
        break;
    }
    // console.info(row);
    mod(row.ext_key);
  });
}

type widget = {
  type: string,
  title: string,
  method: () => any,
};
const widgetLs: widget[] = [
  //同步本地文件到数据库
  {type: 'button', title: 'local -> DB', method: btn_syncLocalFile},
  //清理缓存文件夹里可能出现的多余的文件
  {type: 'button', title: 'DB -> local', method: btn_syncDatabaseFile},
  //检测文件
  {type: 'button', title: 'check file', method: btn_checkLocalFile},
  {type: 'button', title: 'rebuild all index', method: btn_rebuildAllIndex},
  // {type: 'button', title: 'nodeStatistics', method: btn_nodeStatistics},
  {type: 'button', title: 'sync bangumi database', method: btn_syncBGMTags},
  {type: 'button', title: 'import EHT tags', method: btn_importEHTTag},
  {type: 'button', title: 'sync jRiver rate', method: btn_syncJRiverRate},
];

async function btn_syncLocalFile() {
  const res = await query("setting/sync_local_file", {});
  if (res === false) return;
  const modalStore = useModalStore();
  modalStore.set(modalStore.simpleMsg("success", "queued"));
}

async function btn_syncDatabaseFile() {
  const res = await query("setting/sync_database_file", {});
  if (res === false) return;
  const modalStore = useModalStore();
  modalStore.set(modalStore.simpleMsg("success", "queued"));
}

async function btn_syncBGMTags() {
  const res = await query("setting/sync_bgm_tag", {});
  if (res === false) return;
  const modalStore = useModalStore();
  modalStore.set(modalStore.simpleMsg("success", "queued"));
}

async function btn_importEHTTag() {
  const modalStore = useModalStore();
  modalStore.set({
    title: `locator | select base dir :`,
    alpha: false,
    key: "",
    single: false,
    w: 400,
    h: 60,
    minW: 400,
    minH: 60,
    // h: 160,
    allow_resize: true,
    allow_move: true,
    allow_fullscreen: false,
    auto_focus: true,
    // text: "this is text",
    component: [
      {
        componentName: "locator",
        data: {
          query: {
            type: 'directory',
          } as api_file_list_req,
          call: async (node: api_node_col) => {
            // console.info(node);
            const formData = new FormData();
            formData.set('id_list', `${node.id}`);
            const res = await query<api_import_eht_tag_req>('setting/import_eht_tag', formData);
            // if (opModuleVal) opModuleVal.emitGo('reload');
            if (res === false) return;
            modalStore.set(modalStore.simpleMsg("success", "queued"));
          }
        },
      },
    ],
  });
}

async function btn_syncJRiverRate() {
  const modalStore = useModalStore();
  const submitModal: ModalConstruct = {
    title: "upload MC Library.xml data",
    w: 400,
    h: 150,
    minW: 400,
    minH: 150,
    allow_resize: true,
    form: [
      {
        label: 'target node id',
        type: 'text',
        key: 'nodeId',
        value: '',
      },
      {
        label: 'xml payload',
        type: 'file',
        // type: 'textarea',
        key: 'payload',
        // value: null,
      },
    ],
    callback: {
      confirm: async function (modal) {
        if (!modal.content.form[1].value) return;
        // console.info(modal);
        const formData = new FormData();
        formData.set('id_node', `${modal.content.form[0].value}`);
        formData.set('payload', modal.content.form[1].value);
        const res = await query<api_import_eht_tag_req>('setting/sync_jriver_rate', formData);
        // if (opModuleVal) opModuleVal.emitGo('reload');
        if (res === false) return;
        modalStore.set(modalStore.simpleMsg("success", "queued"));
      },
    },
  };
  modalStore.set({
    title: `locator | select music base dir :`,
    alpha: false,
    key: "",
    single: false,
    w: 400,
    h: 60,
    minW: 400,
    minH: 60,
    // h: 160,
    allow_resize: true,
    allow_move: true,
    allow_fullscreen: false,
    auto_focus: true,
    // text: "this is text",
    component: [
      {
        componentName: "locator",
        data: {
          query: {
            type: 'directory',
          } as api_file_list_req,
          call: async (target: api_node_col) => {
            submitModal.form[0].value = target.id;
            modalStore.set(submitModal);
          }
        },
      },
    ],
  });
}

async function btn_rebuildAllIndex() {
  const res = await query("setting/full_rebuild_index", {});
  if (res === false) return;
  const modalStore = useModalStore();
  modalStore.set(modalStore.simpleMsg("success", "queued"));
}

async function btn_checkLocalFile() {
  const res = await query<api_setting_col>("setting/check_local_file_result", {});
  if (res === false) return;
  console.info(res);
  const modalStore = useModalStore();
  let resTxt = '';
  let resArr: string[] = [];
  if (res && res.value) {
    if (res.value.db) res.value.db.forEach(s => resArr.push(`<tr><td>db</td><td>${s}</td></tr>`));
    if (res.value.raw) res.value.raw.forEach(s => resArr.push(`<tr><td>raw</td><td>${s}</td></tr>`));
    if (res.value.preview) res.value.preview.forEach(s => resArr.push(`<tr><td>preview</td><td>${s}</td></tr>`));
    if (res.value.normal) res.value.normal.forEach(s => resArr.push(`<tr><td>normal</td><td>${s}</td></tr>`));
    if (res.value.cover) res.value.cover.forEach(s => resArr.push(`<tr><td>cover</td><td>${s}</td></tr>`));
  }
  resTxt = `<table>${resArr.join('')}</table>`;
  console.info(resTxt);
  modalStore.set({
    title: "chk result",
    text: resTxt,
    w: 480,
    h: 360,
    minW: 480,
    minH: 360,
    allow_resize: true,
    callback: {
      checkNew: async function (modal) {
        const res = await query("setting/check_local_file", {});
      },
      close: async function (modal) {
      },
    },
  });
}


</script>

<template>
  <div class="fr_content view_setting" ref="contentDOM">
    <div class="widget_ls">
      <template v-for="(widget,widgetInd) in widgetLs" :key="widgetInd">
        <template v-if="widget.type==='button'">
          <div :class="['widget',widget.type,'buttonStyle']">
            <button @click="widget.method">{{ widget.title }}</button>
          </div>
        </template>
      </template>
    </div>
    <table>
      <tbody>
      <tr>
        <th>key</th>
        <th>value</th>
      </tr>
      <tr>
        <td colspan="2" class="add" @click="add">
          <span class="sysIcon sysIcon_plus-square-o"></span>
          add row
        </td>
      </tr>
      <tr
        v-for="row in list"
        :key="`setting_view_${row.ext_key}`"
      >
        <td :class="{editing:row.edit_key}">
          <content-editable
            v-model="row.name"
            @focus="onFocus"
            @blur="onBlur"
            :data-key="row.ext_key"
            :data-type="'key'"
          ></content-editable>
        </td>
        <td :class="{editing:row.edit_val}">
          <content-editable
            v-model="row.value"
            @focus="onFocus"
            @blur="onBlur"
            :data-key="row.ext_key"
            :data-type="'val'"
          ></content-editable>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.fr_content.view_setting {
  table {
    th, td {
      font-size: $fontSize;
      padding: $fontSize*0.25 $fontSize*0.5;
      text-align: left;
    }
    th {
      font-size: $fontSize;
    }
    td.editing, td:hover {
      background-color: map.get($colors, bk_active);
    }
    td.add {
      font-size: $fontSize;
      line-height: 1.25em;
      span {
        font-size: 1.25em;
      }
    }
  }
  .widget_ls {
    width: 100%;
    columns: 5;
  }
  .widget {
    &.button button {
      font-size: $fontSize*1.25;
      line-height: 1.25em;
      width: 100%;
      display: inline-block;
    }
  }
}
</style>
<!---->
