<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, watch} from "vue";
import type {ModalConstruct, ModalStruct} from "../modal";
import {queryDemo, query} from "@/Helper";
import type {api_node_col, api_file_list_resp} from "../../../share/Api";
import GenFunc from "@/GenFunc";
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

onMounted(() => {
  console.warn("mounted");
  docEditor = new DocsAPI.DocEditor('modal_office_' + props.modalData.nid, {
    document: {
      fileType: "docx",
      key: "Khirz6zTPdfd7",
      title: "Example Document Title.docx",
      url: "http://192.168.110.152:8001/url-to-example-document.docx",
    },
    documentType: "word",
    editorConfig: {
      callbackUrl: "http://192.168.110.152:8001/url-to-callback.ashx",
    },
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb2N1bWVudCI6eyJmaWxlVHlwZSI6ImRvY3giLCJrZXkiOiJLaGlyejZ6VFBkZmQ3IiwidGl0bGUiOiJFeGFtcGxlIERvY3VtZW50IFRpdGxlLmRvY3giLCJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tL3VybC10by1leGFtcGxlLWRvY3VtZW50LmRvY3gifSwiZG9jdW1lbnRUeXBlIjoid29yZCIsImVkaXRvckNvbmZpZyI6eyJjYWxsYmFja1VybCI6Imh0dHBzOi8vZXhhbXBsZS5jb20vdXJsLXRvLWNhbGxiYWNrLmFzaHgifX0.vbezS2aM8Xf8qFzIAsO-jrIsi7VLxjRYkIkwh5jLTJU",
  });
  console.info(docEditor);
});
watch(
  () => props.curNode,
  async (to) => {
    console.info('onMod props.curNode');
    src.value = '/pdfjs/web/viewer.html?file=' + to.file_index?.raw?.path + '&filename=' + to.title;
  });
onUnmounted(() => {
  src.value = null;
});

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
