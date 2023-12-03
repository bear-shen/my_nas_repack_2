<script setup lang="ts">
import type {Ref} from "vue";
import {onMounted, ref} from "vue";
import {useUserStore} from "@/stores/userStore";
import {useContextStore} from "@/stores/useContext";
import type {contextItemDef, contextListDef} from "@/context";

const userStore = useUserStore();
const user = userStore.get();
const userRole = user ? (user?.group.admin ? 2 : 1) : 0;

const useContext = useContextStore();

const contextList: Ref<contextListDef> = ref([]);

const contextDOM: Ref<HTMLElement | null> = ref(null);
const active: Ref<boolean> = ref(true);
let offset = {
  x: -1000,
  y: 0,
  w: 0,
  h: 0,
  direction: 'lb',
};

useContext.register(triggerMenu);

function triggerMenu(menuDefLs: contextListDef, e: MouseEvent) {
  active.value = false;
  const ls: contextListDef = [];
  menuDefLs.forEach(menuDef => {
    if (!menuAuthFilter(menuDef)) return;
    if (menuDef.child) {
      let sLs: contextItemDef[] = [];
      menuDef.child.forEach(menuDef => {
        if (!menuAuthFilter(menuDef)) return;
        sLs.push(menuDef);
      });
      if (!sLs.length) return;
      menuDef.child = sLs;
    }
    ls.push(menuDef);
  });
  contextList.value = ls;
  console.info(ls);
  //
  setTimeout(() => reloadLayout(e), 20);
}

function menuAuthFilter(menuDef: contextItemDef) {
  switch (menuDef.auth) {
    case 'none':
      return false;
      break;
    default:
    case 'guest':
      return true;
      break;
    case 'user':
      if (userRole < 1) break;
      return true;
      break;
    case 'admin':
      if (userRole < 2) break;
      return true;
      break;
  }
}

function reloadLayout(e: MouseEvent) {
  if (!contextDOM.value) return;
  const dom = contextDOM.value;
  const nOffset = {
    x: e.clientX,
    y: e.clientY,
    w: dom?.offsetWidth,
    h: dom?.offsetHeight,
    direction: 'rb',
  };
  let d = ['r', 'b',];
  if (nOffset.w + nOffset.x > window.innerWidth) {
    d[0] = 'l';
  }
  if (nOffset.h + nOffset.y > window.innerHeight) {
    d[1] = 't';
  }
  nOffset.direction = d.join('');
  switch (nOffset.direction) {
    case 'rb':
      break;
    case 'rt':
      nOffset.y -= nOffset.h;
      break;
    case 'lb':
      nOffset.x -= nOffset.w;
      break;
    case 'lt':
      nOffset.x -= nOffset.w;
      nOffset.y -= nOffset.h;
      break;
  }
  offset = nOffset;
  setTimeout(() => active.value = true, 10);
}

function closeMenu() {
  active.value = false;
  setTimeout(() => {
    contextList.value = [];
    offset = {
      x: -1000,
      y: 0,
      w: 0,
      h: 0,
      direction: 'lb',
    };
  }, 10);
}

onMounted(() => {
  // triggerMenu([],null);
});

addEventListener('contextmenu', (e: MouseEvent) => {
  console.info('triggerMenu');
  triggerMenu([], e)
});
addEventListener('click', (e: MouseEvent) => {
  console.info('closeMenu');
  closeMenu();
});
</script>

<template>
  <div class="fr_context">
    <div :class="[
      'context_menu',
      active?'show':'',
      offset.direction,
    ]"
         :style="{
         left:offset.x+'px',
         top:offset.y+'px',
         }"
         ref="contextDOM"
    >
      <div v-for="context in contextList"
           v-if="true"
           :class="[
             'context_item',
             context.child?.length?'has_sub':'',
           ]"
           @click="context.method"
      >
        <span v-html="context.title"></span>
        <template v-if="context.child && context.child.length">
          <div class="context_menu_sub">
            <div v-for="subContext in context.child"
                 v-if="true"
                 :class="{context_item:true}"
                 @click="subContext.method"
            >
              <span v-html="subContext.title"></span>
            </div>
          </div>
        </template>
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
    //display: none;
    //z-index: -1;
    position: fixed;
    pointer-events: all;
    left: 100vw;
    top: 0;
  }
  .show {
    //z-index: 1;
    display: block;
  }
  .context_item {
    position: relative;
    font-size: $fontSize;
    line-height: $fontSize*1.25;
    width: $fontSize*10;
    white-space: nowrap;
    padding: $fontSize*0.25 $fontSize*0.5;
    background-color: map-get($colors, context);
    //border-bottom: 1px solid map-get($colors, context_active);
    &:hover {
      background-color: map-get($colors, context_active);
    }
  }
  .context_item span, .context_item.has_sub:after {
    display: inline-block;
    vertical-align: bottom;
  }
  .context_item span {
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
  .context_item.has_sub > span {
    max-width: calc(100% - $fontSize * 1.5);
  }
  .context_item.has_sub:after {
    font-size: $fontSize*0.75;
    float: right;
    margin-right: $fontSize*0.25;
    content: "\e61d";
    font-family: "sysIcon" !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .has_sub {}
  .context_item.has_sub:hover {
    .context_menu_sub {
      display: block;
    }
  }
  .context_menu_sub {
    display: none;
    position: absolute;
  }
  .context_menu.rb .context_menu_sub {
    left: 100%;
    top: 0;
  }
  .context_menu.rt .context_menu_sub {
    left: 100%;
    bottom: 0;
  }
  .context_menu.lb .context_menu_sub {
    right: 100%;
    top: 0;
  }
  .context_menu.lt .context_menu_sub {
    right: 100%;
    bottom: 0;
  }
}
</style>
