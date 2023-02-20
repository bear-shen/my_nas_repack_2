<script setup lang="ts">
//https://www.jb51.net/article/246976.htm
import {onMounted, ref, type Ref, watch} from "vue";

type valType = any;

const emits = defineEmits(["update:modelValue"]);
const props = defineProps<{
  modelValue: valType,
  preValue: string,
  onInput: Function,
  onSubmit: Function,
  parseText: Function,
}>();

const editor: Ref<HTMLElement | null> = ref(null);

async function inputText() {
  console.info('input', editor.value, editor.value?.innerText);
  list.value = await props.onInput(editor.value?.innerHTML);
  // props.modelValue = editor.value?.innerHTML;
  // emits('update:modelValue', editor.value?.innerText);
}

//https://stackoverflow.com/questions/59125857/how-to-watch-props-change-with-vue-composition-api-vue-3
//这边如果填上会影响光标的定位，所以还是不要这样写，用onMounted一次性填充就行
watch(() => props.modelValue, async (to) => {
  console.info(to);
  // curVal.value = to;
// if (editor.value)
//   editor.value.innerText = to;
});

const curVal: Ref<valType> = ref(props.modelValue);
onMounted(() => {
  if (props.modelValue)
    curVal.value = props.modelValue;

  // if (editor.value)
  //   editor.value.innerText = value.value;
});

const list: Ref<valType[]> = ref([
  '12314', '12314', '12314', '12314', '12314', '12314',
]);

function parseText(value: valType) {
  if (props.parseText)
    return props.parseText(value);
  return value;
}

function setItem(value: valType) {
  // console.info(value);
  curVal.value = value;
  emits('update:modelValue', value);
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
      ref="editor"
      v-html="parseText(curVal)"></div>
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
    position: absolute;
    left: 0;
    z-index: 5;
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