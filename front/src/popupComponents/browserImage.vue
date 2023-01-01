<script setup lang="ts">
import { onMounted, onUnmounted, ref, type Ref, watch } from "vue";
import type { ModalConstruct, ModalStruct } from "../modal";
import { queryDemo, query } from "@/Helper";
import type { api_node_col, api_file_list_resp } from "../../../share/Api";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import { useEventStore } from "@/stores/event";
const props = defineProps<{
  data: { [key: string]: any };
  modalData: ModalStruct;
  nodeList: api_node_col;
  curIndex: api_node_col;
  curNode: api_node_col;
}>();

const contentDOM: Ref<HTMLElement | null> = ref(null);
const imgDOM: Ref<HTMLImageElement | null> = ref(null);

const imgLayout = ref({
  loaded: 0,
  w: 0,
  h: 0,
  x: 0,
  y: 0,
  ratio: 0,
  ratioTxt: "0 %",
  orgW: 0,
  orgH: 0,
});
function loadImageRes() {
  setTimeout(() => {
    let dom = imgDOM.value;
    if (!dom) return loadImageRes();
    if (!dom.complete) return loadImageRes();
    Object.assign(imgLayout.value, {
      loaded: props.curNode.id,
      orgH: dom.naturalHeight,
      orgW: dom.naturalWidth,
    });
    fitImg();
  }, 50);
}
onMounted(() => {
  console.warn("mounted");
  Object.assign(imgLayout.value, {
    loaded: false,
    w: 0,
    h: 0,
    x: 0,
    y: 0,
    orgW: 0,
    orgH: 0,
  });
  loadImageRes();
});
watch(props, async (to) => {
  if (to.curNode.id === imgLayout.value.loaded) return;
  // console.warn(to.curNode.id, fr.curNode.id);
  Object.assign(imgLayout.value, {
    loaded: false,
    /* w: 0,
    h: 0,
    x: 0,
    y: 0,
    orgW: 0,
    orgH: 0, */
  });
  loadImageRes();
});
//
const eventStore = useEventStore();
let evtKey = eventStore.listen(
  `modal_resizing_${props.modalData.nid}`,
  (data) => {
    console.info(data);
    fitImg();
  }
);
onUnmounted(() => {
  eventStore.release(`modal_resizing_${props.modalData.nid}`, evtKey);
});
async function fitImg() {
  const domLayout = contentDOM.value;
  const domW = domLayout?.clientWidth ?? 0;
  const domH = domLayout?.clientHeight ?? 0;
  const layout = imgLayout.value;
  const wRatio = domW / layout.orgW;
  const hRatio = domH / layout.orgH;
  //
  const target = {
    w: 0,
    h: 0,
    x: 0,
    y: 0,
    ratio: 0,
    ratioTxt: "0 %",
  };
  //
  const ratio = Math.min(wRatio, hRatio);
  // console.info(wRatio, hRatio, domLayout, imgLayout.value);
  target.w = layout.orgW * ratio;
  target.h = layout.orgH * ratio;
  target.x = (domW - target.w) / 2;
  target.y = (domH - target.h) / 2;
  target.ratio = ratio;
  target.ratioTxt = Math.round(ratio * 1000) / 10 + " %";
  Object.assign(imgLayout.value, target);
  // console.info(imgLayout.value);
}

let resizing = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  imgX: 0,
  imgY: 0,
  imgW: 0,
  imgH: 0,
};
function onResizing(e: MouseEvent) {
  resizing.x = e.clientX;
  resizing.y = e.clientY;
  console.info(e);
}
document.addEventListener("wheel", function (e: WheelEvent) {
  console.info(e);
});
document.addEventListener("mouseup", function () {});
document.addEventListener("mousemove", function () {});
</script>

<template>
  <div class="modal_browser base">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <slot name="info"></slot>
        <div class="btn">
          <button :class="['sysIcon', 'sysIcon_zoomout']"></button>
          <!-- <button :class="['sysIcon', 'sysIcon_fangdajing1']" @click="fitImg"> -->
          <button @click="fitImg">
            {{ imgLayout.ratioTxt }}
          </button>
          <button :class="['sysIcon', 'sysIcon_zoomin']"></button>
        </div>
      </div>
      <div class="r">
        <slot name="btn"></slot>
      </div>
    </div>
    <slot name="navigator"></slot>
    <div class="content" ref="contentDOM">
      <!-- {{ props.curNode.title }} -->
      <img
        :src="props.curNode.file?.normal?.path"
        @mousedown="onResizing"
        :style="
          imgLayout.loaded
            ? {
                width: imgLayout.w + 'px',
                height: imgLayout.h + 'px',
                left: imgLayout.x + 'px',
                top: imgLayout.y + 'px',
              }
            : {}
        "
        ref="imgDOM"
      />
    </div>
  </div>
</template>

<style lang="scss">
.modal_browser.base {
  .content {
    img {
      position: absolute;
      width: 100%;
      left: 0;
      top: 0;
    }
  }
  .btn {
    button {
      vertical-align: bottom;
      font-size: $fontSize;
      line-height: $fontSize;
    }
  }
  .navigator {
  }
  .base {
  }
  .info {
  }
}
</style>
