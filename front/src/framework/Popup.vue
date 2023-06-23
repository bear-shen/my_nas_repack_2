<script setup lang="ts">
import {useModalStore} from "@/stores/modalStore";
import {useEventStore} from "@/stores/event";
import {
  defineAsyncComponent,
  defineComponent,
  ref,
  shallowRef,
  createApp, onMounted, onUnmounted,
} from "vue";
import type {
  ModalFormConstruct,
  ModalCallbackConstruct,
  ModalComponentConstruct,
  ModalLayout,
  ModalContent,
  ModalBase,
  ModalConstruct,
  ModalStruct,
} from "@/modal";
import {isArray} from "@vue/shared";
import App from "@/App.vue";
import HelloWorldVue from "@/components/HelloWorld.vue";
import Browser from "@/popupComponents/browser.vue";
import Locator from "@/popupComponents/locator.vue";
import {query} from "@/Helper";
import type {
  api_file_list_req, api_node_col,
  api_user_login_req,
  api_user_login_resp,
} from "../../../share/Api";
import Uploader from "@/popupComponents/uploader.vue";

const componentDefs = {
  helloWorld: HelloWorldVue,
  fileBrowser: Browser,
  uploader: Uploader,
  locator: Locator,
} as { [key: string]: any };
//
const initTimestamp = new Date().valueOf();
//用map方便操作
const modalList = ref(new Map<string, ModalStruct>());
const gap = 20;

function buildModal(modal: ModalConstruct): ModalStruct {
  const diffStamp = Math.floor((new Date().valueOf() - initTimestamp) / 100);
  const iw = window.innerWidth;
  const ih = window.innerHeight;
  // console.info(diffStamp);
  const target = {
    nid: "",
    base: {
      title: modal.title ?? "",
      alpha: modal.alpha ?? false,
      key: modal.key ?? "",
      single: modal.single ?? false,
    },
    layout: {
      w: 0,
      h: 0,
      x: 0,
      y: 0,
      minW: 0,
      minH: 0,
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
    callback: [],
    closed: false,
  } as ModalStruct;
  target.nid = (diffStamp + Math.random()).toString(32);
  console.info(diffStamp, target.nid);
  //layout
  const layout = {} as ModalLayout;
  layout.w = modal.w ?? 400;
  layout.h = modal.h ?? 160;
  layout.x = (iw - layout.w) / 2;
  layout.y = (ih - layout.h) / 2;
  layout.minW = modal.minW ?? 400;
  layout.minH = modal.minH ?? 160;
  layout.resizable = modal.resizable ?? true;
  layout.movable = modal.movable ?? true;
  layout.active = true;
  layout.index = diffStamp;
  layout.fullscreen = modal.fullscreen ?? false;
  Object.assign(target.layout, layout);
  // content
  if (modal.text) {
    target.content.text = modal.text;
  }
  if (modal.form) {
    if (Array.isArray(modal.form)) {
      target.content.form.push(...modal.form);
    } else {
      target.content.form.push(modal.form);
    }
    target.content.form.forEach((form) => {
      // form.type = form.type;
      // form.label = form.label;
      // form.key = form.key;
      form.value = form.value ?? null;
      form.options = form.options ?? null;
      form.default = form.default ?? null;
      form.multiple = !!form.multiple;
      form.disabled = !!form.disabled;
      if (form.options) {
        if (Array.isArray(form.options)) {
          let options = {} as { [key: string]: any };
          form.options.forEach((option: string) => {
            options[option] = option;
          });
          form.options = options;
        }
      }
    });
  }
  if (modal.component) {
    if (Array.isArray(modal.component)) {
      modal.component.forEach((component) => {
        let targetComponent;
        if (typeof component === "string") {
          targetComponent = {
            key: "",
            componentName: component,
            data: {},
          };
        } else {
          targetComponent = Object.assign(
            {
              key: "",
              componentName: null,
              data: {},
            },
            component
          );
        }
        target.content.component.push(targetComponent);
      });
    } else {
      if (typeof modal.component === "string") {
        target.content.component.push({
          key: "",
          componentName: modal.component,
          data: {},
        });
      } else {
        target.content.component.push(
          Object.assign(
            {
              key: "",
              componentName: null,
              data: {},
            },
            modal.component
          )
        );
      }
    }
  }
  // callback
  if (modal.callback) {
    if (Array.isArray(modal.callback)) {
      modal.callback.forEach((caller, index) => {
        let targetCaller;
        if (typeof caller === "function") {
          targetCaller = {
            key: "",
            name: "",
            func: caller,
          };
        } else {
          targetCaller = Object.assign(
            {
              key: "",
              name: "",
              func: null,
            },
            caller
          );
        }
        target.callback.push(targetCaller);
      });
    } else if (typeof modal.callback === "function") {
      target.callback.push({
        key: "",
        name: "",
        func: modal.callback,
      });
    } else if (!!modal.callback.func) {
      target.callback.push(
        Object.assign(
          {
            key: "",
            name: "",
            func: null,
          },
          modal.callback as ModalCallbackConstruct
        )
      );
    } else {
      for (const key in modal.callback) {
        if (!Object.prototype.hasOwnProperty.call(modal.callback, key))
          continue;
        const func = (modal.callback as { [key: string]: any })[key];
        target.callback.push(
          Object.assign({
            key: key,
            name: key,
            func: func,
          })
        );
      }
    }
    target.callback.forEach((fn, index) => {
      if (fn.name && !fn.key) {
        fn.key = fn.name;
      } else if (!fn.name && fn.key) {
        fn.name = fn.key;
      } else if (!fn.name && !fn.key) {
        let name = "button";
        if (target.callback.length > 1) {
          name += " " + index;
        }
        fn.name = name;
        fn.key = name;
      }
    });
  } else {
    /* console.info(target.content.text);
    if (target.content.text)
      target.callback.push({
        func: async function (modal) {},
        key: "close",
        name: "close",
      }); */
  }
  //
  console.debug(target);
  return target;
}

window.addEventListener("resize", (e) => {
  // console.info(e);
  modalList.value.forEach((modal) => {
    // console.info(modal.layout);
    if (modal.layout.fullscreen) {
      const t = {
        x: gap,
        y: gap,
        w: window.innerWidth - gap * 2,
        h: window.innerHeight - gap * 2,
      };
      //
      Object.assign(modal.layout, t);
      eventStore.trigger(`modal_resizing_${modal.nid}`, modal.layout);
    }
  });
});
const modalStore = useModalStore();
modalStore.handleEvent("set", (modal: ModalConstruct) => {
  const curModal = buildModal(modal);
  modalList.value.set(curModal.nid, curModal);
  toggleActive(curModal.nid);
  checkAlpha();
});
modalStore.handleEvent("close", (nid: string) => {
  close(nid);
});

function toggleActive(nid: string) {
  const diffStamp = Math.floor((new Date().valueOf() - initTimestamp) / 100);
  modalList.value.forEach((node) => {
    if (node.nid === nid) {
      node.layout.index = diffStamp;
      node.layout.active = true;
      setTimeout(() => {
        const ifInput: null | HTMLInputElement = document.querySelector(`.modal_dom[data-ref-id="${node.nid}"] input`);
        if (ifInput) {
          ifInput.focus();
        }
      }, 100);
    } else {
      node.layout.active = false;
    }
  });
}

function fullscreen(nid: string) {
  const modal = modalList.value.get(nid);
  if (!modal) return;
  const t = {
    x: gap,
    y: gap,
    w: window.innerWidth - gap * 2,
    h: window.innerHeight - gap * 2,
    fullscreen: true,
  };
  //
  Object.assign(modal.layout, t);
  // setTimeout(() =>
  eventStore.trigger(`modal_resizing_${modal.nid}`, modal.layout);
  // );
}


function resetWindow(nid: string) {
  // let w = localConfigure.get("browser_layout_w");
  // let h = localConfigure.get("browser_layout_h");
  // console.info('from fs', w, h);
  const modal = modalList.value.get(nid);
  if (!modal) return;
  const t = {
    x: 0,
    y: 0,
    w: modal.layout.minW,
    h: modal.layout.minH,
    fullscreen: false,
  };
  t.x = (window.innerWidth - t.w) / 2;
  t.y = (window.innerHeight - t.h) / 2;
  //
  Object.assign(modal.layout, t);
  // setTimeout(() =>
  eventStore.trigger(`modal_resizing_${modal.nid}`, modal.layout);
  // );
}

function close(nid: string) {
  modalList.value.delete(nid);
  checkAlpha();
}

const eventStore = useEventStore();
let resizing = {
  x: 0,
  y: 0,
  d: "",
  modalX: 0,
  modalY: 0,
  modalW: 0,
  modalH: 0,
  modal: null as ModalStruct | null,
};

function onResizeStart(modalNid: string, e: MouseEvent) {
  // console.info('onResizeStart', modalNid, e);
  e.preventDefault();
  e.stopPropagation();
  // console.info("onResizeStart", e);
  resizing.x = e.clientX;
  resizing.y = e.clientY;
  resizing.d = (e.target as HTMLElement).className;
  modalList.value.forEach((modal) => {
    if (modal.nid !== modalNid) return;
    resizing.modal = modal;
  });
  // console.info(!resizing.modal, resizing.modal?.layout.fullscreen);
  if (!resizing.modal) return;
  if (resizing.modal.layout.fullscreen) return;
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
  // console.info(e.type);
  const d = {x: e.clientX - resizing.x, y: e.clientY - resizing.y};
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
    case "modal_title":
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
  if (t.w < 100) t.w = 100;
  if (t.h < 80) t.h = 80;
  //
  if (t.y < 0) t.y = 0;
  if (t.y > b.b - t.h / 2) t.y = b.b - t.h / 2;
  if (t.x < 0 - t.w / 2) t.x = 0 - t.w / 2;
  if (t.x > b.r - t.w / 2) t.x = b.r - t.w / 2;
  if (resizing.modal.layout.minW) {
    if (t.w < resizing.modal.layout.minW) t.w = resizing.modal.layout.minW;
  }
  if (resizing.modal.layout.minH) {
    if (t.h < resizing.modal.layout.minH) t.h = resizing.modal.layout.minH;
  }
  //
  Object.assign(resizing.modal.layout, t);
  eventStore.trigger(
    `modal_resizing_${resizing.modal.nid}`,
    resizing.modal.layout
  );
}

function onResizeEnd(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  // console.info(e.type);
  document.removeEventListener("mouseup", onResizeEnd);
  document.removeEventListener("mousemove", onResizing);
}

function onCallback(nid: string, key: string) {
  const modal = modalList.value.get(nid);
  if (!modal) return;
  modal.callback.forEach(async (c) => {
    if (c.key !== key) return;
    const ifKeep = await c.func(modal);
    // console.info(ifKeep);
    if (ifKeep) return;
    close(nid);
  });
}

const usingAlpha = ref(false);

function checkAlpha() {
  let hasAlpha = false;
  modalList.value.forEach((modal) => {
    if (modal.base.alpha) {
      hasAlpha = true;
    }
  });
  usingAlpha.value = hasAlpha;
}

//-----------

onMounted(() => {
  console.info("Popup mounted");
  document.addEventListener("keydown", keymap);
});
onUnmounted(() => {
  console.info("unmounted");
  document.removeEventListener("keydown", keymap);
});

function keymap(e: KeyboardEvent) {
  // console.info(e);
  if ((e.target as HTMLElement).tagName !== "BODY") return;
  switch (e.key) {
    case 'Escape':
      modalList.value.forEach((value, key) => {
        if (value.layout.active) {
          close(value.nid);
        }
      });
      break;
  }
}


/* modalStore.set({
  title: "test",
  alpha: false,
  key: "",
  single: false,
  w: 400,
  h: 400,
  minW: 400,
  minH: 400,
  // h: 160,
  resizable: true,
  movable: false,
  fullscreen: false,
  // text: "this is text",
  form: [
    {
      type: "text",
      label: "a",
      value: "123",
    },
    {
      type: "textarea",
      label: "b",
      value: "1919-08-10 11:45:14",
    },
    {
      type: "date",
      label: "c",
      value: "1919-08-10",
    },
    {
      type: "datetime",
      label: "d",
      value: "1919-08-10T11:45:14",
    },
    {
      type: "checkbox",
      label: "e",
      value: [],
      options: {
        a: "a",
        b: "b",
        c: "c",
      },
    },
    {
      type: "radio",
      label: "f",
      value: "123",
      options: ["a", "b", "c"],
    },
    {
      type: "select",
      label: "g",
      value: ["123"],
      multiple: true,
      options: {
        a: "a",
        b: "b",
        c: "c",
      },
    },
  ],
  component: [
    {
      componentName: "fileBrowser",
    },
  ],
  callback: {
    close: async function (modal) {
      console.info(modal);
    },
  },
}); */

</script>

<template>
  <div class="fr_popup">
    <div
      v-for="[modalIndex, modal] in modalList"
      :key="`_modal_${modalIndex}`"
      :class="{ modal_dom: true, active: modal.layout.active }"
      :data-ref-id="modal.nid"
      :style="{
        zIndex: modal.layout.index,
        width: modal.layout.w + 'px',
        height: modal.layout.h + 'px',
        left: modal.layout.x + 'px',
        top: modal.layout.y + 'px',
      }"
      @click="toggleActive(modal.nid)"
    >
      <div class="modal_header" @mousedown="onResizeStart(modal.nid, $event)">
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
      <div class="modal_content">
        <p
          class="modal_content_text"
          v-if="modal.content.text && modal.content.text.length"
        >
          {{ modal.content.text }}
        </p>
        <div
          class="modal_content_form"
          v-if="modal.content.form && modal.content.form.length"
        >
          <label
            v-for="(form, formIndex) in modal.content.form"
            :key="`_modal_${modalIndex}_form_${formIndex}`"
          >
            <span v-if="form.label">
              {{ form.label }}
            </span>
            <span>
              <template v-if="form.type === 'text'">
                <input type="text" v-model="form.value"/>
              </template>
              <template v-if="form.type === 'textarea'">
                <textarea v-model="form.value"></textarea>
              </template>
              <template v-if="form.type === 'date'">
                <input type="date" v-model="form.value"/>
              </template>
              <template v-if="form.type === 'datetime'">
                <input type="datetime-local" v-model="form.value"/>
              </template>
              <template v-if="form.type === 'checkbox'">
                <template
                  v-for="(option, optionKey) in form.options"
                  :key="`P_${modalIndex}_C_${formIndex}_CB`"
                >
                  <input
                    :id="`P_${modalIndex}_C_${formIndex}_CB_${optionKey}`"
                    :name="`P_${modalIndex}_C_${formIndex}_CB`"
                    :value="optionKey"
                    type="checkbox"
                    v-model="form.value"
                  />
                  <label
                    :for="`P_${modalIndex}_C_${formIndex}_CB_${optionKey}`"
                  >{{ option }}</label
                  >
                </template>
              </template>
              <template v-if="form.type === 'radio'">
                <template
                  v-for="(option, optionKey) in form.options"
                  :key="`P_${modalIndex}_C_${formIndex}_RD`"
                >
                  <input
                    :id="`P_${modalIndex}_C_${formIndex}_RD_${optionKey}`"
                    :name="`P_${modalIndex}_C_${formIndex}_RD`"
                    :value="optionKey"
                    type="radio"
                    v-model="form.value"
                  />
                  <label
                    :for="`P_${modalIndex}_C_${formIndex}_RD_${optionKey}`"
                  >{{ option }}</label
                  >
                </template>
              </template>
              <template v-if="form.type === 'select'">
                <select v-model="form.value" :multiple="form.multiple">
                  <option
                    v-for="(option, optionKey) in form.options"
                    :key="`P_${modalIndex}_C_${formIndex}_SL`"
                    :value="optionKey"
                  >
                    {{ option }}
                  </option>
                </select>
              </template>
            </span>
          </label>
        </div>
        <!-- <div
          class="modal_content_component"
          v-if="modal.content.component && modal.content.component.length"
        > -->
        <template v-for="component in modal.content.component">
          <component
            :is="componentDefs[component.componentName]"
            :data="component.data"
            :modalData="modal"
          ></component>
        </template>

        <div v-if="modal.callback && modal.callback.length" class="modal_content_callback">
          <button
            v-for="item in modal.callback"
            @click="onCallback(modal.nid, item.key)"
          >
            {{ item.name }}
          </button>
        </div>
        <!-- <HelloWorld msg="123" /> -->
        <!-- </div> -->
      </div>
      <div class="modal_border" @mousedown="onResizeStart(modal.nid, $event)">
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
  <div class="fr_alpha" v-if="usingAlpha"></div>
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
.modal_dom.active {
  background-color: map-get($colors, popup_active);
  .modal_header {
    background-color: map-get($colors, popup_title);
  }
}
.modal_dom {
  pointer-events: all;
  $controllerWidth: $fontSize * 0.5;
  font-size: $fontSize;
  background-color: map-get($colors, popup);
  position: absolute;
  padding: $fontSize * 0.25;
  @include blurBackground();
  .modal_header {
    height: $fontSize;
    line-height: $fontSize;
    font-size: $fontSize*0.75;
    .sysIcon {
      font-size: $fontSize*0.75;
      padding: 0 $fontSize*0.25;
    }
    white-space: nowrap;
    background-color: map-get($colors, popup_title);
    width: 100%;
    display: flex;
    justify-content: space-between;
    cursor: grab;
    .modal_menu span {
      cursor: pointer;
    }
    .modal_title {
      white-space: nowrap;
      max-width: 80%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
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
      //background-color: red;
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
  .modal_content {
    @include smallScroll();
    overflow: auto;
    height: calc(100% - $fontSize);
  }
  .modal_content_text,
  .modal_content_form,
  .modal_content_callback {
    padding-top: $fontSize*0.5;
  }
  .modal_content_text,
  .modal_content_form {
    padding-left: $fontSize * 0.5;
    padding-right: $fontSize * 0.5;
  }
  .modal_content_text {
    display: block;
    margin-bottom: $fontSize * 0.25;
  }
  .modal_content_form {
    display: table;
    width: calc(100% - $fontSize);
    > label {
      display: table-row;
      > span {
        display: table-cell;
      }
      > span:first-child {
        text-align: right;
        padding-right: $fontSize * 0.25;
        &::after {
          content: " :";
        }
      }
      > span:last-child {
        input,
        textarea {
          border-bottom: 1px solid map-get($colors, popup_title);
        }
      }
      input,
      select,
      textarea {
        width: calc(100% - $fontSize * 0.5);
        //width: fill-available;
        //width: -webkit-fill-available;
      }
      input[type="checkbox"],
      input[type="radio"] {
        + label::after {
          padding-left: $fontSize * 0.25;
        }
      }
    }
  }
  .modal_content_callback {
    display: flex;
    justify-content: space-around;
  }
  //  .modal_content_content{}
}
.fr_alpha {
  //pointer-events: none;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 50;
  background-image: url("../assets/bg.png");
  &:before {
    z-index: -1;
    filter: blur($fontSize * 0.05);
    backdrop-filter: blur($fontSize * 0.05);
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
}
</style>
