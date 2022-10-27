<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import HelloWorld from "./components/HelloWorld.vue";
import FrHeader from "./components/Header.vue";
import FrFooter from "./components/Footer.vue";
import dev from "../../share/dev";
dev();
</script>

<template>
  <FrHeader class="fr_header"></FrHeader>
  <div class="fr_body">
    <div class="fr_navi"></div>
    <div class="fr_content"></div>
  </div>
  <FrFooter class="fr_footer"></FrFooter>
  <!-- <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView /> -->
</template>

<style lang="scss">
.fr_body,
.fr_footer {
  width: 100vw;
}
.fr_header,
.fr_footer {
  background-color: mkColor(map-get($colors, bk), 1);
}
.fr_header {
  padding: 0 $fontSize;
  width: calc(100vw - $fontSize * 2);
  height: $headerHeight;
}
.fr_body {
  height: calc(100vh - $headerHeight - $footerHeight);
  display: flex;
  background-color: mkColor(map-get($colors, bk), 2);
}
.fr_navi {
  height: 100%;
  width: $navWidth;
}
.fr_content {
  padding: $headerPad 0 $footerPad;
  height: calc(100% - $headerPad - $footerPad);
  background-color: mkColor(map-get($colors, bk), 3);
  width: calc(100vw - $navWidth);
  @include smallScroll();
  overflow: auto;
}
.fr_footer {
  height: $footerHeight;
}
</style>
