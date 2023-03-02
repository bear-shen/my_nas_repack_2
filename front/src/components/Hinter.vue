<script setup lang="ts">
//https://www.jb51.net/article/246976.htm
import {onMounted, ref, type Ref, watch} from "vue";
import GenFunc from "../../../share/GenFunc";

type valType = any;

// const emits = defineEmits(["update:modelValue"]);
const props = defineProps<{
  modelValue: valType,
  // preValue: string,
  getList: Function,
  submit: Function,
  parseText: Function,
  meta: any,
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

async function inputText() {
  GenFunc.debounce(async () => {
    // console.info('input', editor.value, editor.value?.innerText);
    list.value = await props.getList(editor.value?.innerHTML);
  }, 200, 'hinterDebounce');
  // props.modelValue = editor.value?.innerHTML;
  // emits('update:modelValue', editor.value?.innerText);
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
// onMounted(() => {
//   if (props.modelValue)
//     curVal.value = props.modelValue;

// if (editor.value)
//   editor.value.innerText = value.value;
// });

const list: Ref<valType[]> = ref([]);

function parseText(value: valType) {
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
      @focus="setFocus"
      @blur="setBlur"
      ref="editor"></div>
    <ul>
      <li v-for="item in list"
          v-html="parseText(item)"
          @click="setItem(item)"
      ></li>
    </ul>
  </div>

  <!--  v-html="props.modelValue"-->
</template>

<style scoped lang="scss">
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
    background-color: mkColor(map-get($colors, bk), 3);
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
      background-color: fade-out(mkColor(map-get($colors, bk), 3), 0.5);
      &:hover {
        background-color: fade-out(mkColor(map-get($colors, bk), 8), 0.5);
      }
    }
  }
}
</style>