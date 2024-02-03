import {defineStore} from 'pinia';
import type {ModalConstruct, ModalStruct} from '../modal';

let caller = {
    set: null,
    close: null,
} as { [key: string]: null | ((input: any) => any) };
export const useModalStore = defineStore('modalStore', () => {
    return {set: setModal, close: closeModal, handleEvent: handleEvent};
})

function setModal(modal: ModalConstruct): ModalStruct {
    return caller.set ? caller.set(modal) : null;
}

function closeModal(key: string): ModalStruct {
    return caller.close ? caller.close(key) : null;
}

function handleEvent(type: keyof typeof caller, func: (val: any) => any) {
    return caller[type] = func;
}