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
  <div class="fr_content local_item_table">
    <table>
      <LocalItem path="/" :depth="1" :meta="rootStatement"></LocalItem>
    </table>
  </div>
</template>

<style lang="scss">
.fr_content.local_item_table {
  table {
    width: 100%;
  }
  tr {
    height: $fontSize*1.5;
    line-height: $fontSize*1.5;
    &:nth-child(2n), &:hover {
      background-color: mkColor(map-get($colors, bk), 4);
    }
  }
  td {
    font-size: $fontSize;
    line-height: $fontSize*1.5;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  td.listIcon {
    width: $fontSize*2;
  }
  td.path {
    //width: 60%;
  }
  td.operate {
    //min-width: $fontSize*40;
    text-align: right;
  }
}
</style>
