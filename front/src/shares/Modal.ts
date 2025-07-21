import type {ModalConstruct, ModalStruct} from '@/types/modal';

const caller = {
    set: null,
    close: null,
} as { [key: string]: null | ((input: any) => any) };

function set(modal: ModalConstruct): ModalStruct {
    if (!caller.set) throw new Error('modal caller not defined');
    return caller.set(modal);
}

function close(key: string): ModalStruct {
    if (!caller.close) throw new Error('modal caller not defined');
    return caller.close(key);
}

//Popup.vue绑定用，处理事件
function handleEvent(type: keyof typeof caller, func: (val: any) => any) {
    return caller[type] = func;
}

function simpleMsg(title: string, message: string): ModalConstruct {
    return {
        title: title,
        text: message,
        w: 320,
        h: 100,
        minW: 320,
        minH: 100,
        allow_resize: false,
        callback: {
            confirm: async function (modal) {
            },
        },
    };
}

export {
    set,
    close,
    handleEvent,
    simpleMsg,
};
