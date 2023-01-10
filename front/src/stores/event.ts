import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
//
const evtLs = {
} as {
  [eventName: string]: Map<string, (data: any) => any>
};

export const useEventStore = defineStore('event', () => {
  return { trigger, listen, release };
})

function trigger(name: string, data: any) {
  if (!evtLs[name]) return;
  // console.info('trigger', evtLs[name], data);
  evtLs[name].forEach(f => f(data));
}
function listen(name: string, callback: (data: any) => any, key?: string): string {
  if (!evtLs[name]) evtLs[name] = new Map();
  if (!key) key = new Date().valueOf().toString(32) + Math.random().toString(32);
  evtLs[name].set(key, callback);
  return key;
}
function release(name: string, key: string) {
  if (!evtLs[name]) return;
  evtLs[name].delete(key);
  if (evtLs[name].size == 0) delete evtLs[name];
}