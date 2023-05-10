<script setup lang="ts">
// import { defineProps } from "vue";
import {useRouter, useRoute, type RouteRecordRaw} from "vue-router";
import {type routes} from "../router";
// const props = defineProps(["depth", "records"]);
const props = defineProps({
  depth: Number,
  records: Object,
});
const depth = props.depth ? props.depth : 1;
const records = props.records as RouteRecordRaw[];
const router = useRouter();
const route = useRoute();

async function go(route: RouteRecordRaw) {
  console.info('go', route);
  const res = await router.push(route.path);
  console.info(res);
}
</script>

<template>
  <template v-for="(record, index) in records" :key="index">
    <template v-if="!record.meta?.hide">
      <p
        @click="go(record)"
        :class="{ title: true, active: record.path === route.path }"
      >
        <span :class="['icon', 'sysIcon', record.meta?.icon]"></span>
        <!-- <span v-if="!frameworkStore.$state.fold">{{ record.name }}</span> -->
        <span class="content">{{ record.name }}</span>
      </p>
      <!--折叠影响排版，所以干脆先不显示-->
      <!-- <sub-content
        v-if="
          !frameworkStore.$state.fold &&
          record.children &&
          record.children.length
        "
        :records="record.children"
        :depth="depth + 1"
      ></sub-content> -->
      <!--<navi-content
                  v-if="record.children && record.children.length"
                  :records="record.children"
                  :depth="depth+1"
                ></navi-content>-->
    </template>
  </template>
</template>

<style scoped lang="scss"></style>
