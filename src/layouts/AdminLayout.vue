<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const sidebarCollapsed = ref(false)

const sidebarMenus = [
  {
    group: '概览',
    items: [
      { path: '/dashboard', title: '控制台', icon: 'Monitor' },
    ],
  },
  {
    group: '用户管理',
    items: [
      { path: '/users', title: '用户列表', icon: 'User' },
      { path: '/verification', title: '实名审核', icon: 'Stamp', badge: 12 },
      { path: '/permission', title: '权限管理', icon: 'Lock' },
    ],
  },
  {
    group: '系统管理',
    items: [
      { path: '/statistics', title: '数据统计', icon: 'DataAnalysis' },
    ],
  },
]

const displayName = computed(() => userStore.getDisplayName())

function handleCommand(command: string) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定退出登录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      userStore.clearAuth()
      router.push('/login')
    }).catch(() => {})
  }
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="admin-layout">
    <!-- 头部 -->
    <header class="admin-header">
      <div class="header-left">
        <button class="sidebar-toggle" @click="toggleSidebar">
          <el-icon :size="20"><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
        </button>
        <div class="logo">
          <span class="logo-text">投融资对接平台</span>
          <span class="logo-badge">后台管理</span>
        </div>
      </div>
      <div class="header-right">
        <el-badge :value="3" :max="99" class="notification-badge">
          <el-icon :size="20" class="header-icon"><Bell /></el-icon>
        </el-badge>
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-info">
            <el-avatar :size="32" class="user-avatar">{{ displayName.charAt(0) }}</el-avatar>
            <span class="user-name">{{ displayName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="password">修改密码</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="admin-body">
      <!-- 侧边栏 -->
      <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-menu">
          <div v-for="group in sidebarMenus" :key="group.group" class="menu-group">
            <div class="menu-group-title">{{ group.group }}</div>
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="menu-item"
              :class="{ active: route.path === item.path }"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span class="menu-title">{{ item.title }}</span>
              <el-badge v-if="item.badge" :value="item.badge" class="menu-badge" />
            </router-link>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 64px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.sidebar-toggle:hover {
  color: #ffffff;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.logo-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-icon {
  color: #94a3b8;
  cursor: pointer;
}

.header-icon:hover {
  color: #ffffff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #cbd5e1;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
}

.admin-body {
  margin-top: 64px;
  height: calc(100vh - 64px);
}

.admin-sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  transition: width 0.3s;
  position: fixed;
  top: 64px;
  bottom: 0;
  left: 0;
}

.admin-sidebar.collapsed {
  width: 0;
  overflow: hidden;
}

.admin-content {
  margin-left: 260px;
  min-height: calc(100vh - 64px);
  background: #f5f7fa;
  overflow-y: auto;
  transition: margin-left 0.3s;
}

.admin-sidebar.collapsed + .admin-content,
.admin-body:has(.admin-sidebar.collapsed) .admin-content {
  margin-left: 0;
}

.sidebar-menu {
  padding: 16px 0;
}

.menu-group {
  margin-bottom: 8px;
}

.menu-group-title {
  padding: 8px 24px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  position: relative;
}

.menu-item:hover {
  background: #f8fafc;
  color: #1e293b;
}

.menu-item.active {
  background: #f5f3ff;
  color: #667eea;
  font-weight: 500;
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 0 2px 2px 0;
}

.menu-badge {
  margin-left: auto;
}

.notification-badge {
  line-height: 1;
}
</style>
