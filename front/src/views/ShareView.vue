<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/shares/localConfigure";
import {query} from "@/lib/Helper";
import GenFunc from "@/lib/GenFunc";
import type {
  api_queue_col, api_queue_list_req, api_queue_list_resp,
  api_share_list_req, api_share_list_resp,
} from "../../../share/Api";
// import {useModalStore} from "@/shares/modalStore";

type settingType = api_share_list_resp & {
  ext_key?: string,
};
//
const localConfigure = useLocalConfigureStore();
// const modalStore = useModalStore();
const contentDOM: Ref<HTMLElement | null> = ref(null);
const router = useRouter();
const route = useRoute();
let queryData = {
  status: '',
} as api_queue_list_req;
const list: Ref<settingType[]> = ref([]);
onMounted(async () => {
  Object.assign(queryData, GenFunc.copyObject(route.query));
  getList();
  if (contentDOM.value)
    contentDOM.value.addEventListener('scroll', scrollEvt);
});

onBeforeRouteUpdate(async (to) => {
  console.info(to);
  // queryData.id = to.query.id ?? '';
  // queryData.keyword = to.query.keyword as string ?? '';
  // queryData.is_del = to.query.is_del as string ?? '';
  getList();
});

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
  if (clear) curPage = 1;
  // console.info('getGroup');
  // groupList.value = [];
  const res = await query<api_share_list_resp[]>("share/list",
    Object.assign(
      {page: curPage}, queryData
    ));
  curPage += 1;
  loading = false;
  if (!res) return;
  if (!res.length) {
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

async function delShare(id: number) {
  const res = await query<api_share_list_resp[]>("share/del",
    {id: id}
  );
  await getList(true);
}

</script>

<template>
  <div class="fr_content view_share" ref="contentDOM">
    <table>
      <tbody>
      <tr>
        <th>id</th>
        <th>user</th>
        <th>path</th>
        <th>time_create<br>time_to</th>
        <th>operate</th>
      </tr>
      <tr
        v-for="row in list"
        :key="`share_view_${row.ext_key}`"
      >
        <td>
          <a :href="`./share.html?id=${row.id}`" target="_blank">{{ row.id }}</a>
        </td>
        <td>{{ row.user.name }}</td>
        <td>
          <div class="multi">
            <p v-for="node in row.node" :key="`share_view_${row.ext_key}_${node.id}`">
              {{ node.node_path }}/{{ node.title }}
            </p>
          </div>
        </td>
        <td>
          {{ row.time_create }}
          <br>
          <template v-if="false"></template>
          <template v-else-if="row.status===0">Stopped</template>
          <template v-else-if="row.status===1">{{ row.time_to }}</template>
          <template v-else-if="row.status===2">Long</template>
        </td>
        <td>
          <button
            v-if="row.status!==0"
            class="sysIcon sysIcon_delete"
            @click="delShare(row.id)"
          >Delete
          </button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss">
@use "sass:map";
@use '@/assets/variables.scss' as *;
.fr_content.view_share {
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
      line-height: 1.5em;
      padding: $fontSize*0.5;
      text-align: left;
    }
    th {
      font-size: $fontSize*1.5;
    }
    tr:hover {
      background-color: map.get($colors, bk_active);
    }
    td {
      font-size: $fontSize;
    }
  }
  .multi {
    max-height: $fontSize*6;
    overflow: auto;
    //text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
<!---->
