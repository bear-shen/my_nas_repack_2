import {defineStore} from 'pinia'
import type {api_user_login_resp} from "../../../share/Api";

const configureKey = 'tosho_user';

export type sessionType = api_user_login_resp;
export const useUserStore = defineStore('userStore', () => {
    let data: null | sessionType = null;

    function get() {
        if (data) return data;
        // console.info(data);
        const ifStore = localStorage.getItem(configureKey);
        if (!ifStore) return null;
        try {
            data = JSON.parse(ifStore);
        } catch (error) {
            data = null;
        }
        return data;
    }

    function set(val: null | sessionType) {
        // console.info('set', key, val);
        data = val;
        localStorage.setItem(configureKey, JSON.stringify(val));
        return val;
    }

    return {get, set}
})
