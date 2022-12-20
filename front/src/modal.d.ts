import type { DefineComponent } from "vue";

export type ModalFormConstruct<K> = {
    type?: 'text' | 'textarea' | 'date' | 'datetime' | 'checkbox' | 'radio' | 'select';
    label?: string;
    key?: string;
    value?: K;
    options?: { [key: string]: string };
    default?: K;
    multiple?: boolean;
    disabled?: boolean;
}
export type ModalComponentConstruct = {
    name?: string;
    key?: string;
    component?: DefineComponent;
    data?: { [key: string]: any } | any;
}
export type ModalLayout = {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    // minX?: number;
    // minY?: number;
    minW?: number;
    minH?: number;
    //
    resizable?: boolean;
    movable?: boolean;
    //
    active?: boolean;
    index?: number;
    fullscreen?: boolean;
}
export type ModalContent = {
    text?: string;
    form?: Array<ModalFormConstruct> | ModalFormConstruct;
    component?: Array<ModalComponentConstruct> | ModalComponentConstruct;
}
    | Array<ModalComponentConstruct> | ModalComponentConstruct
    | Array<ModalFormConstruct> | ModalFormConstruct
    | string;
export type ModalBase = {
    title?: string;
    alpha?: boolean;
    key?: string;
    single?: boolean;
};
export type ModalCallbackConstruct = {
    key?: string;
    name?: string;
    event?: (modal: ModalConstruct) => any;
} | ((modal: ModalConstruct) => any)
    | { [key: string]: ((modal: ModalConstruct) => any) }
    ;
export type ModalConstruct = {
    //nid的作用是映射map
    nid?: number;
    base?: ModalBase;
    layout?: ModalLayout;
    content?: ModalContent;
    callback?: Array<ModalCallbackConstruct> | ModalCallbackConstruct;
    closed?: boolean;
}