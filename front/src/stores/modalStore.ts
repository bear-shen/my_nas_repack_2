import {defineStore} from 'pinia';
import type {ModalConstruct, ModalStruct} from '@/types/modal';

let caller = {
    set: null,
    close: null,
} as { [key: string]: null | ((input: any) => any) };

export const useModalStore = defineStore('modalStore', () => {
    return {
        set: setModal, close: closeModal, handleEvent: handleEvent,
        simpleMsg,
    };
})

function setModal(modal: ModalConstruct): ModalStruct {
    if(!caller.set)throw new Error('modal caller not defined');
    return caller.set(modal);
}

function closeModal(key: string): ModalStruct {
    if(!caller.close)throw new Error('modal caller not defined');
    return caller.close(key);
}

function handleEvent(type: keyof typeof caller, func: (val: any) => any) {
    return caller[type] = func;
}

function simpleMsg(title:string, message:string): ModalConstruct {
    return {
        title: title,
        text: message,
        w: 320,
        h: 100,
        minW: 320,
        minH: 100,
        allow_resize: false,
        callback: {
            confirm: async function (modal) {
            },
        },
    };
}
