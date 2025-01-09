<script setup lang="ts">
import type {Ref} from "vue";
import {onMounted, onUnmounted, ref} from "vue";
import type {ModalStruct} from "@/modal";
import type {api_file_bath_rename_resp, api_node_col} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";
import GenFunc from "@/GenFunc";
import {query} from "@/Helper";
import {manualSort} from "@/FileViewHelper";


type valType = api_node_col;
type modType = { id: number, title: string };
//------------------
const locatorInput: Ref<HTMLInputElement | null> = ref(null);

const props = defineProps<{
  data: {
    node_list: api_node_col[];
    callback: (res: modType[]) => any;
    [key: string]: any;
  };
  modalData: ModalStruct;
}>();
// const list = ref(new Map() as Map<string, uploadFile>);
// const list: Ref<valType[]> = ref([] as valType[]);

let mode: Ref<string> = ref('pattern' as string);
let pattern: Ref<string> = ref('{index}_{filename}' as string);
let bathText: Ref<string> = ref('' as string);
onMounted(() => {
  const titleArr: string[] = [];
  props.data.node_list.forEach(node => {
    titleArr.push(node?.title ?? '');
  })
  bathText.value = titleArr.join("\r\n");
  console.info(bathText);
});
onUnmounted(() => {
});


function sortList(list: api_node_col[], sort: string) {
  list = manualSort(list, sort);
  return list;
}

function buildByPattern(list: api_node_col[]) {
  //
  let defIndexPrefix = list.length.toString().length + 1;
  //
  let manIndexPrefix = 0;
  let manIndexKey = '';
  let matchManIndex = pattern.value.match(/\{index:(\d+)}/);
  if (matchManIndex) {
    manIndexPrefix = parseInt(matchManIndex[1]);
    manIndexKey = matchManIndex[0];
  }
  //
  const modMap = new Map<number, string>();
  list.forEach((node, index) => {
    const parentNode = node.crumb_node ? node.crumb_node[node.crumb_node.length - 1] : null;
    const parentTitle = parentNode ? parentNode.title : '';
    //
    let replaceKV = new Map<string, string>();
    replaceKV.set('{filename}', node.title ?? '');
    replaceKV.set('{index}', GenFunc.prefix(index + 1, defIndexPrefix, '0'));
    replaceKV.set('{directory}', parentTitle ?? '');
    replaceKV.set(`{index:${manIndexKey}}`, GenFunc.prefix(index + 1, manIndexPrefix, '0'));
    let target = pattern.value;
    replaceKV.forEach((value, key) => {
      // console.info(key, value);
      target = target.replace(key, value);
    })
    // console.info(target);
    modMap.set(node.id ?? 0, target);
  });
  const modArr = [] as { id: number, title: string }[];
  modMap.forEach((value, key) => {
    modArr.push({id: key, title: value});
  });
  return modArr;
}

function buildByBath() {
}

async function onSubmit() {
  const modalStore = useModalStore();
  //
  /*
  //导入的时候就是按照遍历提取的id,所以其实不需要排序
  const localConfigure = useLocalConfigureStore();
  console.info(
    'on submit', props.data.node_list, props.modalData);
  let sortVal: Ref<string> = ref(
    localConfigure.get("file_view_sort") ?? "name_asc"
  );
  const list = sortList(props.data.node_list, sortVal.value);
  */
  // let pattern = modal.content.form[0].value;
  // console.info(modArr);
  // return;
  let modArr: modType[] = [];
  switch (mode.value) {
    default:
    case 'pattern':
      modArr = buildByPattern(props.data.node_list);
      break;
    case 'bath':
      const nameArr = bathText.value.split(/[\r\n]+/);
      modArr = [];
      props.data.node_list.forEach((node, index) => {
        if (!nameArr[index]) return;
        if (!nameArr[index].trim().length) return;
        modArr.push({
          id: node.id ?? 0,
          title: nameArr[index].trim(),
        })
      })
      break;
  }

  const queryData = {
    list: JSON.stringify(modArr),
  };
  const res = await query<api_file_bath_rename_resp>("file/bath_rename", queryData);
  //同步回列表
  console.info(res);
  // if (!res) return;
  props.data.callback(modArr);
  return modalStore.close(props.modalData.nid);
}

</script>

<template>
  <div class="modal_rename_util">
    <div class="mode_selector">
      <input
        :id="`P_${props.modalData.nid}_MODE_PATTERN`"
        :name="`P_${props.modalData.nid}_MODE`"
        :value="'pattern'"
        type="radio"
        v-model="mode"
      />
      <label
        :for="`P_${props.modalData.nid}_MODE_PATTERN`"
      >pattern</label>
      <input
        :id="`P_${props.modalData.nid}_MODE_BATH`"
        :name="`P_${props.modalData.nid}_MODE`"
        :value="'bath'"
        type="radio"
        v-model="mode"
      />
      <label
        :for="`P_${props.modalData.nid}_MODE_BATH`"
      >bath</label>
    </div>
    <template v-if="mode=='pattern'">
      <!--      <div>-->
      <p>rename pattern:</p>
      <table>
        <tbody>
        <tr>
          <td>code</td>
          <td>description</td>
        </tr>
        <tr>
          <td>{filename}</td>
          <td>file name</td>
        </tr>
        <tr>
          <td>{index}</td>
          <td>index by sort, prefix by max len+1</td>
        </tr>
        <tr>
          <td>{index:n}</td>
          <td>index by sort, prefix len by [n]</td>
        </tr>
        <tr>
          <td>{directory}</td>
          <td>parent directory name</td>
        </tr>
        </tbody>
      </table>
      <!--      </div>-->
      <label><span>pattern</span><input type="text" v-model="pattern"></label>
    </template>
    <template v-if="mode=='bath'">
      <p>rename bath:</p>
      <textarea v-model="bathText"></textarea>
    </template>
    <label class="confirm">
      <button @click="onSubmit">submit</button>
    </label>
  </div>
</template>

<style lang="scss">
.modal_rename_util {
  width: 100%;
  //min-height: 90%;
  position: relative;
  input[type="radio"] {
    + label::after {
      padding-left: $fontSize * 0.25;
    }
  }
  > * {
    margin-top: $fontSize * 0.5;
  }
  > label {
    display: flex;
    justify-content: space-between;
  }
  > .confirm {
    justify-content: center;
  }
  textarea {
    @include fillAvailable(width);
    height: $fontSize*8.5;
  }
}
</style>
