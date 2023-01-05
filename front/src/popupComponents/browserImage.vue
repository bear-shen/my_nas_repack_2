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
  const dom = imgDOM.value;
  if (!dom || !dom.complete) return setTimeout(loadImageRes, 50);
  Object.assign(imgLayout.value, {
    loaded: props.curNode.id,
    orgH: dom.naturalHeight,
    orgW: dom.naturalWidth,
  });
  fitImg();
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
document.addEventListener("wheel", setZoom);
function setZoom(e?: WheelEvent, dir?: number) {
  const iLayout = imgLayout.value;
  const iDOM = imgDOM.value;
  const cDOM = contentDOM.value;
  if (!iDOM) return;
  if (!cDOM) return;
  const domW = cDOM?.clientWidth ?? 0;
  const domH = cDOM?.clientHeight ?? 0;
  const wRatio = domW / iLayout.orgW;
  const hRatio = domH / iLayout.orgH;
  const orgRatio = Math.min(wRatio, hRatio);
  //
  let zoomLevel = [];
  const curRatio = iLayout.ratio;
  zoomLevel.push(...orgZoomLevel, iLayout.ratio, orgRatio);
  const zoomLevelSet = new Set<number>(zoomLevel);
  zoomLevel = Array.from(zoomLevelSet);
  zoomLevel.sort();
  //
  let curRatioIndex = zoomLevel.indexOf(curRatio);
  // console.info(e);
  if (e) curRatioIndex += e.deltaY < 0 ? 1 : -1;
  else curRatioIndex += dir ? 1 : -1;
  if (curRatioIndex < 0) curRatioIndex = 0;
  if (curRatioIndex > zoomLevel.length - 1)
    curRatioIndex = zoomLevel.length - 1;
  const ratio = zoomLevel[curRatioIndex];
  //
  const target = {
    w: 0,
    h: 0,
    x: 0,
    y: 0,
    ratio: 0,
    ratioTxt: "0 %",
  };
  // console.info(e);
  if (e) {
    const mX = e.clientX;
    const mY = e.clientY;
    //
    const dX = GenFunc.nodeOffsetX(cDOM);
    const cdX = mX - dX - domW / 2;
    const iX = GenFunc.nodeOffsetX(iDOM);
    const ciX = mX - iX - iLayout.w / 2;
    const oX = (ciX * ratio) / iLayout.ratio;
    //
    const dY = GenFunc.nodeOffsetY(cDOM);
    const cdY = mY - dY - domH / 2;
    const iY = GenFunc.nodeOffsetY(iDOM);
    const ciY = mY - iY - iLayout.h / 2;
    const oY = (ciY * ratio) / iLayout.ratio;
    //
    // console.info(wRatio, hRatio, domLayout, layout);
    target.w = iLayout.orgW * ratio;
    target.h = iLayout.orgH * ratio;
    // target.x = 0.5 * (domW - (iLayout.orgW * ratio) / iLayout.ratio) - oX;
    // target.x = (domW - target.w) / 2;
    // target.y = (domH - target.h) / 2;
    //居中, 鼠标位置的坐标移动到中点, 之后移动到鼠标位置
    target.x = (domW - target.w) / 2 - oX + cdX;
    target.y = (domH - target.h) / 2 - oY + cdY;
  } else {
    const orgX = iLayout.x - domW / 2;
    const cdX = (orgX * ratio) / iLayout.ratio;
    const orgY = iLayout.y - domH / 2;
    const cdY = (orgY * ratio) / iLayout.ratio;
    //获取之前的以中点为坐标的值, 乘个倍率, 加回去
    target.w = iLayout.orgW * ratio;
    target.h = iLayout.orgH * ratio;
    target.x = domW / 2 + cdX;
    target.y = domH / 2 + cdY;
  }
  target.ratio = ratio;
  target.ratioTxt = Math.round(ratio * 1000) / 10 + " %";
  Object.assign(imgLayout.value, target);
}
</script>

<template>
  <div class="modal_browser base">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <slot name="info"></slot>
        <div class="btn">
          <button
            :class="['sysIcon', 'sysIcon_zoomout']"
            @click="setZoom(undefined, 0)"
          ></button>
          <!-- <button :class="['sysIcon', 'sysIcon_fangdajing1']" @click="fitImg"> -->
          <button @click="fitImg">
            {{ imgLayout.ratioTxt }}
          </button>
          <button
            :class="['sysIcon', 'sysIcon_zoomin']"
            @click="setZoom(undefined, 1)"
          ></button>
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
