import type { api_user_login_req, api_user_login_resp } from "../../share/Api";
import FrontConfig from "./FrontConfig";

import { useModalStore } from "@/stores/modalStore";

export function queryDemo<K>(
    path: string, data: { [key: string]: any } | FormData,
    smpData?: any, extra?: {
        upload: (e: ProgressEvent) => any
    }
): Promise<K | false> {
    return new Promise<any>((resolve, reject) => {
        resolve(smpData);
    })
}

export function query<K>(
    path: string, data: { [key: string]: any } | FormData,
    extra?: {
        upload: (e: ProgressEvent) => any
    }
): Promise<K | false> {
    return new Promise<any>((resolve, reject) => {
        let formData: FormData;
        if (data instanceof FormData) {
            formData = data;
            // } else if (data) {
        } else {
            formData = new FormData();
            for (const dataKey in data) {
                if (!Object.prototype.hasOwnProperty.call(data, dataKey)) continue;
                formData.append(dataKey, data[dataKey]);
            }
        }
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            if (xhr.status >= 400)
                return throwError(`${xhr.status}:${xhr.statusText}`);
            const res = JSON.parse(xhr.responseText);
            switch (res.code) {
                case 10:
                    throwLogin();
                    // throwError(`${res.code}:${res.msg}`);
                    resolve(false);
                    break;
                case 100:
                    // throwError(`${res.code}:${res.msg}`);
                    throwError(res.msg);
                    resolve(false);
                    break;
                default:
                    resolve(res.data);
                    break;
            }
        };
        if (extra && extra.upload) xhr.upload.onprogress = extra.upload;
        xhr.open('POST', FrontConfig.apiPath + path);
        const ifAuthed = localStorage.getItem('toshokan_auth_token');
        if (ifAuthed) xhr.setRequestHeader('Auth-Token', ifAuthed);
        xhr.send(formData);
    })
};

export function throwLogin() {
    const modalStore = useModalStore();
    modalStore.set({
        title: "login required",
        alpha: true,
        key: "",
        single: false,
        w: 360,
        h: 100,
        minW: 360,
        minH: 100,
        // h: 160,
        resizable: true,
        movable: false,
        fullscreen: false,
        form: [
            {
                type: "text",
                label: "username",
                key: "username",
            },
            {
                type: "text",
                label: "password",
                key: "password",
            },
        ],
        callback: {
            login: async function (modal) {
                console.info(modal);
                const res = await query<api_user_login_resp>("user/login", {
                    username: modal.content.form[0].value,
                    password: modal.content.form[1].value,
                } as api_user_login_req);
                if (!res) return true;
                localStorage.setItem("toshokan_auth_token", res.token);
            },
        },
    });
}

export function throwError(msg: string) {
    // console.info(msg);
    const modalStore = useModalStore();
    modalStore.set({
        title: "error",
        alpha: false,
        key: "",
        single: false,
        w: 360,
        h: 100,
        minW: 360,
        minH: 100,
        // h: 160,
        resizable: false,
        movable: false,
        fullscreen: false,
        text: msg,
        callback: {
            close: (modal) => { },
        },
    });
}