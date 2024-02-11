<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, watch} from "vue";
import type {ModalStruct} from "../modal";
import type {api_node_col} from "../../../share/Api";
import GenFunc from "@/GenFunc";
import {useEventStore} from "@/stores/event";

const props = defineProps<{
  data: {
    query: { [key: string]: any };
    curId: number;
    [key: string]: any;
  };
  modalData: ModalStruct;
  nodeList: api_node_col[];
  curIndex: number;
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

function onload(e: any) {
  console.info("onload", e);
}

function loadImageRes(): any {
  const dom = imgDOM.value;
  if (!dom) return;
  if (!dom.complete) {
    // return setTimeout(loadImageRes.bind(null, curNodeId), 50);
    return setTimeout(loadImageRes, 50);
  }
  // console.info("loadImageRes");
  //以dom为基准矫正
  // if (dom.getAttribute("data-ref-node-id") !== `${curNodeId}`)
  //   return setTimeout(loadImageRes.bind(null, curNodeId), 50);
  Object.assign(imgLayout.value, {
    loaded: props.curNode.id,
    orgH: dom.naturalHeight,
    orgW: dom.naturalWidth,
  });
  fitImg();
}

onMounted(() => {
  // console.warn("mounted");
  Object.assign(imgLayout.value, {
    loaded: 0,
    w: 0,
    h: 0,
    x: 0,
    y: 0,
    orgW: 0,
    orgH: 0,
  });
  // loadImageRes(props.curNode.id ?? 0);
  // loadImageRes();
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("pointerup", onMouseUp);
  document.addEventListener("pointermove", onMouseMove);
  document.addEventListener("wheel", setZoom);
});
//
const eventStore = useEventStore();
let resizingEvtKey = eventStore.listen(
  `modal_resizing_${props.modalData.nid}`,
  (data) => fitImg()
);
watch(() => props.curNode, async (to) => {
  console.info('onMod props.curNode');
  //非得这样切一下不然不刷新
  // showImg.value = false;
  // setTimeout(() => {
  //   showImg.value = true;
  imgDOM.value?.decode();
  imgLayout.value.loaded = 0;
  // setTimeout(() => {
  //   loadImageRes();
  // }, 0)
  // }, 0)
});

onUnmounted(() => {
  // eventStore.release(`modal_resizing_${props.modalData.nid}`, resizingEvtKey);
  // eventStore.release(
  //   `modal_browser_change_${props.modalData.nid}`,
  //   changeEvtKey
  // );
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("pointerup", onMouseUp);
  document.removeEventListener("pointermove", onMouseMove);
  document.removeEventListener("wheel", setZoom);
});

async function fitImg() {
  // console.info("fitImg");
  //dom的更新要比事件推送的迟，所以能用数值就用数值
  // const domLayout = contentDOM.value;
  // const domW = domLayout?.clientWidth ?? 0;
  // const domH = domLayout?.clientHeight ?? 0;
  // console.info(props.modalData);
  const modalLayout = props.modalData.layout;
  const domW = modalLayout.w ?? 0;
  let domH = modalLayout.h ?? 0;
  //因为上面用的layout所以会导致一个偏差，没想到有什么好办法，直接减掉算了
  domH -= 16;
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
  if (!props.modalData.layout.active) return;
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

function onMouseMove(e: MouseEvent) {
  e.preventDefault();
  // e.stopPropagation();
  if (!dragData.active) return;
  const layout = imgLayout.value;
  const d = {
    x: e.clientX - dragData.x + dragData.orgX,
    y: e.clientY - dragData.y + dragData.orgY,
  };
  // Object.assign(dragData, d);
  Object.assign(imgLayout.value, d);
}

function onMouseUp(e: MouseEvent) {
  dragData.active = false;
}

function setZoom(e?: WheelEvent, dir?: number) {
  // console.info();
  // if (!props.modalData.layout.active) return;
  let eDOM = e?.target as HTMLElement;
  let curNid;
  do {
    curNid = eDOM.getAttribute("data-ref-id");
    if (curNid) break;
    if (!eDOM.parentElement) break;
    eDOM = eDOM.parentElement as HTMLElement;
    if (eDOM.tagName === "BODY") break;
  } while (true);
  if (curNid !== props.modalData.nid) return;
  //
  const iLayout = imgLayout.value;
  const iDOM = imgDOM.value;
  const cDOM = contentDOM.value;
  // const cDOM = props.modalData.layout;
  if (!iDOM) return;
  if (!cDOM) return;
  const domW = cDOM?.clientWidth ?? 0;
  const domH = cDOM?.clientHeight ?? 0;
  // const domW = cDOM?.w?? 0;
  // const domH = cDOM?.h ?? 0;
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
  <div class="modal_browser image">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <slot name="info"></slot>
        <div class="btnContainer">
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
        <slot name="btnContainer"></slot>
      </div>
    </div>
    <slot name="navigator"></slot>
    <div class="content" ref="contentDOM">
      <!-- {{ props.curNode.title }} -->
      <span class="loader sysIcon sysIcon_sync" v-if="!imgLayout.loaded"></span>
      <img
        :data-ref-node-id="props.curNode.id"
        :src="`${props.curNode.file?.normal?.path}?filename=${props.curNode.title}`"
        @mousedown="onDragging"
        @pointerdown="onDragging"
        @dblclick="fitImg"
        @load="loadImageRes"
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
@import "../assets/variables";
@keyframes rotateAnimate {
  0% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.modal_browser.image {
  .content {
    img {
      touch-action: none;
      position: absolute;
      width: 100%;
      left: 0;
      top: 0;
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
