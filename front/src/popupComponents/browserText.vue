<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import type {Ref} from "vue";
import GenFunc from "@/GenFunc";
import * as kvStore from "@/IndexedKVStore";
import Config from "@/Config";
import type { nodePropsType } from "@/types/browser";

const props = defineProps<{
  extId: string,
  curIndex: number,
  isActive: boolean,
  //
  file: nodePropsType,
  dom:{
    w:number,
    h:number,
  }
}>();

const content: Ref<string> = ref('');
const contentDOM: Ref<HTMLElement | null> = ref(null);

async function getContent(path:string) {
  const res = await fetch(path, {
    method: 'GET',
    headers: {
      // "Content-Type": "text/plain; charset=UTF-8",
    },
  });
  const txt = await res.text();
  // console.info(res, content);
  content.value = txt;
  await reloadScroll();
}

async function scrollEvt(e: Event) {
  GenFunc.debounce(() => {
    if (!contentDOM.value) return;
    const offset = [
      contentDOM.value.scrollTop,
      contentDOM.value.scrollLeft,
    ];
    //更新路由的时候会产生一个offset为0的scroll事件，直接跳过0
    if (!offset[0] && !offset[1]) return;
    const key = `browser:${props.file.id}`;
    GenFunc.debounce(() => {
      kvStore.set('scroll_log', key, offset);
    }, Config.timeouts.scrollSave, 'debounce_scroll_save');
  }, Config.timeouts.scrollEvt, `debounce_scroll_view`);
}

async function reloadScroll() {
  if (!contentDOM.value) return;
  contentDOM.value.scrollTop = 0;
  contentDOM.value.scrollLeft = 0;
  const key = `browser:${props.file.id}`;
  const ifLogExs = await kvStore.get('scroll_log', key) as number[];
  if (!ifLogExs) return;
  contentDOM.value.scrollTop = ifLogExs[0];
  contentDOM.value.scrollLeft = ifLogExs[1];
}

onMounted(async () => {
  // console.info('onMounted');
  if (props.file && props.file.raw) {
    await getContent(props.file.raw);
  }
  if (contentDOM.value)
    contentDOM.value?.addEventListener("scroll", scrollEvt);
});

watch(() => props.file, async (to) => {
  // console.info('watch');
  if (to.raw) {
    await getContent(to.raw);
  }
});

onBeforeUnmount(() => {
  // console.info('onBeforeUnmount');
});


</script>
<template>
  <div class="modal_browser txt">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <slot name="info"></slot>
        <!-- <div class="btnContainer"></div> -->
      </div>
      <div class="r">
        <slot name="btnContainer"></slot>
      </div>
    </div>
    <slot name="navigator"></slot>
    <div class="content">
      <div class="textContent"
           ref="contentDOM"
      >{{ content }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.modal_browser.txt {
  .content .textContent {
    width: calc(100% - $fontSize * 4);
    margin: $fontSize auto;
    word-break: break-all;
    white-space: pre-wrap;
    //@include smallScroll();
    overflow: auto;
    height: calc(100% - $fontSize * 5);
    font-size: $fontSize;
  }
  /*.navigator {
  }
  .base {
  }
  .info {
  }*/
}
</style>
