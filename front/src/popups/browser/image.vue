<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, watch} from "vue";
import GenFunc from "@/lib/GenFunc";
// import {useEventStore} from "@/shares/event";
import {mayTyping} from "@/lib/Helper";
import * as kvStore from '@/lib/IndexedKVStore';
import * as LocalConfigure from "@/shares/LocalConfigure";
import type { nodePropsType } from "@/types/browser";
// import piexif from 'piexif-ts';


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
const emits = defineEmits(["nav"]);
const orgZoomLevel = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
let zoomLevelLs = [];

const contentDOM: Ref<HTMLElement | null> = ref(null);
const imgDOM: Ref<HTMLImageElement | null> = ref(null);
type imgLayoutType = {
  loaded: number;
  w: number;
  h: number;
  x: number;
  y: number;
  rotate: number;
  ratio: number;
  orgRatio: number;
  ratioTxt: string;
  orgW: number;
  orgH: number;
};
const imgLayout: Ref<imgLayoutType> = ref({
  loaded: 0,
  w: 0,
  h: 0,
  x: 0,
  y: 0,
  rotate: 0,
  orgRatio: 0,
  ratio: 0,
  ratioTxt: "0 %",
  orgW: 0,
  orgH: 0,
});
const imgSrc: Ref<string> = ref('');


async function onImageLoad(e: Event) {
  console.info('onImageLoad',e);
  const dom = imgDOM.value;
  if (!dom) return;
  if (!dom.complete) {
    // return setTimeout(onImageLoad.bind(null, curNodeId), 50);
    return setTimeout(onImageLoad, 50);
  }
  // console.warn(dom,dom.naturalHeight,dom.naturalWidth);
  // const arrayBuffer = await (await fetch(props.curNode.file.normal?.path)).arrayBuffer();
  // const exif = piexif.load(arrayBuffer);
  // console.info(exif);

  // console.info("onImageLoad",e);
  //以dom为基准矫正
  // if (dom.getAttribute("data-ref-node-id") !== `${curNodeId}`)
  //   return setTimeout(onImageLoad.bind(null, curNodeId), 50);

  const curR = await kvStore.get('image_rotate', props.file.id);
  Object.assign(imgLayout.value, {
    loaded: props.file.id,
    orgH: dom.naturalHeight,
    orgW: dom.naturalWidth,
    rotate: curR,
  });
  await resetImg();
}

onMounted(() => {
  // console.warn("mounted");
  imgSrc.value = props.file.normal;
  Object.assign(imgLayout.value, {
    loaded: 0,
    w: 0,
    h: 0,
    x: 0,
    y: 0,
    rotate: 0,
    orgW: 0,
    orgH: 0,
  });
  // onImageLoad(props.curNode.id ?? 0);
  // onImageLoad();
  // document.addEventListener("mouseup", onPointerUp);
  // document.addEventListener("mousemove", onPointerMove);
  // document.addEventListener(`modal_resizing_${props.extId}`, resetImg);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("wheel", onWheel);
  document.addEventListener("keydown", keymap);
  document.addEventListener("pointercancel", onPointerUp);
  document.addEventListener("pointerout", onPointerUp);
});
//
// const eventStore = useEventStore();


watch(
  () => props.file,
  async (to) => {
    console.info('onMod props.curNode',props.file.normal);
    //先预加载再更新到前台，不然中间会有一个闪屏
    imgLayout.value.loaded = 0;
    const newSrc = props.file.normal;
    const imgDOM = new Image();
    imgDOM.src = newSrc;
    imgDOM.onload = (e) => {
      // console.info(arguments);
      imgSrc.value = newSrc;
    }
    // setTimeout(() => {
    //   onImageLoad();
    // }, 0)
    // }, 0)
  });

onUnmounted(() => {
  // eventStore.release(`modal_resizing_${props.modalData.nid}`, resizingEvtKey);
  // eventStore.release(
  //   `modal_browser_change_${props.modalData.nid}`,
  //   changeEvtKey
  // );
  // document.removeEventListener("mouseup", onPointerUp);
  // document.removeEventListener("mousemove", onPointerMove);
  // document.removeEventListener(`modal_resizing_${props.extId}`, resetImg);
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("wheel", onWheel);
  document.removeEventListener("keydown", keymap);
  document.removeEventListener("pointercancel", onPointerUp);
  document.removeEventListener("pointerout", onPointerUp);
});

watch(() => props.dom, async (to) => {
  resetImg();
});

async function resetImg() {
  if (!imgLayout.value.loaded) return;
  console.info('resetImg');
  //dom的更新要比事件推送的迟，所以能用数值就用数值
  // const cDOM = contentDOM.value;
  // if (!cDOM) return;
  // const domW = cDOM.clientWidth ?? 0;
  // const domH = cDOM.clientHeight ?? 0;
  const modalLayout = props.dom;
  console.info(props.dom);
  const domW = modalLayout.w ?? 0;
  let domH = modalLayout.h ?? 0;
  //因为上面用的layout所以会导致一个偏差，没想到有什么好办法，直接减掉算了
  domH -= 16;
  const layout = imgLayout.value;
  //左右正负45度为横，垂直正负45度为旋转
  const r90 = Math.abs(layout.rotate % 180 - 90) < 45;
  // console.info('r90:', r90, layout);
  const wRatio = domW / (r90 ? layout.orgH : layout.orgW);
  const hRatio = domH / (r90 ? layout.orgW : layout.orgH);
  //
  const target = {
    w: 0,
    h: 0,
    x: 0,
    y: 0,
    ratio: 0,
    orgRatio: 0,
    ratioTxt: "0 %",
  };
  //
  const ratio = Math.min(wRatio, hRatio);
  // console.info(wRatio, hRatio, domLayout, imgLayout.value);
  target.w = layout.orgW * ratio;
  target.h = layout.orgH * ratio;
  target.x = (domW - target.w) / 2;
  target.y = (domH - target.h) / 2;
  // target.x = (domW - (r90 ? target.h : target.w)) / 2;
  // target.y = (domH - (r90 ? target.w : target.h)) / 2;
  target.ratio = ratio;
  target.orgRatio = ratio;
  target.ratioTxt = Math.round(ratio * 1000) / 10 + " %";
  Object.assign(imgLayout.value, target);
  // console.info(imgLayout.value);

}

type DragData = {
  x: number,
  y: number,
  // orgX: number,
  // orgY: number,
};

const pointerMap = new Map<number, DragData>();

function onPointerDown(e: PointerEvent) {
  if (!props.isActive) return;
  // console.info(e);
  if (!e.pointerId) return;
  e.preventDefault();
  e.stopPropagation();
  // pointerId = e.pointerId;
  const layout = imgLayout.value;
  const orgDragData = {
    // active: true,
    x: e.clientX,
    y: e.clientY,
    // orgX: e.clientX,
    // orgY: e.clientY,
  };
  // console.info(orgDragData);
  // Object.assign(dragData, t);
  // console.info(e);
  pointerMap.set(e.pointerId, orgDragData);
}

function onPointerMove(e: PointerEvent) {
  if (!props.isActive) return;
  // console.info(e);
  if (!e.pointerId) return;
  e.preventDefault();
  e.stopPropagation();
  doTransform(e);
}

function onPointerUp(e: PointerEvent) {
  const orgDragData = pointerMap.get(e.pointerId);
  if (!orgDragData) return;
  pointerMap.delete(e.pointerId);
}

//基于一个中点，进行拖拽缩放和旋转
function doTransform(e: PointerEvent) {
  const org = pointerMap.get(e.pointerId);
  if (!org) return;
  if (Math.abs(e.clientX - org.x) < 1 && Math.abs(e.clientY - org.y) < 1) return;
  const layout = imgLayout.value;
  const iDOM = imgDOM.value;
  const cDOM = contentDOM.value;
  if (!iDOM) return;
  if (!cDOM) return;
  //
  if (pointerMap.size == 1) {
    const d = {
      x: e.clientX - org.x + layout.x,
      y: e.clientY - org.y + layout.y,
    };
    // Object.assign(dragData, d);
    Object.assign(imgLayout.value, d);
    pointerMap.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      // orgX: org.orgX,
      // orgY: org.orgY,
    });
    return;
  }
  //计算map中除了当前pointer的所有pointer均值为中点A
  //当前pointer的移动坐标到中点A的中点为偏移量
  //当前pointer到中点的距离为1，变动距离视作缩放倍率const layout = imgLayout.value;
  const mid = {
    x: 0,
    y: 0,
    // xf: 0,
    // yf: 0,
    // orgX: 0,
    // orgY: 0,
    pointerCount: 0,
  };
  pointerMap.forEach((value, key, map) => {
    // mid.xf += value.x;
    // mid.yf += value.y;
    if (key == e.pointerId) return;
    // console.info(value);
    mid.x += value.x;
    mid.y += value.y;
    // mid.orgX += value.orgX;
    // mid.orgY += value.orgY;
    mid.pointerCount += 1;
  });
  mid.x = mid.x / mid.pointerCount;
  mid.y = mid.y / mid.pointerCount;
  // mid.xf = mid.xf / (mid.pointerCount + 1);
  // mid.yf = mid.yf / (mid.pointerCount + 1);
  // console.info(mid);
  //
  const d = {
    orgX: org.x - mid.x,
    orgY: org.y - mid.y,
    tgtX: e.clientX - mid.x,
    tgtY: e.clientY - mid.y,
  };
  const target = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    // rotate: 0,
    ratio: layout.ratio * Math.sqrt(
      (d.tgtX * d.tgtX + d.tgtY * d.tgtY) /
      (d.orgX * d.orgX + d.orgY * d.orgY)
    ),
    ratioTxt: "0 %",
  };
  if (target.ratio > 5) target.ratio = 5;
  //
  target.w = layout.orgW * target.ratio;
  target.h = layout.orgH * target.ratio;
  //
  const domW = cDOM.clientWidth ?? 0;
  const domH = cDOM.clientHeight ?? 0;
  const {x: domX, y: domY} = GenFunc.nodeOffsetXY(cDOM);
  const imgW = iDOM.clientWidth ?? 0;
  const imgH = iDOM.clientHeight ?? 0;
  const {x: imgX, y: imgY} = GenFunc.nodeOffsetXY(iDOM);
  //
  const dcX = (e.clientX - org.x) / 2;
  const dcY = (e.clientY - org.y) / 2;
  // console.info(e.clientX, org.x, domX, domW);
  //
  const ddX = (mid.x - domX) - domW / 2;
  const ddY = (mid.y - domY) - domH / 2;
  //
  const diX = (mid.x - (imgX + imgW / 2)) / layout.ratio * target.ratio;
  const diY = (mid.y - (imgY + imgH / 2)) / layout.ratio * target.ratio;
  //
  target.x = (domW - target.w) / 2 + ddX - diX + dcX;
  target.y = (domH - target.h) / 2 + ddY - diY + dcY;
  //
  target.ratioTxt = Math.round(target.ratio * 10000) / 100 + " %";
  // console.info(target);
  //
  Object.assign(imgLayout.value, target);
  pointerMap.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY,
    // orgX: org.orgX,
    // orgY: org.orgY,
  });
}

const scrollLock: Ref<boolean> = ref(LocalConfigure.get("browser_image_scrollLock") ?? false);

function setScrollLock(target:boolean) {
  scrollLock.value = target;
  LocalConfigure.set("browser_image_scrollLock", target);
}

//不监听，不需要强制统一
// LocalConfigure.listen('browser_image_scrollLock', (to) => {
//   scrollLock.value = to;
// }, props.modalData.nid);

function onWheel(e: WheelEvent) {
  //确定在当前dom里才触发
  // console.info('onWheel');
  let eDOM = e?.target as HTMLElement;
  let curNid;
  do {
    curNid = eDOM.getAttribute("data-ref-id");
    if (curNid) break;
    if (!eDOM.parentElement) break;
    eDOM = eDOM.parentElement as HTMLElement;
    if (eDOM.tagName === "BODY") break;
  } while (true);
  if (curNid !== props.extId) return;
  const dir = e.deltaY < 0 ? 1 : -1;
  //
  // const cDOM = contentDOM.value;
  // const domW = cDOM.clientWidth ?? 0;
  // const domH = cDOM.clientHeight ?? 0;
  // const {x: domX, y: domY} = GenFunc.nodeOffsetXY(cDOM);
  //
  // console.info(domH, domW, domX, domY);
  // console.info(dx, dy);
  // return;
  if (scrollLock.value) {
    emits("nav", props.curIndex - dir);
  } else {
    setZoom(dir, e.clientX, e.clientY);
  }
}

//传入的是距离dom中点的偏移量
function setZoom(dir: 1 | -1, clientX?: number, clientY?: number) {
  // console.info('setZoom', dir, clientX, clientY);
  //
  const layout = imgLayout.value;
  const iDOM = imgDOM.value;
  const cDOM = contentDOM.value;
  if (!iDOM) return;
  if (!cDOM) return;
  //缩放比例
  let zoomLevel = [];
  const curRatio = layout.ratio;
  zoomLevel.push(...orgZoomLevel, layout.ratio, layout.orgRatio);
  const zoomLevelSet = new Set<number>(zoomLevel);
  zoomLevel = Array.from(zoomLevelSet);
  zoomLevel.sort();
  const targetZoomIndex = zoomLevel.indexOf(layout.ratio) + dir;
  if (targetZoomIndex < 0) return;
  if (targetZoomIndex >= zoomLevel.length) return;
  const targetZoomLevel = zoomLevel[targetZoomIndex];
  //
  const domW = cDOM.clientWidth ?? 0;
  const domH = cDOM.clientHeight ?? 0;
  const {x: domX, y: domY} = GenFunc.nodeOffsetXY(cDOM);
  //
  const r90 = Math.abs(layout.rotate % 180 - 90) < 45;
  const target = {
    w: layout.orgW * targetZoomLevel,
    h: layout.orgH * targetZoomLevel,
    x: 0,
    y: 0,
    ratio: targetZoomLevel,
    ratioTxt: Math.round(targetZoomLevel * 10000) / 100 + " %",
  };
  //
  if (clientX === undefined || clientY === undefined) {
    target.x = (domW - target.w) / 2;
    target.y = (domH - target.h) / 2;
    Object.assign(imgLayout.value, target);
    return;
  }
  //
  const imgW = iDOM.clientWidth ?? 0;
  const imgH = iDOM.clientHeight ?? 0;
  const {x: imgX, y: imgY} = GenFunc.nodeOffsetXY(iDOM);
  //加上鼠标在当前窗口上的偏移量，可得到图片中点跟随鼠标的效果
  //图片中点距离鼠标的偏移量
  //    转换一下倍率
  //    得到图片缩放点跟随鼠标的效果
  const ddX = (clientX - domX) - domW / 2;
  const ddY = (clientY - domY) - domH / 2;
  //
  // const diY = 0;
  const diX = (clientX - (imgX + imgW / 2)) / curRatio * target.ratio;
  const diY = (clientY - (imgY + imgH / 2)) / curRatio * target.ratio;
  //
  target.x = (domW - target.w) / 2 + ddX - diX;
  target.y = (domH - target.h) / 2 + ddY - diY;
  //
  Object.assign(imgLayout.value, target);
}

function keymap(e: KeyboardEvent) {
  if (mayTyping(e.target as HTMLElement)) return;
  if (!props.isActive) return;
  // console.info(e);
  switch (e.code) {
    case "KeyQ":
      setRotate(-90);
      break;
    case "KeyE":
      setRotate(90);
      break;
  }
}

function setRotate(deg:number) {
  let layout = {
    rotate: imgLayout.value.rotate,
    // orgH: imgLayout.value.orgH,
    // orgW: imgLayout.value.orgW,
  };
  let curR = layout.rotate + deg;
  while (curR < 0) curR += 360;
  while (curR > 360) curR -= 360;
  layout.rotate = curR;
  // if (deg % 180 !== 0) {
  //   let t = layout.orgH;
  //   layout.orgH = layout.orgW;
  //   layout.orgW = t;
  // }
  kvStore.set('image_rotate', props.file.id, curR);
  Object.assign(imgLayout.value, layout);
  // console.info(layout);
  resetImg();
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
            :class="['sysIcon', 'sysIcon_scroll',scrollLock?'active':'']"
            @click="setScrollLock(!scrollLock)"
          ></button>
          <button
            :class="['sysIcon', 'sysIcon_zoomout']"
            @click="setZoom( -1)"
          ></button>
          <!-- <button :class="['sysIcon', 'sysIcon_fangdajing1']" @click="resetImg"> -->
          <button @click="resetImg">
            {{ imgLayout.ratioTxt }}
          </button>
          <button
            :class="['sysIcon', 'sysIcon_zoomin']"
            @click="setZoom( 1)"
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
        :data-ref-node-id="props.file.id"
        :src="imgSrc"
        :data-rotate="imgLayout.rotate"
        @pointerdown="onPointerDown"
        @dblclick="resetImg"
        @load="onImageLoad"
        :class="{loading:!imgLayout.loaded}"
        :style="{
                width: imgLayout.w + 'px',
                height: imgLayout.h + 'px',
                left: imgLayout.x + 'px',
                top: imgLayout.y + 'px',
                rotate: imgLayout.rotate + 'deg',
              }"
        ref="imgDOM"
      />
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.modal_browser.image {
  .content {
    img {
      touch-action: none;
      position: absolute;
      width: 100%;
      left: 0;
      top: 0;
      //transition: opacity 0.1s;
    }
    .loading {
      //opacity: 0;
      //transition: opacity 0s;
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
