import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './router'

import './assets/basic.scss';
import '@/assets/fonts/sysIcon/iconfont.css';
import '@/assets/fonts/listIcon/iconfont.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
