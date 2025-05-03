<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {query} from "@/Helper";
import GenFunc from "@/GenFunc";
import type {api_queue_col, api_queue_list_req, api_queue_list_resp,} from "../../../share/Api";
// import {useModalStore} from "@/stores/modalStore";

type settingType = api_queue_col & {
  ext_key?: string,
};
//
const localConfigure = useLocalConfigureStore();
// const modalStore = useModalStore();
const contentDOM: Ref<HTMLElement | null> = ref(null);
const router = useRouter();
const route = useRoute();
let queryData = {
  id: '',
  status: '',
  type: '',
} as api_queue_list_req;
let statusMap = [
  ['', 'all'],
  [-2, 'unknown'],
  [-1, 'failed'],
  [0, 'success'],
  [1, 'new'],
  [2, 'working'],
];
const list: Ref<settingType[]> = ref([]);
onMounted(async () => {
  //@see https://stackoverflow.com/questions/17781472/how-to-get-a-subset-of-a-javascript-objects-properties
  queryData = (({id, status, type}) => ({id: id ?? '', status: status ?? '', type: type ?? ''}))(route.query) as api_queue_list_req;
  getList(true);
  if (contentDOM.value)
    contentDOM.value.addEventListener('scroll', scrollEvt);
});

onBeforeRouteUpdate(async (to) => {
  console.info(to);
  // queryData.id = to.query.id ?? '';
  // queryData.keyword = to.query.keyword as string ?? '';
  // queryData.is_del = to.query.is_del as string ?? '';
  queryData = (({id, status, type}) => ({id: id ?? '', status: status ?? '', type: type ?? ''}))(to.query) as api_queue_list_req;
  getList(true);
});

function go() {
  console.info('go')
  router.push({
    path: route.path,
    query: queryData,
  });
}

//
onUnmounted(() => {
  if (contentDOM.value)
    contentDOM.value?.removeEventListener('scroll', scrollEvt);
});

async function scrollEvt(a: any) {
  console.info(a);
  if (!contentDOM.value) return;
  let dom = contentDOM.value;
  let curH = dom?.scrollTop + dom?.clientHeight
    //差一屏时开始预加载
    + dom?.clientHeight
  ;
  if (dom?.scrollHeight < curH) {
    GenFunc.debounce(async () => {
      await getList();
    }, 500, 'logViewDebounce');
  }
}

let curPage = 1;
let loading = false;

async function getList(clear: boolean = false) {
  if (loading) return;
  loading = true;
  if (clear) {
    list.value = [];
    curPage = 1;
  }
  // console.info('getGroup');
  // groupList.value = [];
  const res = await query<api_queue_list_resp>("log/get",
    Object.assign(
      {page: curPage}, queryData
    ));
  curPage += 1;
  loading = false;
  if (!res || !res.length) {
    curPage--;
    return;
  }
  const target: settingType[] = clear ? [] : list.value;
  for (let i1 = 0; i1 < res.length; i1++) {
    target.push(Object.assign(res[i1], {
      ext_key: `${(new Date().valueOf())}_${Math.random()}`,
    }));
  }
  list.value = target;
}


</script>

<template>
  <div class="fr_content view_log" ref="contentDOM">
    <div class="form">
      <label>
        <span>ID : </span><input type="text" v-model="queryData.id"/>
      </label>
      <label>
        <span>status : </span>
        <select v-model="queryData.status">
          <option v-for="(statusDef, key) in statusMap" :value="statusDef[0]" :key="key">
            {{ statusDef[1] }}
          </option>
        </select>
      </label>
      <label>
        <span>type : </span><input type="text" v-model="queryData.type"/>
      </label>
      <label>
        <button type="button" @click="go">query</button>
      </label>
    </div>
    <table>
      <tbody>
      <tr>
        <th>id</th>
        <th>type</th>
        <th>status</th>
        <th>time_create</th>
        <th>time_update</th>
        <th>payload</th>
      </tr>
      <tr
        v-for="row in list"
        :key="`log_view_${row.ext_key}`"
      >
        <td>{{ row.id }}</td>
        <td>{{ row.type }}</td>
        <td>
          <template v-if="false"></template>
          <template v-else-if="row.status===-2">unknown</template>
          <template v-else-if="row.status===-1">failed</template>
          <template v-else-if="row.status===0">success</template>
          <template v-else-if="row.status===1">waiting</template>
          <template v-else-if="row.status===2">working</template>
        </td>
        <td>{{ row.time_create }}</td>
        <td>{{ row.time_update }}</td>
        <td>{{ row.payload }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.fr_content.view_log {
  .form {
    $metaBk: map.get($colors, bar_meta);
    background-color: $metaBk;
    padding: 0 $fontSize * 0.5;
    //line-height: $fontSize * 1.5;
    label {
      margin-right: $fontSize;
      //height: $fontSize * 1.5;
      //line-height: $fontSize * 1.5;
      display: inline-block;
    }
    label * {
      font-size: $fontSize;
      height: $fontSize * 1.5;
      line-height: $fontSize * 1.5;
      vertical-align: unset;
    }
    input,
    button,
    select {
      background-color: $metaBk;
      padding: 0;
    }
  }
  table {
    width: 100%;
    th, td {
      font-size: $fontSize;
      padding: $fontSize*0.5;
      text-align: left;
    }
    th {
      font-size: $fontSize*1.5;
    }
    tr:hover {
      background-color: map.get($colors, bk_active);
    }
  }
}
</style>
<!---->
