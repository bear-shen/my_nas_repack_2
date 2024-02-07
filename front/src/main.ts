import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './App.vue'
import {router} from './router'

import './assets/basic.scss';
import '@/assets/fonts/sysIcon/iconfont.css';
import '@/assets/fonts/listIcon/iconfont.css';

import * as scrollLogStore from '@/persistenceStore/scrollLog';

scrollLogStore.init();

const app = createApp(App);

app.use(createPinia())
app.use(router)

app.mount('#app')

