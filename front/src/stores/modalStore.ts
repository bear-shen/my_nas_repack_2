import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ModalConstruct } from '../modal';

let caller = {
  set: null,
  close: null,
} as { [key: string]: null | ((input: any) => any) };
export const useModalStore = defineStore('modalStore', () => {
  return { set: setModal, close: closeModal, handleEvent };
})
function setModal(modal: ModalConstruct) {
  caller.set ? caller.set(modal) : null;
}
function closeModal(id: string) {
  caller.close ? caller.close(id) : null;
}
function handleEvent(type: keyof typeof caller, func: (val: any) => any) {
  caller[type] = func;
}