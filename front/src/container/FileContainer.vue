<script setup lang="ts">
import { watch } from "vue";
import {
  useRouter,
  useRoute,
  type RouteRecordRaw,
  type RouteLocationNormalizedLoaded,
} from "vue-router";
import { routes } from "../router/index";
import { onMounted } from "vue";
const router = useRouter();
const route = useRoute();
defineProps<{
  msg: string;
}>();
onMounted(() => {
  console.info();
});
let curContainer: RouteRecordRaw | null = null;
watch(route, async (to: RouteLocationNormalizedLoaded) => {
  console.info(to.path, routes);
  routes.forEach((r) => {
    if (r.path !== to.path) return;
    curContainer = r;
    console.info(curContainer.name, curContainer.component);
  });
});
</script>

<template>
  <div class="fr_content">this is file container</div>
</template>

<style scoped></style>
