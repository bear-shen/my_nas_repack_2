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

function inputText() {
  console.info('input', editor.value, editor.value?.innerText);
  // props.modelValue = editor.value?.innerHTML;
  // emits('update:modelValue', editor.value?.innerText);
}

//https://stackoverflow.com/questions/59125857/how-to-watch-props-change-with-vue-composition-api-vue-3
//这边如果填上会影响光标的定位，所以还是不要这样写，用onMounted一次性填充就行
// watch(() => props.modelValue, async (to) => {
// console.info(to);
// if (editor.value)
//   editor.value.innerText = to;
// });

const curVal: Ref<valType> = ref(props.modelValue);
onMounted(() => {
  if (props.modelValue)
    curVal.value = props.modelValue;

  // if (editor.value)
  //   editor.value.innerText = value.value;
});

const list: Ref<valType[]> = ref([]);

function parseText(value: valType) {
  if (props.parseText)
    return props.parseText(value);
  return value;
}

function setItem(value: valType) {
  console.info(value);
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
