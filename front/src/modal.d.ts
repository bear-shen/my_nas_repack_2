import type {DefineComponent} from "vue";

//return true to keep
export type ModalCallbackFunc = (modal: ModalStruct) => Promise<true | any> | void;

export type ModalFormConstruct<K> = {
    type: 'text' | 'textarea' | 'date' | 'datetime' | 'checkbox' | 'radio' | 'select';
    label: string;
    key: string;
    value?: K;
    options?: { [key: string]: string };
    default?: K;
    multiple?: boolean;
    disabled?: boolean;
}
export type ModalComponentConstruct = {
    // name: string;
    key?: string;
    // component: DefineComponent;
    componentName: string;
    data?: { [key: string]: any } | any;
}
export type ModalLayout = {
    x: number;
    y: number;
    w: number;
    h: number;
    // minX: number;
    // minY: number;
    minW: number;
    minH: number;
    //
    resizable: boolean;
    movable: boolean;
    //
    active: boolean;
    index: number;
    fullscreen: boolean;
}
export type ModalContent = {
    text: string;
    form: Array<ModalFormConstruct>;
    component: Array<ModalComponentConstruct>;
};
export type ModalBase = {
    title: string;
    alpha: boolean;
    key: string;
    single: boolean;
};
export type ModalCallbackConstruct = {
    key: string;
    name: string;
    func: ModalCallbackFunc;
}
    ;
export type ModalStruct = {
    //nid的作用是映射map
    nid: string;
    base: ModalBase;
    layout: ModalLayout;
    content: ModalContent;
    callback: Array<ModalCallbackConstruct>;
    closed: boolean;
}
export type ModalConstruct = {
    // base
    title: string;
    alpha?: boolean | false;
    key?: string;
    single?: boolean | false;
    // layout
    w?: number | 400;
    h?: number | 160;
    // minX: number;
    // minY: number;
    minW?: number | 320;
    minH?: number | 160;
    resizable?: boolean | true;
    movable?: boolean | true;
    fullscreen?: boolean | false;
    // content
    text?: string;
    form?: Array<ModalFormConstruct> | ModalFormConstruct;
    component?:
        Array<ModalComponentConstruct | string>
        | ModalComponentConstruct
        | string;
    // callback
    callback?: Array<ModalCallbackConstruct | ModalCallbackFunc>
        | ModalCallbackConstruct
        | ModalCallbackFunc
        | { [key: string]: ModalCallbackFunc };
}

// base ?: ModalBase;
// layout ?: ModalLayout;
// content ?: ModalContent
//     | Array<ModalComponentConstruct>
//     | ModalComponentConstruct
//     | Array<ModalFormConstruct>
//     | ModalFormConstruct
//     | string;
// callback ?: Array<ModalCallbackConstruct>
//     | ModalCallbackConstruct
//     | ((modal: ModalConstruct) => any)
//     | { [key: string]: ((modal: ModalConstruct) => any) };