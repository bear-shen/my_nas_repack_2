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
    <!--     <template v-if="curContainer">
      <component :is="curContainer?.component?.__name" class="fr_content"></component>
    </template> -->
  </div>
  <!-- footer想了一下可能没有用，因为分页不打算做了。。。 -->
  <!-- <FrFooter class="fr_footer"></FrFooter> -->
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
