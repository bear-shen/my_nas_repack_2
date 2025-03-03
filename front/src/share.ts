import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './share.vue'

import '@/assets/fonts/sysIcon/iconfont.css';
import '@/assets/fonts/listIcon/iconfont.css';
import '@/assets/basic.scss';
/*import {createRouter, createWebHashHistory, createWebHistory, type RouteRecordRaw} from 'vue-router'
//多入口的时候createWebHistory不好测试，干脆就直接用查询参数
//如果想好看的话到时候做个短连接什么的
const router = createRouter({
    history: createWebHistory(''),
    routes: [
        {
            path: '/share.html',
            component: () => import('@/views/empty.vue'),
        },
        /!*{
            path: '/:shareId',
            component: () => import('@/views/empty.vue'),
        },
        {
            path: '/:shareId/:nodeId',
            component: () => import('@/views/empty.vue'),
        },*!/
    ],
    strict:true
})*/

const app = createApp(App);

app.use(createPinia())
// app.use(router)

app.mount('#app')

