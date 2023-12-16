<script setup lang="ts">
import {onMounted, ref, type Ref} from "vue";
import type {api_node_col} from "../../../share/Api";

const emits = defineEmits([
  "update:modelValue",
]);
const props = defineProps<{
  node: api_node_col,
  modelValue: any,
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
const preValue: Ref<number> = ref(props.modelValue);
const value: Ref<number> = ref(props.modelValue);
onMounted(() => {
  // console.info('contentEditable', editor.value, editor.value?.innerHTML);
  value.value = props.modelValue;
});

</script>

<template>
  <div
    class="rater"
    ref="rater"
  >
    <span class="sysIcon sysIcon_cc-star"></span>
    <span class="sysIcon sysIcon_cc-star"></span>
    <span class="sysIcon sysIcon_cc-star"></span>
    <span class="sysIcon sysIcon_cc-star-half"></span>
    <span class="sysIcon sysIcon_c-cstar-o"></span>
  </div>

  <!--  v-html="props.modelValue"-->
</template>
