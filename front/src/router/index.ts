import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'Directory',
    component: HomeView,
    meta: { icon: 'sysIcon_folderopen', },
    children: [
      {
        path: '/favourite',
        name: 'Favourite',
        component: HomeView,
        meta: { icon: 'sysIcon_star-o', },
      },
      {
        path: '/recycle',
        name: 'Recycle',
        component: HomeView,
        meta: { icon: 'sysIcon_delete', },
      },
    ],
  },
  {
    path: '/media',
    name: 'Media',
    component: HomeView,
    meta: { icon: 'sysIcon_star-o', },
  },
  {
    path: '/tag',
    name: 'Tag',
    component: HomeView,
    meta: { icon: 'sysIcon_tagso', },
  },
  {
    path: '/group',
    name: 'User',
    component: HomeView,
    meta: { icon: 'sysIcon_team', },
  },
  {
    path: '/local',
    name: 'Local',
    component: HomeView,
    meta: { icon: 'sysIcon_yingpan1', },
  },
  {
    path: '/setting',
    name: 'Setting',
    component: HomeView,
    meta: { icon: 'sysIcon_setting', },
  },
];
//

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export { router, routes };
