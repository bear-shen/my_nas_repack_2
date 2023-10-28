<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {query} from "@/Helper";
import GenFunc from "../../../share/GenFunc";
import type {api_setting_col, api_setting_del_resp, api_setting_list_req, api_setting_list_resp, api_setting_mod_resp,} from "../../../share/Api";
import ContentEditable from "@/components/ContentEditable.vue";
import type {ModalConstruct} from "@/modal";
import {useModalStore} from "@/stores/modalStore";
// import {useModalStore} from "@/stores/modalStore";

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
  {type: 'button', title: 'scanOrphanFiles', method: btn_scanOrphanFiles},
];

async function btn_scanOrphanFiles() {
  const res = await query("setting/scan_orphan_files", {});
  const modalStore = useModalStore();
  modalStore.set({
    title: "success",
    text: "queued",
    w: 320,
    h: 100,
    minW: 320,
    minH: 100,
    allow_resize: false,
    callback: {
      confirm: async function (modal) {
      },
    },
  } as ModalConstruct);
}

</script>

<template>
  <div class="fr_content view_setting" ref="contentDOM">
    <div class="widget_ls">
      <template v-for="widget in widgetLs">
        <template v-if="widget.type">
          <div :class="['widget',widget.type]">
            <button @click="widget.method">{{ widget.title }}</button>
          </div>
        </template>
      </template>
    </div>
    <table>
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
    </table>
  </div>
</template>

<style lang="scss">
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
      background-color: map-get($colors, bk_active);
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