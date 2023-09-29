import FileView_N from '@/views/FileView_N.vue';
import FileView_R from '@/views/FileView_R.vue';
import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import LocalView from '../views/LocalView.vue'
import TagView from '../views/TagView.vue'
import UserView from '../views/UserView.vue'
import SettingView from "@/views/SettingView.vue";
import LogView from "@/views/LogView.vue";

const routes = [
    {
        path: '/',
        name: 'Directory',
        component: FileView_N,
        meta: {icon: 'sysIcon_folderopen',},
        // children: [
        // ],
    },
    // {
    //     path: '/favourite',
    //     name: 'Favourite',
    //     component: FileView_F,
    //     meta: {icon: 'sysIcon_star-o',},
    // },
    {
        path: '/recycle',
        name: 'Recycle',
        component: FileView_R,
        meta: {icon: 'sysIcon_delete',},
    },
    {
        path: '/tag',
        name: 'Tag',
        component: TagView,
        meta: {icon: 'sysIcon_tagso',},
    },
    {
        path: '/group',
        name: 'User',
        component: UserView,
        meta: {icon: 'sysIcon_team',},
    },
    {
        path: '/local',
        name: 'Local',
        component: LocalView,
        meta: {icon: 'sysIcon_yingpan1',},
    },
    {
        path: '/log',
        name: 'ProcessLog',
        component: LogView,
        meta: {icon: 'sysIcon_filetext',},
    },
    {
        path: '/setting',
        name: 'Setting',
        component: SettingView,
        meta: {icon: 'sysIcon_setting',},
    },
] as RouteRecordRaw[];
//

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
})

export {router, routes};
