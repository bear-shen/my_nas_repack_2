import {ref, computed} from 'vue'
import type {Ref} from 'vue';
import {defineStore} from 'pinia'
import type {api_node_col} from "../../../share/Api";

const nodeList = ref([] as api_node_col[]);
const mode: Ref<'cut' | 'copy'> = ref('copy');

export const usePastebinStore = defineStore('counter', () => {
    return {nodeList, mode, doPaste};
});

function doPaste(targetPid: number | string) {
    if (!nodeList.value.length) return;
    const targetNodeSet = new Set<number>();
    nodeList.value.forEach(node => {
        targetNodeSet.add(node.id);
    });
    const targetNodeList = Array.from(targetNodeSet);

    nodeList.value = [];
}
