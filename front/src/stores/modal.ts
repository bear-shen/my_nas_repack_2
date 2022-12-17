import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
export const useModalStore = defineStore('modalStore', () => {
  const list = [];

  return { list };
})
function setModal() { }
function handleEvent() { }