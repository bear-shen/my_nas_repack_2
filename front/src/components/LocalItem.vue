<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import {query} from "@/Helper";
import type {api_local_file_statement, api_local_ls_resp, api_tag_list_resp} from "../../../share/Api";

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
    <td v-if="props.meta.isDir" class="listIcon listIcon_file_directory"></td>
    <td v-else-if="props.meta.isFile" class="listIcon listIcon_file_text"></td>
    <td class="path" :style="{paddingLeft:(depth-1)*15+'px'}">{{ props.meta.path }}</td>
    <td>{{ props.meta.timeCreated }}</td>
    <td>{{ props.meta.timeModified }}</td>
    <td class="operate" @click.stop>
      <!--      <button @click="rm">rm</button>-->
      <!--      <button @click=d"mv">mv</button>-->
      <!--      <button @click="cp">cp</button>-->
      <!--      <button v-if="meta.isDir" @click="mkdir">mkdir</button>-->
      <!--      <button v-if="meta.isDir" @click="upd">upd</button>-->
      <button v-if="meta.isDir" @click="imp">imp</button>
    </td>
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
