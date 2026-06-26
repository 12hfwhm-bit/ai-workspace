import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    requiresAuth?: boolean
    roles?: Array<'admin' | 'user'>
    icon?: string
    hidden?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/login/RegisterView.vue'),
    meta: { title: '注册', requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '数据看板', icon: 'Odometer' },
      },
      {
        path: 'customer',
        name: 'CustomerList',
        component: () => import('@/views/customer/CustomerList.vue'),
        meta: { title: '客户列表', icon: 'User' },
      },
      {
        path: 'customer/:id',
        name: 'CustomerDetail',
        component: () => import('@/views/customer/CustomerDetail.vue'),
        meta: { title: '客户详情', hidden: true },
      },
      {
        path: 'project',
        name: 'ProjectList',
        component: () => import('@/views/project/ProjectList.vue'),
        meta: { title: '项目列表', icon: 'List' },
      },
      {
        path: 'project/:id',
        name: 'ProjectDetail',
        component: () => import('@/views/project/ProjectDetail.vue'),
        meta: { title: '项目详情', hidden: true },
      },
      {
        path: 'ai/form',
        name: 'AIFormGenerator',
        component: () => import('@/views/ai/AIFormGenerator.vue'),
        meta: { title: 'AI 表单生成', icon: 'Document' },
      },
      {
        path: 'ai/analyze',
        name: 'AIDataAnalysis',
        component: () => import('@/views/ai/AIDataAnalysis.vue'),
        meta: { title: 'AI 数据分析', icon: 'DataAnalysis' },
      },
      {
        path: 'ai/document',
        name: 'AIDocumentAssist',
        component: () => import('@/views/ai/AIDocumentAssist.vue'),
        meta: { title: 'AI 文档助手', icon: 'Reading' },
      },
      {
        path: 'ai/history',
        name: 'AIHistory',
        component: () => import('@/views/ai/AIHistory.vue'),
        meta: { title: 'AI 历史记录', icon: 'Clock' },
      },
      {
        path: 'form-request',
        name: 'ApprovalList',
        component: () => import('@/views/approval/ApprovalList.vue'),
        meta: { title: '审批管理', roles: ['admin'] },
      },
      {
        path: 'form-request/:id',
        name: 'ApprovalDetail',
        component: () => import('@/views/approval/ApprovalDetail.vue'),
        meta: { title: '审批详情', hidden: true, roles: ['admin'] },
      },
      {
        path: 'settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: '系统设置' },
        redirect: '/settings/account',
        children: [
          {
            path: 'users',
            name: 'UserManagement',
            component: () => import('@/views/settings/UserManagement.vue'),
            meta: { title: '用户管理', roles: ['admin'] },
          },
          {
            path: 'ai',
            name: 'AiConfig',
            component: () => import('@/views/settings/AiConfig.vue'),
            meta: { title: 'AI 配置', roles: ['admin'] },
          },
          {
            path: 'account',
            name: 'AccountSettings',
            component: () => import('@/views/settings/AccountSettings.vue'),
            meta: { title: '账号设置' },
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { title: '页面不存在', requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── 导航守卫 ──────────────────────────────────────────
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const token = userStore.token || localStorage.getItem('token')

  // 已登录且去登录页 → 跳 Dashboard
  if ((to.path === '/login' || to.path === '/register') && token) {
    return next('/dashboard')
  }

  // 需要认证但无 Token → 跳登录
  if (to.meta.requiresAuth && !token) {
    ElMessage.warning('请先登录')
    return next('/login')
  }

  // 角色权限检查
  const requiredRoles = to.meta.roles
  if (requiredRoles && token) {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const role = JSON.parse(userInfo).role
      if (!requiredRoles.includes(role)) {
        ElMessage.error('无权限访问该页面')
        return next('/dashboard')
      }
    }
  }

  next()
})

export default router
