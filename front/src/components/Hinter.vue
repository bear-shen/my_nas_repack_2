<script setup lang="ts">
//https://www.jb51.net/article/246976.htm
import {onMounted, ref, type Ref, watch} from "vue";
import GenFunc from "@/lib/GenFunc";

type valType = any & { _sel?: boolean };

// const emits = defineEmits(["update:modelValue"]);
const props = defineProps<{
  modelValue?: valType,
  // preValue: string,
  getList: Function,
  submit: Function,
  //处理项目的方法
  parseText: Function,
  //提交时候额外回传的数据
  meta?: any,
}>();

const editor: Ref<HTMLElement | null> = ref(null);

onMounted(() => {
  if (editor.value && props.modelValue) {
    console.info(props.modelValue);
    // console.info(props.parseText(props.modelValue));
    editor.value.innerHTML = props.parseText(props.modelValue);
  }
});

// const value: Ref<valType> = ref(null);

async function inputText(evt: Event) {
  // console.info(e);
  const e = evt as InputEvent;
  if (e.isComposing) return;
  GenFunc.debounce(async () => {
    // console.info('input', editor.value, editor.value?.innerText);
    list.value = await props.getList(editor.value?.innerHTML);
    if (list.value.length)
      list.value[0]._sel = true;
  }, 200, 'hinterDebounce');
  // props.modelValue = editor.value?.innerHTML;
  // emits('update:modelValue', editor.value?.innerText);
}

async function keydownEvt(e: KeyboardEvent) {
  let curIndex: number, targetIndex: number;
  switch (e.code) {
    case 'ArrowDown':
      e.stopPropagation();
      e.preventDefault();
      if (!list.value.length) break;
      curIndex = -1;
      list.value.forEach((item, index) => {
        if (item._sel) curIndex = index;
      });
      targetIndex = curIndex + 1;
      while (targetIndex < 0) {
        targetIndex += list.value.length;
      }
      while (targetIndex >= list.value.length) {
        targetIndex -= list.value.length;
      }
      list.value.forEach((item, index) => {
        item._sel = index == targetIndex;
      });
      break;
    case 'ArrowUp':
      e.stopPropagation();
      e.preventDefault();
      if (!list.value.length) break;
      curIndex = 0;
      list.value.forEach((item, index) => {
        if (item._sel) curIndex = index;
      });
      targetIndex = curIndex - 1;
      while (targetIndex < 0) {
        targetIndex += list.value.length;
      }
      while (targetIndex >= list.value.length) {
        targetIndex -= list.value.length;
      }
      list.value.forEach((item, index) => {
        item._sel = index == targetIndex;
      });
      break;
    case 'NumpadEnter':
    case 'Enter':
      e.stopPropagation();
      e.preventDefault();
      if (!list.value.length) break;
      curIndex = -1;
      list.value.forEach((item, index) => {
        if (item._sel) curIndex = index;
      });
      if (curIndex == -1) break;
      const curItem = list.value[curIndex];
      setItem(curItem);
      break;
  }
}

//https://stackoverflow.com/questions/59125857/how-to-watch-props-change-with-vue-composition-api-vue-3
//这边如果填上会影响光标的定位，所以还是不要这样写，用onMounted一次性填充就行
watch(() => props.modelValue, async (to) => {
  console.info(to);
  curVal.value = to;
  if (editor.value)
    editor.value.innerHTML = props.parseText(to);
});

// const curVal: Ref<valType> = ref(props.modelValue);
const curVal: Ref<valType> = ref(null);
onMounted(() => {
//   if (props.modelValue)
//     curVal.value = props.modelValue;

// if (editor.value)
//   editor.value.innerText = value.value;
  editor.value?.focus();
});

const list: Ref<valType[]> = ref([]);

function parseTextVal(value: valType) {
  if (props.parseText)
    return props.parseText(value);
  return value;
}

async function setItem(value: valType) {
  // console.info(value);
  curVal.value = null;
  if (editor.value)
    editor.value.innerHTML = '';
  list.value = [];
  await props.submit(value, props.meta);
  // emits('update:modelValue', value);
}

let blur = false;

function setBlur() {
  blur = true;
}

function setFocus() {
  blur = false;
}
</script>

<template>
  <div
    class="hinter"
  >
    <div
      contenteditable="true"
      @input="inputText"
      @keydown="keydownEvt"
      @focus="setFocus"
      @blur="setBlur"
      ref="editor"></div>
    <ul>
      <li v-for="(item,index) in list"
          :key='`hinter_${index}`'
          v-html="parseTextVal(item)"
          @click="setItem(item)"
          :class="{active:item._sel}"
      ></li>
    </ul>
  </div>

  <!--  v-html="props.modelValue"-->
</template>

<style scoped lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.hinter {
  position: relative;
  > div, > ul > li {
    font-size: $fontSize;
    padding: 0 $fontSize*0.5;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  > div {
    background-color:  map.get($colors, popup_active);
  }
  > ul {
    position: relative;
    left: 0;
    z-index: 5;
    -webkit-column-break-inside: auto;
    @include fillAvailable(width);
    @include blurBackground();
    > li {
      position: relative;
      //@include fillAvailable(width);
      //background-color: fade-out(map-get($colors, bk), 3), 0.5
      &:hover, &.active {
        background-color:  map.get($colors, popup_active);
        //background-color: fade-out(map-get($colors, bk), 8), 0.5
      }
    }
  }
}
</style>
