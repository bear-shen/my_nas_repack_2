<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import {query} from "@/Helper";
import type {
  api_node_col, api_local_file_statement,
  api_local_ls_resp, api_tag_list_resp, api_local_import_resp
} from "../../../share/Api";
import GenFunc from "../../../share/GenFunc";
import {useModalStore} from "@/stores/modalStore";

const props = defineProps<{
  path: string;
  depth: number;
  meta: api_local_file_statement;
}>();

async function go() {
}

async function ls() {
  const formData = new FormData();
  formData.set('path', props.path);
  const res = await query<api_local_ls_resp>('local/ls', formData);
  if (!res) throw new Error('no data');
  console.info(res);
  return res;
}

async function rm() {
}

async function mv() {
}

async function cp() {
}

async function mkdir() {
}

async function upd() {
}

async function imp() {
  const modalStore = useModalStore();
  modalStore.set({
    title: "locator",
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
    fullscreen: false,
    component: [
      {
        componentName: "locator",
        data: {
          query: {type: 'directory'},
          call: async (node: api_node_col) => {
            console.info(node);
            const formData = new FormData();
            formData.set('sourceDir', props.meta.path);
            formData.set('targetNodeId', `${node.id}`);
            const res = await query<api_local_import_resp>('local/imp', formData);
            // return true;
          }
        },
      },
    ],
    /* callback: {
      close: function (modal) {
        console.info(modal);
      },
    }, */
  });

}

async function toggle() {
  if (!props.meta.isDir) return;
  if (!list.value.length) {
    list.value = await ls();
  }
  expand.value = !expand.value;
}

const expand = ref(false);
const list: Ref<api_local_file_statement[]> = ref([]);
if (props.depth == 1) {
  toggle();
}
</script>

<template>
  <tr :class="['local_item', ]" @click="toggle">
    <td class="operate" @click.stop>
      <!--      <button @click="rm">rm</button>-->
      <!--      <button @click=d"mv">mv</button>-->
      <!--      <button @click="cp">cp</button>-->
      <!--      <button v-if="meta.isDir" @click="mkdir">mkdir</button>-->
      <!--      <button v-if="meta.isDir" @click="upd">upd</button>-->
      <button v-if="meta.isDir" @click="imp">imp</button>
    </td>
    <td v-if="props.meta.isDir" class="listIcon listIcon_file_directory"></td>
    <td v-else-if="props.meta.isFile" class="listIcon listIcon_file_text"></td>
    <td class="path" :style="{paddingLeft:(depth-1)*15+'px'}">{{ props.meta.path }}</td>
    <td>{{ props.meta.timeCreated }}</td>
    <td>{{ props.meta.timeModified }}</td>
  </tr>
  <template v-if="expand && props.meta.isDir">
    <template v-for="sub in list">
      <LocalItem
        v-if="sub.isDir||sub.isFile"
        :path="sub.path" :depth="depth+1" :meta="sub"></LocalItem>
    </template>
  </template>
</template>

<style scoped lang="scss">
.local_item {
  td {
    font-size: $fontSize;
  }
}
</style>
