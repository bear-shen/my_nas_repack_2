<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import {query} from "@/Helper";
import type {api_local_ls_resp, api_tag_list_resp} from "../../../share/Api";

const props = defineProps<{
  path: string;
  depth: number;
}>();

async function go() {
}

async function ls() {
  const formData = new FormData();
  formData.set('path', props.path);
  const res = await query<api_local_ls_resp>('local/ls', formData);
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

const expand = ref(false);
const list = ref(false);
ls();
</script>

<template>
  <div :class="['local_node', ]">
  </div>
  <template v-if="expand">

  </template>
</template>

<style scoped lang="scss">
.local_node {
}
</style>
