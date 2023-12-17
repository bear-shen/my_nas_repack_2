<script setup lang="ts">
import {onMounted, ref, type Ref} from "vue";
import type {api_node_col, api_rate_attach_resp} from "../../../share/Api";
import {query} from "@/Helper";

const emits = defineEmits([
  "update:modelValue",
]);
const props = defineProps<{
  node: api_node_col,
  modelValue: any,
}>();

const rater: Ref<HTMLElement | null> = ref(null);

function inputText() {
  // console.info('input', editor.value, editor.value?.innerText);
  // props.modelValue = editor.value?.innerHTML;
  emits('update:modelValue', rater.value?.innerText);
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
  // value.value = props.modelValue;
  prepStar();
  if (rater.value) {
    rater.value.addEventListener('mousemove', (e: MouseEvent) => {
      // console.info(rater.value?.offsetWidth, e, e.offsetX);
      let r = Math.round(10 * e.offsetX / (rater.value?.offsetWidth ?? 1));
      if (r < 0) r = 0;
      if (r > 10) r = 10;
      value.value = r;
      prepStar();
    });
    rater.value.addEventListener('mouseleave', (e: MouseEvent) => {
      // console.info(rater.value?.offsetWidth, e, e.offsetX);
      value.value = preValue.value;
      prepStar();
    });
    rater.value.addEventListener('click', async (e: MouseEvent) => {
      // console.info(rater.value?.offsetWidth, e, e.offsetX);
      preValue.value = value.value;
      prepStar();
      //
      const formData = new FormData();
      formData.set('list_node', `${props.node.id ?? ''}`);
      formData.set('rate', `${preValue.value}`);
      const res = await query<api_rate_attach_resp>('rate/attach', formData);
    });
  }
});

const starLs: Ref<number[]> = ref([]);

function prepStar() {
  // console.info(value.value);
  switch (value.value) {
    default:
    case 0:
      starLs.value = [0, 0, 0, 0, 0];
      break;
    case 1:
      starLs.value = [1, 0, 0, 0, 0];
      break;
    case 2:
      starLs.value = [2, 0, 0, 0, 0];
      break;
    case 3:
      starLs.value = [2, 1, 0, 0, 0];
      break;
    case 4:
      starLs.value = [2, 2, 0, 0, 0];
      break;
    case 5:
      starLs.value = [2, 2, 1, 0, 0];
      break;
    case 6:
      starLs.value = [2, 2, 2, 0, 0];
      break;
    case 7:
      starLs.value = [2, 2, 2, 1, 0];
      break;
    case 8:
      starLs.value = [2, 2, 2, 2, 0];
      break;
    case 9:
      starLs.value = [2, 2, 2, 2, 1];
      break;
    case 10:
      starLs.value = [2, 2, 2, 2, 2];
      break;
  }
}

</script>

<template>
  <span
    class="rater"
    ref="rater"
  >
    <template v-for="star in starLs">
    <span v-if="star==2" class="sysIcon sysIcon_cc-star"></span>
    <span v-if="star==1" class="sysIcon sysIcon_cc-star-half"></span>
    <span v-if="star==0" class="sysIcon sysIcon_c-cstar-o"></span>
    </template>
  </span>

  <!--  v-html="props.modelValue"-->
</template>

<style scoped lang="scss">
.rater {
  cursor: pointer;
  &:hover {
    color: map-get($colors, font_active);
  }
  span {
    vertical-align: top;
  }
}
</style>