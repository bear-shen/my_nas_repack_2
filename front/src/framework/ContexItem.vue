<script setup lang="ts">
import type {Ref} from "vue";
import {ref} from "vue";

type contextItemDef = {
  title: string,
  auth: 'guest' | 'user' | 'admin',
  child?: contextItemDef[],
  method: (e: MouseEvent) => any,
};
const props = defineProps<{
  depth: Number,
  records: Object,
}>();
type contextListDef = contextItemDef[];
const contextList: Ref<contextListDef> = ref([]);
const active: Ref<boolean> = ref(true);
let offset = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  direction: 0,
};

function setMenu() {
  contextList.value = [
    {
      title: 'title1',
      auth: 'user',
      method: (e: MouseEvent) => {
        console.info(e);
      },
    },
    {
      title: 'title2',
      auth: 'user',
      method: (e: MouseEvent) => {
        console.info(e);
      },
    },
    {
      title: 'title3',
      auth: 'user',
      method: (e: MouseEvent) => {
        console.info(e);
      },
    },
  ];
}

function activeMenu() {

}

</script>

<template>
  <div class="fr_context">
    <div :class="{
      context_menu:true,
      show:true,
    }">
      <div v-for="context in contextList"
           :class="{context_item:true,has_sub:context.child?.length}"
      >

      </div>
    </div>
  </div>
</template>

<style lang="scss">
.fr_context {
  pointer-events: none;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 200;
  .context_menu {
    display: none;
    position: fixed;
  }
  .show {
    display: block;
  }
  .context_item {}
  .has_sub {}

}
</style>
