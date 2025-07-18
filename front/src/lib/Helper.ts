import type {api_user_login_req, api_user_login_resp} from "../../share/Api";
import Config from "./Config";

import {useModalStore} from "@/stores/modalStore";
import {useUserStore} from "@/stores/userStore";


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
    path: string, data?: { [key: string]: any } | FormData,
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
            // console.info(res);
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
        xhr.open('POST', Config.apiPath + path);
        const userStore = useUserStore();
        const user = userStore.get();
        // const ifAuthed = localStorage.getItem('toshokan_auth_token');
        if (user && user.token) xhr.setRequestHeader('Auth-Token', user.token);
        xhr.send(formData);
    })
}

export function throwLogin() {
    console.info('throwLogin');
    const modalStore = useModalStore();
    modalStore.set({
        title: "login required",
        alpha: true,
        key: "",
        single: false,
        w: 360,
        h: 120,
        minW: 360,
        minH: 120,
        // h: 160,
        allow_resize: false,
        allow_move: true,
        allow_escape: false,
        allow_fullscreen: false,
        auto_focus: true,
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

                const userStore = useUserStore();
                userStore.set(res);
                // localStorage.setItem("toshokan_auth_token", res.token);
                // localStorage.setItem("toshokan_user", res.token);
                location.reload();
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
        allow_resize: false,
        allow_move: true,
        allow_escape: true,
        allow_fullscreen: false,
        auto_focus: true,
        text: msg,
        callback: {
            close: (modal) => {
            },
        },
    });
}

//@todo
export function print() {
    return;
    // const calee = (new Error('') as any).stack.split("\n")[2].trim().split(" ")[1];
    // console.info(calee, ...arguments);
    // console.info(calee.codePointAt(0)%8, ...arguments);
    // console.log("%cThis is a green text", "color:green");
}

export function mayTyping(target: HTMLElement | null | undefined) {
    if (!target) return false;
    let dom = target;
    while (true) {
        if (dom.tagName === 'BODY') return false;
        else if (dom.tagName === 'HTML') return false;
        else if (dom.tagName === 'TEXTAREA') return true;
        else if (dom.tagName === 'INPUT') {
            switch ((dom as HTMLInputElement).type) {
                case 'input':
                case 'date':
                case 'datetime':
                case 'datetime-local':
                case 'file':
                case 'number':
                case 'password':
                // case 'radio':
                case 'search':
                case 'text':
                case 'time':
                case 'tel':
                case 'url':
                    return true;
                    break;
            }
        } else if (dom.contentEditable && dom.contentEditable.toLowerCase() === 'true')
            return true;
        else if (!dom.parentElement) return false;
        dom = dom.parentElement as HTMLElement;
    }
    return false;
}

export function mayInPopup(target: HTMLElement | null | undefined) {
    if (!target) return false;
    let dom = target;
    while (true) {
        if (dom.classList.contains('modal_dom')) return true;
        else if (dom.tagName == 'BODY') return false;
        else if (dom.tagName == 'HTML') return false;
        else if (!dom.parentElement) return false;
        dom = dom.parentElement;
    }
    return false;
}
