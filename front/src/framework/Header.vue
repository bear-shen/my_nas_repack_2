<script setup lang="ts">
import {useUserStore} from "@/stores/userStore";
import {throwLogin} from "@/Helper";

const navList = [
  {name: "Nas", meta: {cur: true}, path: "/"},
  {name: "Hyper", meta: {cur: false}, path: ""},
  {name: "Router", meta: {cur: false}, path: ""},
  {name: "Spider", meta: {cur: false}, path: ""},
  {name: "Git", meta: {cur: false}, path: ""},
  {name: "Torrent", meta: {cur: false}, path: ""},
];
const userStore = useUserStore();

let user = userStore.get();

function logout() {
  userStore.set(null);
  location.reload();
}

// throwLogin()
</script>

<template>
  <div class="fr_header">
    <div class="logo">Hentai.</div>
    <div class="navi">
      <div
        v-for="route in navList"
        :class="{ active: route.meta?.cur, pointer: 1 }"
        v-html="route.name"
      ></div>
    </div>
    <div class="user">
      <template v-if="user && user.id">
        <div class="pointer">{{ user.name }}</div>
        <ul class="action pointer">
          <li @click="logout">logout</li>
        </ul>
      </template>
      <template v-else>
        <div class="pointer" @click="throwLogin">login</div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.fr_header {
  display: flex;
  justify-content: space-between;
  line-height: $headerHeight;
  * {
    white-space: nowrap;
    //overflow: hidden;
    text-overflow: ellipsis;
  }
}
.logo {
  font-size: $fontSize;
}
.navi {
  display: flex;
  justify-content: space-between;
  div {
    font-size: $fontSize;
    padding: 0 $fontSize * 0.5;
  }
}
.user {
  font-size: $fontSize;
  position: relative;
  width: $fontSize*6;
  text-align: right;
  &:hover .action {
    display: block;
  }
  >div,li{
    padding: 0 $fontSize * 0.5;
  }
  .action {
    display: none;
    background-color:  map.get($colors, bar_meta);
    position: absolute;
    width: 100%;
    text-align: right;
    padding: 0 0 $fontSize * 0.5;
    li {
    }
  }
}
.active,
.user li:hover,
.navi div:hover {
  background-color:  map.get($colors, bar_meta);
  color:  map.get($colors, font);
}
</style>
