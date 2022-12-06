import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
const configurePrefix = 'tosho_config_';
export const useLocalConfigureStore = defineStore('localConfigure', () => {
  let data: { [key: string]: any } = ref({});
  const listener: { [key: string]: ((to: any) => any)[] } = {};
  function get(key: string) {
    console.info(data);
    key = configurePrefix + key;
    if (data[key]) return data[key];
    const ifStore = localStorage.getItem(key);
    if (!ifStore) return null;
    data[key] = JSON.parse(ifStore);
    return data[key];
  }
  function watch(key: string, on: (to: any) => any) {
    key = configurePrefix + key;
    if (!listener[key]) listener[key] = [];
    listener[key].push(on);
  }
  function set(key: string, val: any) {
    key = configurePrefix + key;
    data[key] = val;
    if (listener[key]) listener[key].forEach(f => f(val));
    localStorage.setItem(key, JSON.stringify(val));
  }
  return { get, set, watch }
})
