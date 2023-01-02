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
const orgZoomLevel = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

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
/* watch(props, async (to) => {
  if (to.curNode.id === imgLayout.value.loaded) return;
  // console.warn(to.curNode.id, fr.curNode.id);
  Object.assign(imgLayout.value, {
    loaded: false,
  });
  loadImageRes();
}); */
//
const eventStore = useEventStore();
let resizingEvtKey = eventStore.listen(
  `modal_resizing_${props.modalData.nid}`,
  (data) => fitImg()
);
let changeEvtKey = eventStore.listen(
  `modal_browser_change_${props.modalData.nid}`,
  (data) => loadImageRes()
);
onUnmounted(() => {
  eventStore.release(`modal_resizing_${props.modalData.nid}`, resizingEvtKey);
  eventStore.release(
    `modal_browser_change_${props.modalData.nid}`,
    changeEvtKey
  );
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

let dragData = {
  active: false,
  x: 0,
  y: 0,
  orgX: 0,
  orgY: 0,
};
function onDragging(e: MouseEvent) {
  const layout = imgLayout.value;
  const t = {
    active: true,
    x: e.clientX,
    y: e.clientY,
    orgX: layout.x,
    orgY: layout.y,
  };
  Object.assign(dragData, t);
  // console.info(e);
}
document.addEventListener("mousemove", function (e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  if (!dragData.active) return;
  const layout = imgLayout.value;
  const d = {
    x: e.clientX - dragData.x + dragData.orgX,
    y: e.clientY - dragData.y + dragData.orgY,
  };
  // Object.assign(dragData, d);
  Object.assign(imgLayout.value, d);
});
document.addEventListener("mouseup", function () {
  dragData.active = false;
});
document.addEventListener("wheel", function (e: WheelEvent) {
  const layout = imgLayout.value;
  const domLayout = contentDOM.value;
  const domW = domLayout?.clientWidth ?? 0;
  const domH = domLayout?.clientHeight ?? 0;
  const wRatio = domW / layout.orgW;
  const hRatio = domH / layout.orgH;
  const orgRatio = Math.min(wRatio, hRatio);
  //
  let zoomLevel = [];
  const curRatio = imgLayout.value.ratio;
  zoomLevel.push(...orgZoomLevel, imgLayout.value.ratio, orgRatio);
  const zoomLevelSet = new Set<number>(zoomLevel);
  zoomLevel = Array.from(zoomLevelSet);
  zoomLevel.sort();
  //
  let curRatioIndex = zoomLevel.indexOf(curRatio);
  // console.info(e);
  curRatioIndex += e.deltaY < 0 ? 1 : -1;
  if (curRatioIndex < 0) curRatioIndex = 0;
  if (curRatioIndex > zoomLevel.length - 1)
    curRatioIndex = zoomLevel.length - 1;
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
  const ratio = zoomLevel[curRatioIndex];
  // console.info(wRatio, hRatio, domLayout, imgLayout.value);
  target.w = layout.orgW * ratio;
  target.h = layout.orgH * ratio;
  // target.x = (domW - target.w) / 2;
  // target.y = (domH - target.h) / 2;
  target.ratio = ratio;
  target.ratioTxt = Math.round(ratio * 1000) / 10 + " %";
  Object.assign(imgLayout.value, target);
});
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
        @mousedown="onDragging"
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
