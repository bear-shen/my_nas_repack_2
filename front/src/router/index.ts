import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Directory',
        component: () => import('@/views/FileView_N.vue'),
        meta: {
            icon: 'sysIcon_folderopen',
            deny_user: false,
            deny_guest: false,
        },
        // children: [
        // ],
    },
    {
        path: '/favourite',
        name: 'Favourite',
        component: () => import('@/views/Favourite.vue'),
        meta: {
            icon: 'sysIcon_star-o',
            deny_user: false,
            deny_guest: true,
        },
    },
    {
        path: '/recycle',
        name: 'Recycle',
        component: () => import('@/views/FileView_R.vue'),
        meta: {
            icon: 'sysIcon_delete',
            deny_user: false,
            deny_guest: true,
        },
    },
    {
        path: '/tag',
        name: 'Tag',
        component: () => import('@/views/TagView.vue'),
        meta: {
            icon: 'sysIcon_tagso',
            deny_user: false,
            deny_guest: true,
        },
    },
    {
        path: '/group',
        name: 'User',
        component: () => import('@/views/UserView.vue'),
        meta: {
            icon: 'sysIcon_team',
            deny_user: true,
            deny_guest: true,
        },
    },
    {
        path: '/local',
        name: 'Local',
        component: () => import('@/views/LocalView.vue'),
        meta: {
            icon: 'sysIcon_yingpan1',
            deny_user: true,
            deny_guest: true,
        },
    },
    {
        path: '/log',
        name: 'ProcessLog',
        component: () => import('@/views/LogView.vue'),
        meta: {
            icon: 'sysIcon_filetext',
            deny_user: true,
            deny_guest: true,
        },
    },
    {
        path: '/setting',
        name: 'Setting',
        component: () => import('@/views/SettingView.vue'),
        meta: {
            icon: 'sysIcon_setting',
            deny_user: true,
            deny_guest: true,
        },
    },
] as RouteRecordRaw[];
//

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
})

export {router, routes};
