<script setup lang="ts">
//https://www.jb51.net/article/246976.htm
import {onMounted, ref, type Ref} from "vue";

const emits = defineEmits([
  "update:modelValue",
  "focus",
  "blur",
]);
const props = defineProps<{
  modelValue: any
  autoFocus?: boolean
}>();

const editor: Ref<HTMLElement | null> = ref(null);

function inputText() {
  // console.info('input', editor.value, editor.value?.innerText);
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
  // console.info('contentEditable', editor.value, editor.value?.innerHTML);
  value.value = props.modelValue;
  if (editor.value)
    editor.value.innerText = value.value;
  if (props.autoFocus) {
    editor.value?.focus();
  }
});

let blur = false;

function setBlur() {
  blur = true;
  emits("blur", editor.value);
}

function setFocus() {
  blur = false;
  emits("focus", editor.value);
}
</script>

<template>
  <div
    class="content_editor"
    contenteditable="true"
    @input="inputText"
    @focus="setFocus"
    @blur="setBlur"
    ref="editor"
  ></div>

  <!--  v-html="props.modelValue"-->
</template>
