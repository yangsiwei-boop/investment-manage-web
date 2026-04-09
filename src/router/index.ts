import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '控制台', icon: 'Monitor' },
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/user/UserListView.vue'),
        meta: { title: '用户列表', icon: 'User' },
      },
      {
        path: 'verification',
        name: 'Verification',
        component: () => import('@/views/verification/VerificationView.vue'),
        meta: { title: '实名审核', icon: 'Stamp' },
      },
      {
        path: 'permission',
        name: 'Permission',
        component: () => import('@/views/permission/PermissionView.vue'),
        meta: { title: '权限管理', icon: 'Lock' },
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/statistics/StatisticsView.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth !== false && !isAuthenticated()) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated()) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
