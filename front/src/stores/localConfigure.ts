import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
const configurePrefix = 'tosho_config_';
export const useLocalConfigureStore = defineStore('localConfigure', () => {
  let data: { [name: string]: any } = ref({});
  const listener: {
    [name: string]:
    Map<string, (data: any) => any>
  } = {};
  function get(name: string) {
    // console.info(data);
    name = configurePrefix + name;
    if (data[name]) return data[name];
    const ifStore = localStorage.getItem(name);
    if (!ifStore) return null;
    try {
      data[name] = JSON.parse(ifStore);
    } catch (error) {
      data[name] = null;
    }
    return data[name];
  }
  function listen(name: string, on: (to: any) => any, key?: string) {
    name = configurePrefix + name;
    if (!key) key = new Date().valueOf().toString();
    if (!listener[name]) listener[name] = new Map();
    listener[name].set(key, on);
    return key;
  }
  function release(name: string, key: string) {
    if (!listener[name]) return;
    listener[name].delete(key);
    if (listener[name].size == 0) delete listener[name];
  }
  function set(key: string, val: any) {
    // console.info('set', key, val);
    key = configurePrefix + key;
    data[key] = val;
    if (listener[key]) listener[key].forEach(f => f(val));
    localStorage.setItem(key, JSON.stringify(val));
  }
  return { get, set, listen, release }
})
