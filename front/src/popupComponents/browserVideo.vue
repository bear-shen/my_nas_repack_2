<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, watch} from "vue";
import type {ModalConstruct, ModalStruct} from "../modal";
import {queryDemo, query} from "@/Helper";
import type {api_node_col, api_file_list_resp} from "../../../share/Api";
import smp_file_list_resp from "../../../share/sampleApi/smp_file_list_resp";
import GenFunc from "../../../share/GenFunc";
import {useEventStore} from "@/stores/event";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import type {col_node} from "../../../share/Database";

const localConfigure = useLocalConfigureStore();
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
const emits = defineEmits(["nav"]);

const contentDOM: Ref<HTMLElement | null> = ref(null);
const timelineDOM: Ref<HTMLElement | null> = ref(null);
const mediaDOM: Ref<HTMLVideoElement | null> = ref(null);

// const playModes = ["queue", "loop", "single", "shuffle"];

const mediaMeta = ref({
  // ready: false,
  duration: 0,
  time: 0,
  //
  volume: localConfigure.get("browser_play_volume")
    ? localConfigure.get("browser_play_volume")
    : 100,
  mute: false,
  //
  play: false,
  show: false,
  loop: localConfigure.get("browser_play_mode") === "single",
});
const modeKey = localConfigure.listen("browser_play_mode", (v) =>
  Object.assign(mediaMeta.value, {loop: v === "single"})
);
const volumeKey = localConfigure.listen("browser_play_volume", (v) =>
  Object.assign(mediaMeta.value, {volume: v})
);

function onInitMeta() {
  const dom = mediaDOM.value;
  if (!dom || dom.readyState !== 4) return setTimeout(onInitMeta, 50);
  const meta = mediaMeta.value;
  const target = {
    time: 0,
    duration: dom.duration,
  };
  Object.assign(mediaMeta.value, target);
  if (meta.play) dom.play();
  dom.volume = meta.mute ? 0 : meta.volume / 100;
}

function togglePlay() {
  const dom = mediaDOM.value;
  if (!dom) return;
  const meta = mediaMeta.value;
  if (meta.play) {
    dom.pause();
  } else {
    dom.play();
  }
  Object.assign(mediaMeta.value, {play: !meta.play});
}

function onEnd(e: Event) {
  console.info("onEnd", e);
  const dom = mediaDOM.value;
  if (!dom) return;
  const meta = mediaMeta.value;
  if (meta.loop) {
    dom.currentTime = 0;
    dom.play();
    return;
  }
  emits("nav", props.curIndex + 1);
}

onMounted(async () => {
  await beforeInit();
  contentDOM.value?.addEventListener("wheel", wheelListener);
  document.addEventListener("keydown", keymap);
});

async function beforeInit() {
  // console.info('beforeInit');
  Object.assign(mediaMeta.value, {show: false});
  subtitleList.value = [];
  //触发事件以后props数据并没有实时刷新，等一会再执行
  setTimeout(() => {
    loadSubtitle();
    Object.assign(mediaMeta.value, {show: true});
  }, 50);
}

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
let changeEvtKey = eventStore.listen(
  `modal_browser_change_${props.modalData.nid}`,
  (data) => {
    console.info('modal_browser_change_');
    beforeInit();
  }
);
onUnmounted(() => {
  document.removeEventListener("wheel", wheelListener);
  document.removeEventListener("keydown", keymap);
  eventStore.release(
    `modal_browser_change_${props.modalData.nid}`,
    changeEvtKey
  );
  localConfigure.release("browser_play_mode", modeKey);
  localConfigure.release("browser_play_volume", volumeKey);
});

function onTimeUpdate(e: Event) {
  const dom = mediaDOM.value;
  if (!dom) return;
  Object.assign(mediaMeta.value, {
    time: dom.currentTime,
  });
}

const dragData = {
  active: false,
  x: 0,
  w: 0,
  orgX: 0,
};

function onDragging(e: MouseEvent) {
  const dom = mediaDOM.value;
  if (!dom) return;
  const timeline = timelineDOM.value;
  if (!timeline) return;
  document.addEventListener("mousemove", mouseMoveListener);
  document.addEventListener("mouseup", mouseUpListener);
  // console.info(e);
  // const layout = imgLayout.value;
  const t = {
    active: true,
    x: e.clientX,
    w: timeline.clientWidth,
    orgX: GenFunc.nodeOffsetX(timeline),
  };
  Object.assign(dragData, t);
  const delta = (t.x - t.orgX) / t.w;
  dom.currentTime = dom.duration * delta;
  // console.info("onDragging");
  // console.info(e);
}

function mouseMoveListener(e: MouseEvent) {
  // console.info("mouseMoveListener");
  e.preventDefault();
  e.stopPropagation();
  if (!dragData.active) return;
  //
  const dom = mediaDOM.value;
  if (!dom) return;
  Object.assign(dragData, {x: e.clientX});
  let delta = (dragData.x - dragData.orgX) / dragData.w;
  if (delta > 1) delta = 1;
  if (delta < 0) delta = 0;
  dom.currentTime = dom.duration * delta;
}

function mouseUpListener() {
  // console.info("mouseUpListener");
  Object.assign(dragData, {active: false});
  document.removeEventListener("mousemove", mouseMoveListener);
  document.removeEventListener("mouseup", mouseUpListener);
}

function wheelListener(e: WheelEvent) {
  const dom = mediaDOM.value;
  if (!dom) return;
  const meta = mediaMeta.value;
  let volume = meta.volume + (e.deltaY < 0 ? 5 : -5);
  if (volume < 0) volume = 0;
  if (volume > 100) volume = 100;
  dom.volume = volume / 100;
  // Object.assign(mediaMeta.value, {volume: volume});
  localConfigure.set("browser_play_volume", volume);
}

function keymap(e: KeyboardEvent) {
  if ((e.target as HTMLElement).tagName !== "BODY") return;
  if (!props.modalData.layout.active) return;
  // console.info(e);
  switch (e.key) {
    case " ":
      togglePlay();
      break;
    case "ArrowUp":
      wheelListener({deltaY: -1} as WheelEvent);
      break;
    case "ArrowDown":
      wheelListener({deltaY: 1} as WheelEvent);
      break;
    case "ArrowLeft":
    case "ArrowRight":
      const dom = mediaDOM.value;
      if (!dom) return;
      dom.currentTime += e.key === "ArrowLeft" ? -5 : 5;
      Object.assign(mediaMeta.value, {
        time: dom.currentTime,
      });
      break;
  }
}

function parseTime(t: number) {
  const d = {
    h: "" + Math.floor(t / 3600),
    m: "" + Math.floor((t / 60) % 60),
    s: "" + Math.floor(t % 60),
  };
  if (d.m.length < 2) d.m = "0" + d.m;
  if (d.s.length < 2) d.s = "0" + d.s;
  let s = "" + d.s;
  if (d.m || d.h) s = `${d.m}:${s}`;
  if (d.h !== "0") s = `${d.h}:${s}`;
  // console.info(t, d);
  return s;
}

const subtitleIndex = ref(0);
const subtitleList = ref([] as (api_node_col & { label?: string })[]);

function loadSubtitle() {
  // console.info(props.curNode.title);
  let befInd = props.curNode.title?.lastIndexOf('.');
  let preStr = props.curNode.title?.substring(0, befInd) ?? '';
  // console.warn(preStr);
  if (!preStr) return subtitleList.value = [];
  const subNode = [] as (api_node_col & { label?: string })[];
  props.nodeList.forEach(node => {
    if (node.type !== 'subtitle') return;
    if (!node.file?.normal?.path) return;
    let aftStr = node.title?.substring(preStr.length);
    // console.info(aftStr);
    if (node.title?.indexOf(preStr) === 0) subNode.push(Object.assign({label: aftStr}, node));
  });
  // console.info(props.curNode.title, JSON.stringify(subNode));
  subtitleList.value = subNode;
  // return subNode;
}

function toggleSubtitle(index: number) {
  const trackList = mediaDOM.value?.textTracks;
  if (!trackList) return;
  for (let i1 = 0; i1 < trackList.length; i1++) {
    if (index == i1) trackList[i1].mode = 'showing';
    else trackList[i1].mode = 'disabled';
  }
}
</script>

<template>
  <div class="modal_browser video">
    <!-- :style="{ height: props.modalData.layout.h + 'px' }" -->
    <div class="base">
      <div class="l">
        <slot name="info"></slot>
        <div class="btn">
          <button
            :class="{
              sysIcon: true,
              sysIcon_volume: !mediaMeta.mute && mediaMeta.volume,
              sysIcon_mute: mediaMeta.mute,
              sysIcon_mutemode: !mediaMeta.mute && !mediaMeta.volume,
            }"
          >
            {{ mediaMeta.volume }}
          </button>
          <button
            :class="{
              sysIcon: true,
              sysIcon_caretright: mediaMeta.play,
              sysIcon_pause: !mediaMeta.play,
            }"
          >
            <!-- {{ parseTime(mediaMeta.duration) }} -->
            {{ parseTime(mediaMeta.time) }}
          </button>
          <div :class="['video_bar']" @mousedown="onDragging" ref="timelineDOM">
            <span
              :style="{
                left: (100 * mediaMeta.time) / mediaMeta.duration + '%',
              }"
            >|</span
            >
          </div>
          <select
            v-if="subtitleList &&subtitleList.length"
            v-model="subtitleIndex" @change="toggleSubtitle(subtitleIndex)">
            <option v-for="(item, key) in subtitleList" :value="key">
              {{ item.label }}
            </option>
          </select>
        </div>
      </div>
      <div class="r">
        <slot name="btn"></slot>
      </div>
    </div>
    <slot name="navigator"></slot>
    <div class="content" ref="contentDOM" @click="togglePlay">
      <!-- {{ props.curNode.title }} -->
      <template v-if="mediaMeta.show">
        <!-- <img
          v-if="props.curNode.file?.cover"
          :src="props.curNode.file?.cover?.path"
        />
        <span
          v-else
          :class="['listIcon', `listIcon_file_${props.curNode.type}`]"
          :style="{
            fontSize: props.modalData.layout.h * 0.5 + 'px',
            lineHeight: props.modalData.layout.h * 0.8 + 'px',
          }"
        ></span> -->
        <video
          ref="mediaDOM"
          :data-item-id="props.curNode.id"
          :poster="props.curNode.file?.cover?.path"
          @loadedmetadata="onInitMeta()"
          @ended="onEnd"
          @timeupdate="onTimeUpdate"
        >
          <source :src="props.curNode.file?.normal?.path"/>
          <template v-for="(subtitle,index) in subtitleList">
            <track :default="subtitleIndex==index?true:false"
                   :src="subtitle.file?.normal?.path" kind="subtitles"
                   :srclang="subtitle.label" :label="subtitle.label"
            />
          </template>
        </video>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.modal_browser.video {
  .content {
    video {
      position: absolute;
      width: 100%;
      height: calc(100% - $fontSize * 2.5);
      object-fit: contain;
      left: 0;
      top: 0;
    }
  }
  .l .btn {
    button {
      vertical-align: bottom;
      font-size: $fontSize;
      line-height: $fontSize;
      min-width: $fontSize * 3.5;
      text-align: left;
    }
    button::before {
      padding-right: $fontSize * 0.125;
    }
    div {
      display: inline-block;
      background-color: map_get($colors, input_button_bk);
      color: map_get($colors, input_button_font);
      width: 150px;
      //      padding: 0 $fontSize * 0.5;
      border-right: $fontSize * 0.5 solid map_get($colors, input_button_bk);
      height: $fontSize * 1.5;
      line-height: $fontSize * 1.5;
      position: relative;
      &::before {
        border-bottom: 1px solid;
        content: "";
        height: $fontSize * 0.75;
        display: block;
        position: absolute;
        //        width: calc(100% - $fontSize);
        //        left: $fontSize * 0.5;
        width: 100%;
        left: 0;
      }
      span {
        position: absolute;
        left: 0;
      }
    }
  }
  .navigator {
  }
  .base {
  }
  .info {
  }
  video::cue {
    //-webkit-text-stroke: $fontSize*0.5 black;
    //text-shadow: black;
    //outline: green solid 3px;
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    //background-color: rgba(255,255,255,0.5);
    //margin-bottom: 200px;
    font-size: $fontSize*1.5;
  }
}

</style>
