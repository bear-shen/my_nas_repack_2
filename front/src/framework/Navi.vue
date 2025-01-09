<script setup lang="ts">
import { routes } from "../router";
import NaviContent from "./NaviContent.vue";
</script>

<template>
  <div class="fr_navi" :class="{ folded: false }">
    <!-- <div class="fold">
      <span class="sysIcon sysIcon_swap"></span>
    </div> -->
    <NaviContent :records="routes" :depth="1"></NaviContent>
    <!--    <navi-content :records="$routeData" :depth="1" :fold="$store.state.framework.fold"></navi-content>-->
  </div>
</template>

<style lang="scss">
.fr_navi {
  z-index: 10;
  text-align: center;
  .title.active {
    background-color:  map.get($colors, bar_vertical_active);
  }
  .title:hover {
    background-color:  map.get($colors, bar_vertical_active);
    .content {
      display: inline-block;
    }
  }
  .title {
    display: block;
    position: relative;
    white-space: nowrap;
    line-height: $fontSize * 2.5;
    height: $fontSize * 2.5;
    z-index: 50;
    .icon {
      font-size: $fontSize * 1.25;
    }
    .content {
      background-color:  map.get($colors, bar_vertical);
      padding: 0 $fontSize * 0.5;
      display: none;
      position: absolute;
      left: $navWidth;
      top: 0;
      font-size: $fontSize;
    }
  }
}
</style>
