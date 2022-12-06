import {Modal as ModalConstructor, createModal, ModalCreatorConfig} from '../lib/ModalLib'

const demo = {
  title: 'this is title',
  alpha: false,
  //不可移动的不能调整大小
  movable: true,
  resizable: true,
  width: 320,
  height: 240,
  // text: 'this is content',
  form: [
    {
      name: 'a str',
      key: 'key0',
      value: 'a val',
      type: 'text',
    },
    {
      name: 'a str area',
      key: 'key1',
      value: 'a val',
      type: 'textarea',
    },
    {
      name: 'a date',
      key: 'key2',
      value: '',
      type: 'date',
    },
    {
      name: 'a datetime',
      key: 'key3',
      value: '',
      type: 'datetime',
    },
    {
      name: 'a checkbox',
      key: 'key4',
      value: false,
      type: 'checkbox',
    },
    {
      name: 'a radius',
      key: 'key5',
      value: 'a val',
      type: 'radio',
      extra: {
        multiple: false,
        data: {
          a: 'val a',
          b: 'val b',
          c: 'val c',
        },
      },
    },
    {
      name: 'a select',
      key: 'key6',
      value: 'a val',
      type: 'select',
      extra: {
        multiple: false,
        data: {
          a: 'val a',
          b: 'val b',
          c: 'val c',
        },
      },
    },
  ],
  component: {
    demo: {msg: 'props msg',},
  },
  callback: {
    submit: function (data: any, key: string): any {
      console.debug('submit');
      return true;
    },
    submit1: function (data: any, key: string): any {
      console.debug('submit1');
      return true;
    },
  },
} as ModalCreatorConfig;

export default demo;
