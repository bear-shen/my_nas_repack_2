import type {type_file} from "../../share/Database";

export default {
    apiPath: '/api/',
    fileType: [
        'any',
        'directory',
        'file',
        'audio',
        'video',
        'image',
        'binary',
        'text',
        'pdf'
    ],
    indexedDBName: 'tosho_db',
    timeouts: {
        sort: 50,
        selectEvt: 50,
        clearEvt: 100,
        //zzz
        scrollEvt: 100,
        scrollSave: 500,
        offsetDebounce: 50,
        // offsetUIDebounce: 500,
    },
    sort: {
        id_asc: 'id ↑',
        id_desc: 'id ↓',
        name_asc: 'name ↑',
        name_desc: 'name ↓',
        crt_asc: 'crt time ↑',
        crt_desc: 'crt time ↓',
        upd_asc: 'upd time ↑',
        upd_desc: 'upd time ↓',
        rate_asc: 'rate ↑',
        rate_desc: 'rate ↓'
    },
    rate: {
        '0': '&#xe69f;&#xe69f;&#xe69f;&#xe69f;&#xe69f;',
        '1': '&#xe6b6;&#xe69f;&#xe69f;&#xe69f;&#xe69f;',
        '2': '&#xe69e;&#xe69f;&#xe69f;&#xe69f;&#xe69f;',
        '3': '&#xe69e;&#xe6b6;&#xe69f;&#xe69f;&#xe69f;',
        '4': '&#xe69e;&#xe69e;&#xe69f;&#xe69f;&#xe69f;',
        '5': '&#xe69e;&#xe69e;&#xe6b6;&#xe69f;&#xe69f;',
        '6': '&#xe69e;&#xe69e;&#xe69e;&#xe69f;&#xe69f;',
        '7': '&#xe69e;&#xe69e;&#xe69e;&#xe6b6;&#xe69f;',
        '8': '&#xe69e;&#xe69e;&#xe69e;&#xe69e;&#xe69f;',
        '9': '&#xe69e;&#xe69e;&#xe69e;&#xe69e;&#xe6b6;',
        '10': '&#xe69e;&#xe69e;&#xe69e;&#xe69e;&#xe69e;'
    },
    //v☆◐◧※
    rateMobile: {
        '0': '☆☆☆☆☆',
        '1': '※☆☆☆☆',
        '2': '★☆☆☆☆',
        '3': '★※☆☆☆',
        '4': '★★☆☆☆',
        '5': '★★※☆☆',
        '6': '★★★☆☆',
        '7': '★★★※☆',
        '8': '★★★★☆',
        '9': '★★★★※',
        '10': '★★★★★'
    },
    listType: ['detail', 'text', 'img'],
    playMode: [
        /*"queue",*/ "loop", "single", "shuffle"
    ],
    ignoreFileType: [
        'directory',
        'subtitle',
    ] as type_file[],
}