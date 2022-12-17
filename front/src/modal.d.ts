
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
    name: string;
    key: string;
    data: { [key: string]: any } | any;
}
export type ModalLayout = {
    x: number;
    y: number;
    w: number;
    h: number;
    minX: number;
    minY: number;
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
    component: Array<ModalComponentConstruct>
    callback: Array<ModalCallbackConstruct>;
}
export type ModalBase = {
    title: string;
    alpha: boolean;
    key: string;
    single: boolean;
};
export type Modal = {
    //nid的作用是映射map
    nid: number;
    base: ModalBase;
    layout: ModalLayout;
    content: ModalContent;
    event: {
        [eventName: string]: {
            //其实直接走meta里面的modal也行。。。
            [listenerKey: string]: (modal: Modal) => any,
        },
    }
    closed: boolean;
}