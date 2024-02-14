export default {
    apiPath: '/api/',
    fileTypes: [
        'text',
        'binary',
        'audio',
        'video',
        'image',
        'directory',
        'pdf',
    ],
    indexedDBName: 'tosho_db',
    timeouts:{
        sort: 50,
        selectEvt: 50,
        clearEvt: 100,
        //zzz
        scrollEvt: 100,
        scrollSave: 500,
        offsetDebounce: 50,
        // offsetUIDebounce: 500,
    },
}