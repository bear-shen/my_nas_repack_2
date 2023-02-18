<script setup lang="ts">
//https://www.jb51.net/article/246976.htm
import {onMounted, ref, type Ref, watch} from "vue";

const emits = defineEmits(["update:modelValue"]);
const props = defineProps<{
  modelValue: string
}>();

const editor: Ref<HTMLElement | null> = ref(null);

function inputText() {
  console.info('input', editor.value, editor.value?.innerText);
  // props.modelValue = editor.value?.innerHTML;
  emits('update:modelValue', editor.value?.innerText);
}


//https://stackoverflow.com/questions/59125857/how-to-watch-props-change-with-vue-composition-api-vue-3
//这边如果填上会影响光标的定位，所以还是不要这样写，用onMounted一次性填充就行
// watch(() => props.modelValue, async (to) => {
// console.info(to);
// if (editor.value)
//   editor.value.innerText = to;
// });

const value: Ref<string> = ref(props.modelValue);
onMounted(() => {
  value.value = props.modelValue;
  if (editor.value)
    editor.value.innerText = value.value;
});

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
    contenteditable="true"
    @input="inputText"
    @focus="setFocus"
    @blur="setBlur"
    ref="editor"
  ></div>

  <!--  v-html="props.modelValue"-->
</template>
