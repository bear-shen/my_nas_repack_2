<script setup lang="ts">
import type {Ref} from "vue";
// import {routes} from "@/router/index";
import {onMounted, onUnmounted, ref} from "vue";
import {onBeforeRouteUpdate, useRoute, useRouter,} from "vue-router";
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {query} from "@/Helper";
import GenFunc from "../../../share/GenFunc";
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
  // id: "",
  // keyword: "",
  // is_del: "",
} as api_queue_list_req;
const list: Ref<settingType[]> = ref([]);
onMounted(async () => {
  Object.assign(queryData, GenFunc.copyObject(route.query));
  getList();
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
});

async function getList() {
  // console.info('getGroup');
  // groupList.value = [];
  const res = await query<api_queue_list_resp>("log/get", queryData);
  if (!res) return;
  const target: settingType[] = [];
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
    <table>
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
    </table>
  </div>
</template>

<style lang="scss">
.fr_content.view_log {
  table {
    th, td {
      font-size: $fontSize;
      padding: $fontSize*0.5;
      text-align: left;
    }
    th {
      font-size: $fontSize*1.5;
    }
    tr:hover {
      background-color: map-get($colors, bk_active);
    }
  }
}
</style>
<!---->