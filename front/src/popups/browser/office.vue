<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, watch} from "vue";
import * as UserSession from "@/shares/UserSession";
import sign from "jwt-encode";
// import {useEventStore} from "@/shares/event";
import Config from "@/Config";
import type {nodePropsType} from "@/types/browser";


const props = defineProps<{
  extId: string,
  curIndex: number,
  isActive: boolean,
  //
  file: nodePropsType,
  dom: {
    w: number,
    h: number,
  }
}>();
let filePath = null;
const viewerId = 'pdvViewer_' + props.extId;
const contentDOM: Ref<HTMLIFrameElement | null> = ref(null);
let docEditor = null;
const user = UserSession.get();
const stInterval = 100;

onMounted(() => {
  console.warn("mounted");
  const url = new URL(location.href);
  loadScript(`${url.origin}/onlyoffice_server/web-apps/apps/api/documents/api.js`);
  // waitForAPI().then(() => {
  setTimeout(() => startOnlyOffice(), stInterval);
  // })
});

/*function waitForAPI() {
  let timer = null;
  return new Promise(resolve => {
    timer = setInterval(() => {
      if (!DocsAPI) return;
      console.info(DocsAPI);
      clearTimeout(timer);
      resolve();
    }, stInterval);
  })
}*/


function startOnlyOffice() {
  if (!scriptReady) return setTimeout(() => startOnlyOffice(), stInterval);
  const domId = 'modal_office_' + props.extId;
  const ifDomExs = document.getElementById(domId);
  if (!ifDomExs) return setTimeout(() => startOnlyOffice(), stInterval);
  //
  const secret = Config.onlyOffice.jwtSecret;
  // const origin = Config.onlyOffice.origin;
  const curNode = props.file;
  const suffixInd = curNode.title.lastIndexOf('.');
  const suffix = curNode.title.substring(suffixInd + 1);
  const documentType = getDocumentTypeBySuffix(suffix);
  if (!documentType) return;
  const url = new URL(location.href);
  const payload = {
    document: {
      fileType: suffix,
      //https://api.onlyoffice.com/docs/docs-api/usage-api/config/document/#referencedata
      key: curNode.id.toString(16) + '_' + Math.floor(new Date().valueOf()).toString(),
      title: curNode.title,
      url: `${url.origin}${curNode.raw}?tosho_token=${user?.token}`,
    },
    documentType: documentType,
    editorConfig: {
      callbackUrl: `${url.origin}/api/onlyoffice/callback?id=${curNode.id}&tosho_token=${user?.token}`,
    },
    token: '',
  };
  payload.token = sign(payload, secret);
  console.info(payload);
  // docEditor = (new DocsAPI).DocEditor(domId, payload);
  //@ts-ignore
  docEditor = DocsAPI.DocEditor(domId, payload);
}

watch(
  () => props.file,
  async (to) => {
    console.info('onMod props.curNode');
  });
onUnmounted(() => {
});

let scriptReady = false;

function loadScript(url: string) {
  //@see https://lengyun.github.io/js/3-2-1dynamicAddJS.html#%E5%8A%A8%E6%80%81%E6%8F%92%E5%85%A5js%E7%9A%84%E6%96%B9%E5%BC%8F%EF%BC%9A
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  script.onload = (e: Event) => {
    console.info(e);
    // if (e.readyState != "complete") return;
    scriptReady = true;
  }
  document.body.appendChild(script);
}

function getDocumentTypeBySuffix(suffix: string): string | false {
  //@see https://api.onlyoffice.com/docs/docs-api/usage-api/config/#:~:text=documentType
  let documentType: string | false = false;
  switch (suffix) {
    default:
      break;
    case 'doc':
    case 'docm':
    case 'docx':
    case 'dot':
    case 'dotm':
    case 'dotx':
    case 'epub':
    case 'fb2':
    case 'fodt':
    case 'htm':
    case 'html':
    case 'mht':
    case 'mhtml':
    case 'odt':
    case 'ott':
    case 'rtf':
    case 'stw':
    case 'sxw':
    case 'txt':
    case 'wps':
    case 'wpt':
      documentType = 'word';
      break;
    case 'csv':
    case 'et':
    case 'ett':
    case 'fods':
    case 'ods':
    case 'ots':
    case 'sxc':
    case 'xls':
    case 'xlsb':
    case 'xlsm':
    case 'xlsx':
    case 'xlt':
    case 'xltm':
    case 'xltx':
      documentType = 'cell';
      break;
    case 'dps':
    case 'dpt':
    case 'fodp':
    case 'odp':
    case 'otp':
    case 'pot':
    case 'potm':
    case 'potx':
    case 'pps':
    case 'ppsm':
    case 'ppsx':
    case 'ppt':
    case 'pptm':
    case 'pptx':
    case 'sxi':
      documentType = 'slide';
      break;
  }
  return documentType;
}
</script>

<template>
  <div class="modal_browser office">
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
      <div :id="'modal_office_'+extId"></div>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.modal_dom.resizing {
  .modal_browser.office {
    iframe {
      z-index: -1;
      position: relative;
    }
  }
}
.modal_browser.office {
  .content {
    text-align: center;
    position: relative;
    iframe {
      width: 100%;
      height: calc(100% - $fontSize * 1.5);
    }
  }
  .pagination {
    height: $fontSize*1.5;
    top: unset;
    bottom: 0;
    text-align: center;
    .left, .right {
      top: unset;
      display: inline-block;
      position: relative;
      opacity: 1;
      //background-color: blue;
      height: 100%;
      line-height: $fontSize*1.5;
      //top: 40%;
      cursor: pointer;
      //
      background-color: map.get($colors, button);
      color: map.get($colors, font);
      &:hover,
      &.active,
      &.disabled,
      option:checked {
        background-color: map.get($colors, button_active);
        color: map.get($colors, font_active);
      }
      //
      span {
        vertical-align: top;
        height: $fontSize * 1.5;
        line-height: $fontSize * 1.5;
      }
    }
  }
  /*.navigator {
  }
  .base {
  }
  .info {
  }*/
}
</style>
