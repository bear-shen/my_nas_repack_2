import type {contextListDef} from "@/types/context";

type triggerDef = (defLs: contextListDef, e: MouseEvent) => any;
let triggerCallback: null | triggerDef = null;


function register(func: triggerDef) {
    triggerCallback = func;
}

function trigger(defLs: contextListDef, e: MouseEvent) {
    if (!triggerCallback) return;
    triggerCallback(defLs, e);
}

export {
    register,
    trigger,
};
