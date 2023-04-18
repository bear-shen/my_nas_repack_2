<script setup lang="ts">
import LocalItem from "@/components/LocalItem.vue";
import type {api_local_file_statement} from "../../../share/Api";

const rootStatement = {
  name: 'root',
  path: '/',
  isDir: true,
  isFile: false,
  size: 0,
  timeCreated: '',
  timeModified: '',
} as api_local_file_statement;
</script>

<template>
  <table class="fr_content">
    <LocalItem path="/" :depth="1" :meta="rootStatement"></LocalItem>
  </table>
</template>
