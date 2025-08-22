<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, type Ref, watch} from "vue";
import GenFunc from "@/lib/GenFunc";
import * as LocalConfigure from "@/shares/LocalConfigure";
import {mayTyping} from "@/lib/Helper";
import type { nodePropsType, nodePropsType_sub } from "@/types/browser";

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

const contentDOM: Ref<HTMLElement | null> = ref(null);
const timelineDOM: Ref<HTMLElement | null> = ref(null);
const mediaDOM: Ref<HTMLVideoElement | null> = ref(null);
const resPath: Ref<string> = ref('');
if (props.file.normal) {
  resPath.value = props.file.normal;
} else {
  resPath.value = props.file.raw;
}

// const playModes = ["queue", "loop", "single", "shuffle"];

const mediaMeta = ref({
  // ready: false,
  duration: 0,
  buffered: 0,
  time: 0,
  //
  volume: LocalConfigure.get("browser_play_volume")
    ? LocalConfigure.get("browser_play_volume")
    : 100,
  brightness: LocalConfigure.get("browser_play_brightness")
    ? LocalConfigure.get("browser_play_brightness")
    : 1,
  mute: false,
  //
  play: false,
  // show: true,
  loading: true,
  loop: LocalConfigure.get("browser_play_mode") === "single",
});
const modeKey = LocalConfigure.listen("browser_play_mode", (v) =>
  Object.assign(mediaMeta.value, {loop: v === "single"})
);
const volumeKey = LocalConfigure.listen("browser_play_volume", (v) =>
  Object.assign(mediaMeta.value, {volume: v})
);
const brightnessKey = LocalConfigure.listen("browser_play_brightness", (v) =>
  Object.assign(mediaMeta.value, {brightness: v})
);
let bufferTimer :number|NodeJS.Timeout= 0;

function onInit(): any {
  console.info('onInit');
  const dom = mediaDOM.value;
  if (!dom) return;
  if (dom.readyState !== 4) return setTimeout(onInit, 50);
  const meta = mediaMeta.value;
  const target = {
    time: 0,
    duration: dom.duration,
  };
  Object.assign(mediaMeta.value, target);
  if (meta.play) dom.play();
  dom.volume = meta.mute ? 0 : meta.volume / 100;
  //
  contentDOM.value?.addEventListener("wheel", wheelListener);
}

function onCanplay(e: Event) {
  console.info('onCanplay');
  if (!mediaDOM.value) return;
  document.addEventListener("keydown", keymap);
  Object.assign(mediaMeta.value, {loading: false});
}

function onRelease(reboot: boolean = true) {
  document.removeEventListener("wheel", wheelListener);
  document.removeEventListener("keydown", keymap);
  resPath.value = '';
  // console.info('onRelease', mediaDOM.value);
  if (mediaDOM.value) mediaDOM.value?.load();
  if (reboot)
    // setTimeout(() => {
    Object.assign(mediaMeta.value, {
      // show: false,
      loading: true,
    });
  // })
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
  if (mediaDOM.value) mediaDOM.value?.load();
  bufferTimer = setInterval(modBuffered, 200);
});

async function beforeInit() {
  // console.info('beforeInit');
  // Object.assign(mediaMeta.value, {show: false});
  subtitleList.value = [];
  loadSubtitle();
  // video的dom更新需要删了才能刷新
  // setTimeout(() => {
  // Object.assign(mediaMeta.value, {show: true});
  // }, 50);
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
// const eventStore = useEventStore();

watch(() => props.file, async (to) => {
  onRelease();
  beforeInit();
  if (props.file.normal) {
    resPath.value = props.file.normal;
  } else {
    resPath.value = props.file.raw;
  }
  // setTimeout(() => {
  if (mediaDOM.value) mediaDOM.value?.load();
  // Object.assign(mediaMeta.value, {show: true});
  // });
});
// let changeEvtKey = eventStore.listen(
//   `modal_browser_change_${props.modalData.nid}`,
//   (data) => {
//     Object.assign(mediaMeta.value, { show: false });
//     setTimeout(() => Object.assign(mediaMeta.value, { show: true }), 50);
//   }
// );
onBeforeUnmount(() => {
  onRelease(false);
  LocalConfigure.release("browser_play_mode", modeKey);
  LocalConfigure.release("browser_play_volume", volumeKey);
  LocalConfigure.release("browser_play_brightness", brightnessKey);
  clearInterval(bufferTimer);
});


function modBuffered() {
  if (!mediaDOM.value) return;
  if (!mediaDOM.value.buffered || !mediaDOM.value.buffered.length) return;
  let end = 0;
  for (let i1 = 0; i1 < mediaDOM.value.buffered.length; i1++) {
    const val = mediaDOM.value.buffered.end(i1);
    if (mediaMeta.value.time > val) continue;
    end = val;
    break;
  }
  Object.assign(mediaMeta.value, {
    buffered: end,
  });
}

function onTimeUpdate(e: Event) {
  const dom = mediaDOM.value;
  if (!dom) return;
  // GenFunc.debounce(() => {
  Object.assign(mediaMeta.value, {
    time: dom.currentTime,
  });
  // }, 100);
}

const dragData = {
  active: false,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  orgX: 0,
  orgY: 0,
  left: 0,
  right: 0,
  t: 0,
};

let pointerId = 0;

function onBarDragging(e: PointerEvent) {
  if (pointerId) return;
  const dom = mediaDOM.value;
  if (!dom) return;
  const timeline = timelineDOM.value;
  if (!timeline) return;
  pointerId = e.pointerId;
  document.addEventListener("pointermove", pointerBarMoveListener);
  document.addEventListener("pointerup", pointerBarUpListener);
  // console.info(e, timelineDOM, dom);
  // const layout = imgLayout.value;
  const t = {
    active: true,
    x: e.clientX,
    w: timeline.clientWidth,
    orgX: GenFunc.nodeOffsetX(timeline),
  };
  // console.info(t);
  Object.assign(dragData, t);
  const delta = (t.x - t.orgX) / t.w;
  // console.info(delta);
  // return;
  dom.currentTime = dom.duration * delta;
  Object.assign(mediaMeta.value, {
    time: dom.currentTime,
  });
  // console.info("onDragging");
  // console.info(e);
}

function pointerBarMoveListener(e: PointerEvent) {
  if (e.pointerId != pointerId) return;
  // console.info("pointerMoveListener");
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
  Object.assign(mediaMeta.value, {
    time: dom.currentTime,
  });
}

function pointerBarUpListener(e: PointerEvent) {
  if (e.pointerId != pointerId) return;
  pointerId = 0;
  // console.info("pointerUpListener");
  Object.assign(dragData, {active: false});
  document.removeEventListener("pointermove", pointerBarMoveListener);
  document.removeEventListener("pointerup", pointerBarUpListener);
}

function onContentDragging(e: PointerEvent) {
  if (pointerId) return;
  //
  const dom = mediaDOM.value;
  if (!dom) return;
  const contentDOMVal = contentDOM.value;
  if (!contentDOMVal) return;
  //
  pointerId = e.pointerId;
  e.preventDefault();
  e.stopPropagation();
  document.addEventListener("pointermove", pointerContentMoveListener);
  document.addEventListener("pointerup", pointerContentUpListener);
  // console.info(e, timelineDOM, dom);
  // const layout = imgLayout.value;
  const t = {
    active: true,
    x: e.clientX,
    y: e.clientY,
    w: contentDOMVal.clientWidth,
    h: contentDOMVal.clientHeight,
    orgX: GenFunc.nodeOffsetX(contentDOMVal),
    orgY: GenFunc.nodeOffsetX(contentDOMVal),
    left: 0,
    right: 0,
    t: new Date().valueOf(),
  };
  //
  const deltaW = (t.x - t.orgX) / t.w;
  if (deltaW > 0.5) t.right = 1;
  if (deltaW < 0.5) t.left = 1;
  //
  // console.info(t);
  Object.assign(dragData, t);
  //togglePlay
}

function pointerContentMoveListener(e: PointerEvent) {
  if (e.pointerId != pointerId) return;
  // console.info("pointerMoveListener");
  e.preventDefault();
  e.stopPropagation();
  if (!dragData.active) return;
  //
  const dom = mediaDOM.value;
  if (!dom) return;
  const contentDOMVal = contentDOM.value;
  if (!contentDOMVal) return;
  //
  const deltaH = (e.clientY - dragData.y) / (dragData.h);
  Object.assign(dragData, {y: e.clientY});
  const meta = mediaMeta.value;
  if (dragData.right) {
    let volume = meta.volume - (deltaH * 100 * 1.5);
    // console.info(meta.volume, deltaH, volume, dragData);
    if (volume < 0) volume = 0;
    if (volume > 100) volume = 100;
    dom.volume = volume / 100;
    // Object.assign(mediaMeta.value, { volume: volume });
    LocalConfigure.set("browser_play_volume", volume);
  }
  if (dragData.left) {
    let brightness = meta.brightness - deltaH;
    if (brightness < 0) brightness = 0;
    if (brightness > 1) brightness = 1;
    //
    meta.brightness = brightness;
    LocalConfigure.set("browser_play_brightness", brightness);
  }
}

function pointerContentUpListener(e: PointerEvent) {
  if (e.pointerId != pointerId) return;
  pointerId = 0;
  const cur = new Date().valueOf();
  // console.info(dragData.t, cur, cur - dragData.t);
  if (dragData.t > cur - 250) {
    togglePlay();
  }
  // console.info("pointerUpListener");
  Object.assign(dragData, {active: false});
  document.removeEventListener("pointermove", pointerContentMoveListener);
  document.removeEventListener("pointerup", pointerContentUpListener);
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
  LocalConfigure.set("browser_play_volume", volume);
}

function keymap(e: KeyboardEvent) {
  if (mayTyping(e.target as HTMLElement)) return;
  if (!props.isActive) return;
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
    case "Enter":
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
const subtitleList:Ref<nodePropsType_sub[]> = ref([]);

function loadSubtitle() {
  // console.info(props.curNode.title);
  let befInd = props.file.title?.lastIndexOf('.');
  let preStr = props.file.title?.substring(0, befInd) ?? '';
  // console.warn(preStr);
  if (!preStr) return subtitleList.value = [];
  const subNode:nodePropsType_sub[] = [] ;
  props.file.sameName.forEach(node => {
    if (node.type !== 'subtitle') return;
    if (!(node.normal || node.raw)) return;
    subNode.push(node);
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
        <div class="btnContainer">
          <button
            :class="{
              sysIcon: true,
              sysIcon_volume: !mediaMeta.mute && mediaMeta.volume,
              sysIcon_mute: mediaMeta.mute,
              sysIcon_mutemode: !mediaMeta.mute && !mediaMeta.volume,
            }"
          >
            {{ Math.round(mediaMeta.volume) }}
          </button>
          <button
            :class="{
              sysIcon: true,
              sysIcon_caretright: mediaMeta.play,
              sysIcon_pause: !mediaMeta.play,
            }"
            @click="togglePlay"
          >
            <!-- {{ parseTime(mediaMeta.duration) }} -->
            {{ parseTime(mediaMeta.time) }}
          </button>
          <div :class="['video_bar']" @pointerdown="onBarDragging" ref="timelineDOM">
            <span class="duration"
                  :style="{
                left: (100 * mediaMeta.time) / mediaMeta.duration + '%',
              }"
            ></span>
            <span class="buffer"
                  :style="{
                width: (100 * mediaMeta.buffered) / mediaMeta.duration + '%',
              }"
            ></span>
          </div>
          <select
            v-if="subtitleList &&subtitleList.length"
            v-model="subtitleIndex" @change="toggleSubtitle(subtitleIndex)">
            <option v-for="(item, key) in subtitleList" :value="key" :key="'MO_BS_VDO_'+props.extId+'_sub_'+key">
              {{ item.title }}
            </option>
          </select>
        </div>
      </div>
      <div class="r">
        <slot name="btnContainer"></slot>
      </div>
    </div>
    <slot name="navigator"></slot>
    <div class="content" ref="contentDOM" @pointerdown="onContentDragging">
      <!-- {{ props.curNode.title }} -->
      <template v-if="mediaMeta.loading">
        <span class="loader sysIcon sysIcon_sync"></span>
      </template>
      <!--      <template v-if="mediaMeta.show">-->
      <!-- <img
        v-if="props.curNode.file_index?.preview"
        :src="props.curNode.file_index?.preview?.path"
        :style="{filter: `brightness(${mediaMeta.brightness})`}"
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
        preload="metadata"
        :data-item-id="props.file.id"
        :poster="props.file.preview"
        @loadedmetadata="onInit"
        @canplay="onCanplay"
        @ended="onEnd"
        @timeupdate="onTimeUpdate"
        :style="{filter: `brightness(${mediaMeta.brightness})`}"
      >
        <source :src="resPath"/>
        <template v-for="(subtitle,index) in subtitleList" :key="'MO_BS_VDO_'+props.extId+'_track_'+index">
            <track
              :default="subtitleIndex==index?true:false"
              :src="subtitle.normal?subtitle.normal:subtitle.raw" kind="subtitles"
              :srclang="subtitle.title" :label="subtitle.title"
            />
        </template>
      </video>
      <!--      @focus="console.info('focus',$event)"
            @auxclick="console.info('auxclick',$event)"
            @contextlost="console.info('contextlost',$event)"
            @contextrestored="console.info('contextrestored',$event)"
            @cuechange="console.info('cuechange',$event)"
            @emptied="console.info('emptied',$event)"
            @error="console.info('error',$event)"
            @durationchange="console.info('durationchange',$event)"
            @drop="console.info('drop',$event)"
            @focusin="console.info('focusin',$event)"
            @focusout="console.info('focusout',$event)"
            @progress="console.info('progress',$event)"
            @ratechange="console.info('ratechange',$event)"
            @reset="console.info('reset',$event)"
            @securitypolicyviolation="console.info('securitypolicyviolation',$event)"
            @slotchange="console.info('slotchange',$event)"
            @stalled="console.info('stalled',$event)"
            @suspend="console.info('suspend',$event)"
            @waiting="console.info('waiting',$event)"-->
      <!--      </template>-->
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.modal_browser.video {
  .content {
    touch-action: none;
    video {
      position: absolute;
      width: 100%;
      height: calc(100% - $fontSize * 2.5);
      object-fit: contain;
      left: 0;
      top: 0;
    }
  }
  .base {
    .l, .r {
      position: relative;
    }
  }
  .l {
    width: calc(100% - $fontSize * 10);
    min-width: 150px;
  }
  .l .btnContainer {
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
    .video_bar {
      touch-action: none;
      display: inline-block;
      //background-color: map.get($colors, input_button_bk);
      color: map.get($colors, font_sub_active);
      width: calc(100% - $fontSize * 20);
      //      padding: 0 $fontSize * 0.5;
      border-right: 1px solid map.get($colors, font_sub_active);
      height: $fontSize * 1.5;
      line-height: $fontSize * 1.5;
      position: relative;
      &::before {
        border-bottom: $fontSize*0.25 solid map.get($colors, font_sub);
        content: "";
      }
      span.buffer {
        border-bottom: $fontSize*0.25 solid map.get($colors, font_sub_active);
      }
      &::before, span.buffer {
        height: $fontSize * 0.625;
        display: block;
        position: absolute;
        //        width: calc(100% - $fontSize);
        //        left: $fontSize * 0.5;
        width: 100%;
        left: 0;
      }
      span.duration {
        border-right: 1px solid map.get($colors, font_sub_active);
        height: 100%;
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
    //outline: green solid 3px;
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    //background-color: rgba(255,255,255,0.5);
    //margin-bottom: 200px;
    font-size: $fontSize*1.5;
  }
}

</style>
