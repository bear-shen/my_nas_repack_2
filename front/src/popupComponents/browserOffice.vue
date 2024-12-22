<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, watch} from "vue";
import type {ModalConstruct, ModalStruct} from "../modal";
import {queryDemo, query} from "@/Helper";
import type {api_node_col, api_file_list_resp} from "../../../share/Api";
import GenFunc from "@/GenFunc";
import {useUserStore} from "@/stores/userStore";
import sign from "jwt-encode";
// import {useEventStore} from "@/stores/event";


const props = defineProps<{
  data: { [key: string]: any };
  modalData: ModalStruct;
  nodeList: api_node_col[];
  curIndex: number;
  curNode: api_node_col;
}>();
let filePath = null;
const viewerId = 'pdvViewer_' + props.modalData.nid;
const contentDOM: Ref<HTMLIFrameElement | null> = ref(null);
const src: Ref<string | null> = ref(null);
let docEditor = null;
const userStore = useUserStore();
const user = userStore.get();

onMounted(() => {
  console.warn("mounted");
  loadScript('http://192.168.110.152:8001/web-apps/apps/api/documents/api.js');
  setTimeout(() => startOnlyOffice(), 100);
});

function startOnlyOffice() {
  const secret = 'Ru857DNvRDsfdQ4TxX0yE15r022R0kk1';
  const origin = 'http://192.168.110.235:85';
  const curNode = props.curNode;
  console.info(props);
  console.info(curNode);
  const suffixInd = curNode.title.lastIndexOf('.');
  const suffix = curNode.title.substring(suffixInd + 1);
  const documentType = getDocumentTypeBySuffix(suffix);
  if (!documentType) return;
  const url = new URL(location.href);
  const payload = {
    document: {
      fileType: suffix,
      key: curNode.id.toString(16),
      title: curNode.title,
      url: `${origin}${curNode.file_index.raw.path}?token=${user?.token}`,
    },
    documentType: documentType,
    editorConfig: {
      callbackUrl: `${origin}/api/onlyoffice/callback?id=${curNode.id}&token=${user?.token}`,
    },
  };
  payload.token = sign(payload, secret);
  docEditor = new DocsAPI.DocEditor('modal_office_' + props.modalData.nid, payload);
  console.info(docEditor);
}

watch(
  () => props.curNode,
  async (to) => {
    console.info('onMod props.curNode');
    src.value = '/pdfjs/web/viewer.html?file=' + to.file_index?.raw?.path + '&filename=' + to.title;
  });
onUnmounted(() => {
  src.value = null;
});

function loadScript(url) {
  //@see https://lengyun.github.io/js/3-2-1dynamicAddJS.html#%E5%8A%A8%E6%80%81%E6%8F%92%E5%85%A5js%E7%9A%84%E6%96%B9%E5%BC%8F%EF%BC%9A
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  document.body.appendChild(script);
}

function getDocumentTypeBySuffix(suffix): string {
  //@see https://api.onlyoffice.com/docs/docs-api/usage-api/config/#:~:text=documentType
  let documentType: string;
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
  <div class="modal_browser pdf">
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
    <div class="content" :id="'modal_office_'+modalData.nid">
    </div>
  </div>
</template>

<style lang="scss">
@import "../assets/variables";
.modal_dom.resizing {
  .modal_browser.pdf {
    iframe {
      z-index: -1;
      position: relative;
    }
  }
}
.modal_browser.pdf {
  .content {
    text-align: center;
    embed {
      width: 100%;
      height: 100%;
    }
  }
  .pagination {
    .left, .right {
      opacity: 1;
      //background-color: blue;
      height: 10%;
      top: 40%;
      cursor: pointer;
      span {
        //width: $fontSize * 2;
        //height: $fontSize * 2;
        //line-height: $fontSize * 2;
        //border-radius: $fontSize * 2;
        //background-color: map-get($colors, popup_active);
        $blurSize: $fontSize * 0.25;
        text-shadow: 0 0 $blurSize black, 0 0 $blurSize black, 0 0 $blurSize black,
        0 0 $blurSize black;
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
