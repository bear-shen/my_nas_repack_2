import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './main.vue'
import {router} from './router'

import '@/assets/fonts/sysIcon/iconfont.css';
import '@/assets/fonts/listIcon/iconfont.css';
import '@/assets/basic.scss';

import * as kvStore from '@/IndexedKVStore';
kvStore.init();

const app = createApp(App);

app.use(createPinia())
app.use(router)

app.mount('#app')

