<script setup lang="ts">
import FrHeader from "./framework/Header.vue";
import FrFooter from "./framework/Footer.vue";
import FrNavi from "./framework/Navi.vue";
import Popup from "./framework/Popup.vue";
import Context from "./framework/Context.vue";
import {useUserStore} from "@/stores/userStore";
import {query} from "@/Helper";
import type {api_file_list_resp, api_setting_front_conf} from "../../share/Api";
// import dev from "../../share/dev";
import Config from "@/Config";

const userStore = useUserStore();
const userData = userStore.get();
if (userData) {
  document.cookie = `tosho_token=${userData.token}; max-age=31536000`
  loadFeConf();
}

async function loadFeConf() {
  const res = await query<api_setting_front_conf>('setting/get_front_conf');
  if (!res) return;
  console.info(res);
  if (res.onlyoffice_enabled === 'true') {
    Config.onlyOffice.enabled = true;
    Config.onlyOffice.origin = res.origin;
    Config.onlyOffice.apiSrc = res.onlyoffice_api_src;
    Config.onlyOffice.jwtSecret = res.onlyoffice_jwt_secret;
  }
}

// dev();
const containerDef = {};
</script>

<template>
  <FrHeader class="fr_header"></FrHeader>
  <Popup></Popup>
  <Context></Context>
  <div class="fr_body">
    <FrNavi class="fr_navi"></FrNavi>
    <router-view></router-view>
  </div>
</template>

<style lang="scss">
.fr_header,
.fr_body,
.fr_footer {
  width: 100vw;
  overflow: hidden;
}
.fr_header,
.fr_footer {
  background-color: map.get($colors, bar_horizon);
}
.fr_header {
  padding: 0 $fontSize;
  width: calc(100vw - $fontSize * 2);
  //width: 100vw;
  height: $headerHeight;
}
.fr_body {
  // height: calc(100vh - $headerHeight - $footerHeight);
  height: calc(100vh - $headerHeight);
  display: flex;
  background-color: map.get($colors, bar_vertical);
}
.fr_navi {
  height: 100%;
  width: $navWidth;
}
.fr_content {
  padding: $headerPad 0 $footerPad;
  height: calc(100% - $headerPad - $footerPad);
  background-color: map.get($colors, bk);
  width: calc(100vw - $navWidth);
  //@include smallScroll();
  overflow: auto;
}
.fr_footer {
  height: $footerHeight;
}
.content_meta {
  position: relative;
  /*position: fixed;
  top: $fontSize*1.5;
  @include fillAvailable(width);
  z-index: 1;
  //left:0;*/
  font-size: 0;
  $metaBk: map.get($colors, bar_meta);
  background-color: $metaBk;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 0 $fontSize * 0.5;
  //height: $fontSize * 1.5;
  line-height: $fontSize * 1.5;
  //margin-bottom: $fontSize;
  * {
    //height: $fontSize * 1.5;
    line-height: $fontSize * 1.5;
    padding-top: 0;
    padding-bottom: 0;
  }
  > * {
    display: inline-block;
    //overflow: hidden;
  }
  label {
    display: inline-block;
    margin-right: $fontSize;
    //height: $fontSize * 1.5;
    //width: $fontSize * 1.5;
    padding: 0;
    text-align: center;
  }
  input,
    //button,
  select {
    background-color: $metaBk;
    padding: 0 $fontSize*0.25;
  }
  input[type=checkbox] + label, input[type=radio] + label, button {
    padding: 0 $fontSize*0.5;
  }
  a,
  span {
    font-size: $fontSize;
    //line-height: 1.5em;
    padding: 0 0.25em;
    display: inline-block;
  }
  a:hover {
    //background-color:  map.get($colors, bar_meta_active);
  }
  @media (min-width: 640px) {
    .crumb {
      max-width: 50%;
    }
  }
  @media (min-width: 1280px) {
    .crumb {
      max-width: 90%;
    }
  }
  @media (min-width: 1920px) {
    .crumb {
      max-width: 50%;
    }
  }
  .crumb {
    font-size: $fontSize;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    //direction: rtl;
    /*max-width: $fontSize*30;
    text-align: right;*/
    .item {
      //unicode-bidi: bidi-override;
      //float: left;
      //direction: ltr;
      display: inline-block;
      padding-right: $fontSize * 0.25;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: $fontSize * 10;
    }
    .item:hover {
      background-color: map.get($colors, bar_meta_active);
    }
    .item::before {
      content: "/";
      font-size: $fontSize;
      padding-left: $fontSize * 0.25;
      padding-right: $fontSize * 0.25;
    }
  }
  .display a {
    cursor: pointer;
  }
  .pastebin {
    position: absolute;
    right: 0;
    bottom: $fontSize*-2;
    $metaBk: map.get($colors, bar_meta);
    background-color: $metaBk;
    padding: $fontSize*0.25 $fontSize*0.5;
    z-index: 1;
    span {
      font-size: $fontSize*1.25;
      line-height: $fontSize*1.25;
    }
    span::before {
      padding-right: $fontSize*0.25;
    }
  }
}
@media (pointer: coarse) {
  /* 在触摸屏设备上应用的样式 */
  .fr_body {
    height: auto;
    min-height: calc(100vh - $headerHeight);
  }
  .fr_content {
    min-height: calc(100vh - $headerHeight - $headerPad - $footerPad);
  }
}
@media (pointer: fine) {
  /* 在非触摸屏设备上应用的样式 */
}
</style>
