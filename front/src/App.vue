<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import FrHeader from "./framework/Header.vue";
import FrFooter from "./framework/Footer.vue";
import FrNavi from "./framework/Navi.vue";
import dev from "../../share/dev";
dev();
const containerDef = {};
</script>

<template>
  <FrHeader class="fr_header"></FrHeader>
  <div class="fr_body">
    <FrNavi class="fr_navi"></FrNavi>
    <router-view></router-view>
  </div>
</template>

<style lang="scss">
.fr_body,
.fr_footer {
  width: 100vw;
}
.fr_header,
.fr_footer {
  background-color: mkColor(map-get($colors, bk), 0);
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
  background-color: mkColor(map-get($colors, bk), 1);
}
.fr_navi {
  height: 100%;
  width: $navWidth;
}
.fr_content {
  padding: $headerPad 0 $footerPad;
  height: calc(100% - $headerPad - $footerPad);
  background-color: mkColor(map-get($colors, bk), 2);
  width: calc(100vw - $navWidth);
  @include smallScroll();
  overflow: auto;
}
.fr_footer {
  height: $footerHeight;
}
</style>
