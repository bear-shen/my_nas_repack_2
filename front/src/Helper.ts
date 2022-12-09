export function queryDemo(
    path: string, data: { [key: string]: any } | FormData,
    smpData?: any, extra?: {
        upload: (e: ProgressEvent) => any
    }
): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        resolve(smpData);
    })
}

export function query(
    path: string, data: { [key: string]: any } | FormData,
    extra?: {
        upload: (e: ProgressEvent) => any
    }
): Promise<any> {
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
            if (xhr.status >= 400) reject(xhr.statusText);
            const res = JSON.parse(xhr.responseText);
            switch (res.code) {
                case 10:
                    throwLogin();
                    // throwError(`${res.code}:${res.msg}`);
                    resolve(false);
                    break;
                case 100:
                    throwError(`${res.code}:${res.msg}`);
                    resolve(false);
                    break;
                default:
                    resolve(res.data);
                    break;
            }
        };
        if (extra && extra.upload) xhr.upload.onprogress = extra.upload;
        xhr.open('POST', path);
        const ifAuthed = localStorage.getItem('toshokan_auth_token');
        if (ifAuthed) xhr.setRequestHeader('Auth-Token', ifAuthed);
        xhr.send(formData);
    })
};

export function throwLogin() {

}

export function throwError(msg: string) {
    console.info(msg);
}