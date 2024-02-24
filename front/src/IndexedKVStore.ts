import Config from "@/Config";

const storeNameLs = [
    'scroll_log',
    'image_rotate',
];

export let req: IDBOpenDBRequest | null = null;
export let db: IDBDatabase | null = null;

// export let store: IDBObjectStore | null = null;

export function init() {
    // return;
    req = window.indexedDB.open(Config.indexedDBName, 4);
    req.onupgradeneeded = buildStore;
    req.onerror = (evt) => {
        // console.info('onerror', evt);
    };
    // req.onblocked = (evt) => {
    //     console.info('onblocked', evt);
    // };
    req.onsuccess = (evt) => {
        // console.info('onsuccess', evt);
        db = evt.target.result;
        // const transaction: IDBTransaction = db.transaction([storeName], 'readwrite');
        // store = transaction.objectStore(storeName);
        // console.info(store);
    };
    // console.info('init', req);
}

function buildStore(evt: IDBVersionChangeEvent) {
    console.info('onupgradeneeded', evt);
    return new Promise(resolve => {
        // console.info(evt);
        db = evt.target.result;
        rmAll(db);
        // db.transaction('versionchange');
        // const transaction = req.transaction().oncomplete = (ev) => {
        //     console.info(ev);
        let cmpCount = 0;
        for (let i1 = 0; i1 < storeNameLs.length; i1++) {
            const storeName = storeNameLs[i1];
            const store = db.createObjectStore(storeName, {
                // autoIncrement: true,
                keyPath: 'key',
            });
            // store.createIndex('index', 'key', {
            //     unique: true,
            // });
            // };
            store.transaction.oncomplete = (evt: Event) => {
                cmpCount += 1;
                if (cmpCount == storeNameLs.length - 1) resolve();
                // resolve();
            }
        }
    })
}

//直接删掉旧的
function rmAll(db: IDBDatabase) {
    // return new Promise(resolve => {
    // let cmpCount = 0;
    if (!db) return;
    const curLs = db?.objectStoreNames;
    if (!curLs) return;
    for (let i1 = 0; i1 < curLs.length; i1++) {
        db.deleteObjectStore(curLs[i1]);
    }
    // });
}

export function get(storeName: string, key: string | number) {
    // console.info('get', db);
    return new Promise(resolve => {
        if (!db) return resolve(null);
        // if (!store) return;
        // console.info(db);
        // console.info(storeName, key);
        const req = db.transaction([storeName], 'readonly')
            .objectStore(storeName)
            .get(key);
        req.onerror = (evt: Event) => {
            // console.info('onerror', evt);
            return resolve(null);
        };
        req.onsuccess = (evt: Event) => {
            // console.info('onsuccess', evt);
            if (!evt.target.result)
                return resolve(null);
            return resolve(evt.target.result.val);
        };
    });
}

export function set(storeName: string, key: string | number, val: any) {
    return new Promise(resolve => {
        if (!db) return resolve(null);
        // if (!store) return;
        // console.info(db);
        const req = db.transaction([storeName], 'readwrite')
            .objectStore(storeName)
            .put({key: key, val: val});
        req.onerror = (evt: Event) => {
            // console.info('onerror', evt);
            return resolve(null);
        };
        req.onsuccess = (evt: Event) => {
            // console.info('onsuccess', evt);
            return resolve(null);
        };
    })
}

// setTimeout(async () => {
//     await get('devKey');
//     await set('dev', {s: 1, a: 1});
// }, 1000 * 5)