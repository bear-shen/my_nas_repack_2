import {defineStore} from 'pinia'
import type {contextListDef} from "@/context";

type triggerDef = (defLs: contextListDef, e: MouseEvent) => any;
let trigger: null | triggerDef = null;
export const useContextStore = defineStore('useContext', () => {
    return {
        register: registerContextTrigger,
        trigger: setContext,
    };
})

function registerContextTrigger(func: triggerDef) {
    trigger = func;
}

function setContext(defLs: contextListDef, e: MouseEvent) {
    if (!trigger) return;
    trigger(defLs, e);
}