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


onMounted(() => {
  console.warn("mounted");
  src.value = '/pdfjs/web/viewer.html?file=' + props.curNode.file_index?.raw?.path + '&filename=' + props.curNode.title;
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
//
/*const eventStore = useEventStore();
let resizingEvtKey = eventStore.listen(
  `modal_resizing_${props.modalData.nid}`,
  (data) => fitImg()
);*/
//
/*
//看了一下还是要做改webpack一类的操作。。。
//考虑切换成直接套用release

// Setting worker path to worker bundle.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "../../build/webpack/pdf.worker.bundle.js";

async function loadPDF() {

// Loading a document.
  const loadingTask = pdfjsLib.getDocument(filePath);
  const pdfDocument = await loadingTask.promise;
// Request a first page
  const pdfPage = await pdfDocument.getPage(1);
// Display page on the existing canvas with 100% scale.
  const viewport = pdfPage.getViewport({scale: 1.0});
  const canvas = contentDOM.value;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  const renderTask = pdfPage.render({
    canvasContext: ctx,
    viewport,
  });
  await renderTask.promise;
}
loadPDF();
*/

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
    <div class="content">
      <iframe v-if="src" :src="src" width="100%" height="100%" allowfullscreen/>
    </div>
  </div>
</template>

<style lang="scss">
@import "../assets/variables";
.modal_dom.resizing {
  .modal_browser.pdf {
    iframe {
      //调整尺寸的时候把iframe置底
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
