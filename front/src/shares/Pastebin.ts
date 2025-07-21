import {ref, computed} from 'vue'
import type {Ref} from 'vue';
import type {api_file_mod_resp, api_file_mov_resp, api_node_col, api_setting_front_conf} from "../../../share/Api";
import {query} from "@/lib/Helper";

const nodeList = ref([] as api_node_col[]);
const mode: Ref<'cut' | 'copy'> = ref('copy');

async function doPaste(targetPid: number | string) {
    console.info(nodeList.value);
    if (!nodeList.value.length) return;
    const targetNodeIdSet = new Set<number>();
    nodeList.value.forEach(node => {
        targetNodeIdSet.add(node.id);
    });
    const targetNodeIdList = Array.from(targetNodeIdSet);
    const formData = new FormData();
    formData.set('id_node', `${targetNodeIdList.join(',')}`);
    formData.set('id_target', `${targetPid}`);
    let res = null;
    switch (mode.value) {
        case "copy":
            res = await query<api_file_mov_resp>('file/copy', formData);
            break;
        case "cut":
            res = await query<api_file_mov_resp>('file/mov', formData);
            break;
    }
    nodeList.value = [];
}

export {nodeList, mode, doPaste};
