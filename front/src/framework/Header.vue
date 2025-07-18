<script setup lang="ts">
import {useUserStore} from "@/stores/userStore";
import {query, throwLogin} from "@/lib/Helper";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import Config from "@/Config";
import {useModalStore} from "@/stores/modalStore";
import type {api_user_login_req, api_user_login_resp} from "../../../share/Api";
import {onMounted, ref, type Ref} from "vue";

type NavType = {
  name: string,
  path: string,
  meta: {
    cur: boolean,
  },
};
const navList: Ref<NavType[]> = ref([]);
const userStore = useUserStore();

let user = userStore.get();

function logout() {
  userStore.set(null);
  location.reload();
}

onMounted(() => {
  // console.info('onMounted');
  document.addEventListener('fe_config_loaded', () => {
    // console.info('fe_config_loaded', Config.navList)
    navList.value = Config.navList;
  })
});


//
const localConfigure = useLocalConfigureStore();
const themeLs = Config.theme;
let curThemeName = localConfigure.get('theme') ?? 'warm';

function switchTheme() {
  const themeOptions: { [key: string]: string } = {};
  themeLs.forEach(theme => {
    themeOptions[theme[0]] = theme[0];
  })
  const modalStore = useModalStore();
  modalStore.set({
    title: "theme configure",
    alpha: true,
    key: "theme_configure",
    single: true,
    w: 360,
    h: 160,
    minW: 360,
    minH: 160,
    // h: 160,
    allow_resize: true,
    allow_move: true,
    allow_escape: true,
    allow_fullscreen: false,
    auto_focus: true,
    form: [
      {
        type: "radio",
        label: "theme name",
        key: "theme",
        options: themeOptions,
        value: curThemeName,
      },
    ],
    callback: {
      check: async (modal) => {
        console.info(modal);
        curThemeName = modal.content.form[0].value;
        setTheme(curThemeName);
      },
    },
  });
}

function setTheme(themeName) {
  themeLs.forEach(theme => {
    const name = theme[0];
    const href = theme[1];
    if (name !== themeName) return;
    localConfigure.set('theme', name);
    const classNameLs = document.body.className.trim().split(' ');
    const tClassNameLs = [];
    classNameLs.forEach(className => {
      if (!className) return;
      if (!className.length) return;
      if (className.indexOf('theme_') === 0) return;
      tClassNameLs.push(className);
    })
    tClassNameLs.push('theme_' + themeName);
    //
    const cssDOM = document.createElement('link');
    cssDOM.setAttribute('rel', 'stylesheet');
    cssDOM.setAttribute('href', href);
    document.body.appendChild(cssDOM);
    //
    document.body.className = tClassNameLs.join(' ');
  });
}

setTheme(curThemeName);
// throwLogin()
</script>

<template>
  <div class="fr_header">
    <div class="logo">Hentai.</div>
    <div class="navi">
      <a
        v-for="route in navList"
        :key="route.name"
        :class="{ active: route.meta?.cur, pointer: 1 }"
        v-html="route.name"
        :href="route.path"
        target="_blank"
      ></a>
    </div>
    <div class="user">
      <template v-if="user && user.id">
        <div class="pointer">{{ user.name }}</div>
        <ul class="action pointer">
          <li @click="switchTheme">theme</li>
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
  a {
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
  > div, li {
    padding: 0 $fontSize * 0.5;
  }
  .action {
    z-index: 20;
    display: none;
    background-color: map.get($colors, bar_meta);
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
.navi a:hover {
  background-color: map.get($colors, bar_meta);
  color: map.get($colors, font);
}
</style>
