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
@import "../assets/variables";
.fr_content.local_item_table {
  table {
    width: 100%;
  }
  tr {
    padding: 0 $fontSize;
    height: $fontSize*1.5;
    line-height: $fontSize*1.5;
    &:nth-child(2n), &:hover {
      background-color: map-get($colors, bk_active);
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
  td:first-child {
    padding-left: $fontSize;
  }
  td:last-child {
    padding-right: $fontSize;
  }
  td.listIcon {
    width: $fontSize*2;
    line-height: $fontSize*2;
    font-size: $fontSize*1.5;
  }
  td.path {
    //width: 60%;
  }
  td.operate {
    //min-width: $fontSize*40;
    //text-align: left;
    text-align: right;
    button{
      //background-color: map-get($colors, bk);
      &:hover{
        //background-color: map-get($colors, bk);
      }
    }
  }
}
</style>
