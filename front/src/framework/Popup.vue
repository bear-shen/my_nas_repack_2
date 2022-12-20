<script setup lang="ts">
import { useModalStore } from "../stores/modalStore";
import { ref } from "vue";
import type {
  ModalFormConstruct,
  ModalComponentConstruct,
  ModalLayout,
  ModalContent,
  ModalBase,
  ModalConstruct,
} from "../modal";
//
const initTimestamp = new Date().valueOf();
const modalList = ref([] as ModalConstruct[]);
function buildModal(modal: ModalConstruct): ModalConstruct {
  const diffStamp = Math.floor((new Date().valueOf() - initTimestamp) / 100);
  const iw = window.innerWidth;
  const ih = window.innerHeight;
  console.info(diffStamp);
  modal.nid = diffStamp;
  //
  const layout = modal.layout ?? {};
  layout.w = layout.w ?? 400;
  layout.h = layout.h ?? 160;
  layout.x = layout.x ?? (iw - layout.w) / 2;
  layout.y = layout.y ?? (ih - layout.h) / 2;
  layout.minW = layout.minW ?? 400;
  layout.minH = layout.minH ?? 160;
  layout.resizable = layout.resizable ?? true;
  layout.movable = layout.movable ?? true;
  layout.active = layout.active ?? true;
  layout.index = layout.index ?? diffStamp;
  layout.fullscreen = layout.fullscreen ?? false;
  // console.info(modal, modal.layout, layout);
  //
  return modal;
}
window.addEventListener("resize", (e) => {
  // console.info(e);
});
const modalStore = useModalStore();
modalStore.handleEvent("set", (modal: ModalConstruct) => {
  modalList.value.push(buildModal(modal));
});
modalStore.handleEvent("close", (id: number) => {
  for (let i = 0; i < modalList.value.length; i++) {
    if (modalList.value[i].nid !== id) continue;
    modalList.value.splice(i, 1);
  }
});
modalStore.set({
  nid: 0,
  base: {
    title: "test",
    alpha: false,
    key: "",
    single: false,
  },
  layout: {
    w: 400,
    h: 160,
    // x: 0,
    // y: 0,
    // minW: 0,
    // minH: 0,
    resizable: false,
    movable: false,
    active: false,
    index: 0,
    fullscreen: false,
  },
  content: {
    text: "",
    form: [],
    component: [],
  },
  callback: {},
  closed: false,
} as any as ModalConstruct);
function fullscreen(nid?: number) {}
function resetWindow(nid?: number) {}
function close(nid?: number) {}
let resizing = {
  x: 0,
  y: 0,
  d: "",
  modalX: 0,
  modalY: 0,
  modalW: 0,
  modalH: 0,
  modal: null as ModalConstruct | null,
};
function onResizeStart(modalNid: number, e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  console.info("onResizeStart", e);
  resizing.x = e.clientX;
  resizing.y = e.clientY;
  resizing.d = (e.target as HTMLElement).className;
  modalList.value.forEach((modal) => {
    if (modal.nid !== modalNid) return;
    resizing.modal = modal;
  });
  if (!resizing.modal) return;
  resizing.modalX = resizing.modal.layout.x;
  resizing.modalY = resizing.modal.layout.y;
  resizing.modalW = resizing.modal.layout.w;
  resizing.modalH = resizing.modal.layout.h;
  document.addEventListener("mouseup", onResizeEnd);
  document.addEventListener("mousemove", onResizing);
  // document.addEventListener("mouseenter", onResizeEnd);
  // document.addEventListener("mouseleave", onResizeEnd);
  // document.addEventListener("mouseout", onResizeEnd);
  // document.addEventListener("mouseover", onResizeEnd);
}
function onResizing(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  if (!resizing.modal) return;
  console.info(e.type);
  const d = { x: e.clientX - resizing.x, y: e.clientY - resizing.y };
  const t = {
    x: resizing.modal.layout.x,
    y: resizing.modal.layout.y,
    w: resizing.modal.layout.w,
    h: resizing.modal.layout.h,
  };
  switch (resizing.d) {
    case "c_l":
      // if (d.x < 0) {
      t.x = resizing.modalX + d.x;
      t.w = resizing.modalW - d.x;
      // }
      break;
    case "c_r":
      t.x = resizing.modalX;
      t.w = resizing.modalW + d.x;
      break;
    case "c_t":
      t.y = resizing.modalY + d.y;
      t.h = resizing.modalH - d.y;
      break;
    case "c_b":
      t.y = resizing.modalY;
      t.h = resizing.modalH + d.y;
      break;
    case "c_lt":
      t.x = resizing.modalX + d.x;
      t.w = resizing.modalW - d.x;
      t.y = resizing.modalY + d.y;
      t.h = resizing.modalH - d.y;
      break;
    case "c_lb":
      t.x = resizing.modalX + d.x;
      t.w = resizing.modalW - d.x;
      t.y = resizing.modalY;
      t.h = resizing.modalH + d.y;
      break;
    case "c_rt":
      t.x = resizing.modalX;
      t.w = resizing.modalW + d.x;
      t.y = resizing.modalY + d.y;
      t.h = resizing.modalH - d.y;
      break;
    case "c_rb":
      t.x = resizing.modalX;
      t.w = resizing.modalW + d.x;
      t.y = resizing.modalY;
      t.h = resizing.modalH + d.y;
      break;
    case "modal_header":
      t.x = resizing.modalX + d.x;
      t.y = resizing.modalY + d.y;
      break;
  }
  const b = {
    l: 0,
    r: window.innerWidth,
    t: 0,
    b: window.innerHeight,
  };
  // if (t.x < 0) t.x = 0;
  // if (t.y < 0) t.y = 0;
  if (t.w < 100) t.w = 100;
  if (t.h < 80) t.h = 80;
  //
  if (t.y < 0) t.y = 0;
  if (t.y > b.b - t.h / 2) t.y = b.b - t.h / 2;
  if (t.x < 0 - t.w / 2) t.x = 0 - t.w / 2;
  if (t.x > b.r - t.w / 2) t.x = b.r - t.w / 2;
  Object.assign(resizing.modal.layout, t);
}
function onResizeEnd(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  console.info(e.type);
  document.removeEventListener("mouseup", onResizeEnd);
  document.removeEventListener("mousemove", onResizing);
}
</script>

<template>
  <div class="fr_popup">
    <div
      v-for="modal in modalList"
      class="modal_dom"
      :style="{
        width: modal.layout.w + 'px',
        height: modal.layout.h + 'px',
        left: modal.layout.x + 'px',
        top: modal.layout.y + 'px',
      }"
    >
      <div
        class="modal_header"
        @mousedown="onResizeStart(modal.nid ?? 0, $event)"
      >
        <div class="modal_title">
          {{ modal.base.title }}
        </div>
        <div class="modal_menu">
          <template v-if="modal.layout.resizable">
            <span
              class="sysIcon sysIcon_maximize"
              v-if="!modal.layout.fullscreen"
              @click="fullscreen(modal.nid)"
            ></span>
            <span
              class="sysIcon sysIcon_windowize"
              v-else
              @click="resetWindow(modal.nid)"
            ></span>
          </template>
          <span class="sysIcon sysIcon_close" @click="close(modal.nid)"></span>
        </div>
      </div>
      <div class="modal_content"></div>
      <div
        class="modal_border"
        @mousedown="onResizeStart(modal.nid ?? 0, $event)"
      >
        <div class="c_l"></div>
        <div class="c_r"></div>
        <div class="c_t"></div>
        <div class="c_b"></div>
        <div class="c_lt"></div>
        <div class="c_lb"></div>
        <div class="c_rt"></div>
        <div class="c_rb"></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fr_popup {
  pointer-events: none;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 100;
}
.modal_dom {
  pointer-events: all;
  $controllerWidth: $fontSize * 0.5;
  font-size: $fontSize;
  background-color: aqua;
  position: absolute;
  .modal_header {
    height: $fontSize;
    line-height: $fontSize;
    font-size: $fontSize;
    white-space: nowrap;
    background-color: green;
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  .modal_border {
    pointer-events: none;
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    > div {
      pointer-events: all;
      background-color: red;
      position: absolute;
    }
    .c_l,
    .c_r {
      cursor: w-resize;
    }
    .c_t,
    .c_b {
      cursor: n-resize;
    }
    .c_lt {
      cursor: nw-resize;
    }
    .c_rt {
      cursor: ne-resize;
    }
    .c_lb {
      cursor: sw-resize;
    }
    .c_rb {
      cursor: se-resize;
    }
    .c_l,
    .c_lb,
    .c_lt {
      left: $controllerWidth * -1;
    }
    .c_t,
    .c_b {
      left: 0;
    }
    .c_r,
    .c_rb,
    .c_rt {
      right: $controllerWidth * -1;
    }
    .c_t,
    .c_lt,
    .c_rt {
      top: $controllerWidth * -1;
    }
    .c_l,
    .c_r {
      top: 0;
    }
    .c_b,
    .c_lb,
    .c_rb {
      bottom: $controllerWidth * -1;
    }
    .c_lt,
    .c_rt,
    .c_lb,
    .c_rb {
      width: $controllerWidth;
      height: $controllerWidth;
    }
    .c_l,
    .c_r {
      width: $controllerWidth;
      height: 100%;
    }
    .c_t,
    .c_b {
      width: 100%;
      height: $controllerWidth;
    }
  }
}
</style>
