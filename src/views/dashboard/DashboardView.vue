<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboard } from '@/api/statistics'
import type { DashboardData } from '@/types'

const router = useRouter()
const stats = ref<DashboardData | null>(null)
const loading = ref(true)
const showAlert = ref(true)

onMounted(async () => {
  try {
    const { data } = await getDashboard()
    stats.value = data.data
  } finally {
    loading.value = false
  }
})

const statCards = [
  { key: 'totalUsers', label: '总用户数', color: '#667eea', icon: 'User' },
  { key: 'investorCount', label: '投资人', color: '#3b82f6', icon: 'Briefcase' },
  { key: 'entrepreneurCount', label: '融资用户', color: '#ec4899', icon: 'OfficeBuilding' },
  { key: 'pendingVerificationCount', label: '待审核', color: '#f59e0b', icon: 'Clock' },
]

const quickActions = [
  { title: '用户管理', desc: '查看和管理平台所有用户，包括投资人和融资用户', icon: 'User', color: '#3b82f6', path: '/users' },
  { title: '实名审核', desc: '审核用户的实名认证材料，包括名片和营业执照', icon: 'Stamp', color: '#10b981', path: '/verification' },
  { title: '申请审核', desc: '处理投资人提交的BP获取和联系申请', icon: 'Document', color: '#f59e0b', path: '/verification' },
  { title: '数据统计', desc: '查看平台运营数据和用户活跃度统计', icon: 'DataAnalysis', color: '#8b5cf6', path: '/statistics' },
]

</script>

<template>
  <div class="dashboard-page" v-loading="loading">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <h2>欢迎回来，管理员</h2>
        <p>这是您的管理控制台，您可以在这里管理平台的所有用户和内容</p>
      </div>
      <div class="stat-cards">
        <div v-for="card in statCards" :key="card.key" class="stat-card">
          <div class="stat-icon" :style="{ background: card.color + '20', color: card.color }">
            <el-icon :size="24"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats?.[card.key as keyof DashboardData] ?? 0 }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 待处理提醒 -->
    <div class="alert-box" v-if="showAlert">
      <div class="alert-content">
        <el-icon :size="20" class="alert-icon"><WarningFilled /></el-icon>
        <div class="alert-text">
          <strong>待处理提醒</strong>
          <p>您有 {{ stats?.pendingVerificationCount ?? 0 }} 个实名认证申请、{{ stats?.pendingApplicationCount ?? 0 }} 个BP获取申请待审核，请及时处理。</p>
        </div>
      </div>
      <div class="alert-actions">
        <el-button type="primary" size="small" @click="router.push('/verification')">立即处理</el-button>
        <el-button size="small" @click="showAlert = false">稍后处理</el-button>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="section-title">快速操作</div>
    <div class="quick-actions">
      <div v-for="action in quickActions" :key="action.title" class="action-card" @click="router.push(action.path)">
        <div class="action-icon" :style="{ background: action.color }">
          <el-icon :size="28" color="#fff"><component :is="action.icon" /></el-icon>
        </div>
        <div class="action-info">
          <h3>{{ action.title }}</h3>
          <p>{{ action.desc }}</p>
        </div>
        <el-icon class="action-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="section-title">最近活动</div>
    <div class="activity-list">
      <el-empty description="暂无最近活动" />
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: 32px 40px;
}

.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: #ffffff;
  margin-bottom: 24px;
}

.welcome-text h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.welcome-text p {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 24px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  font-size: 13px;
  opacity: 0.8;
}

.stat-trend {
  margin-left: auto;
  font-size: 13px;
  font-weight: 500;
}

.stat-trend.up {
  color: #86efac;
}

.stat-trend.down {
  color: #fca5a5;
}

.alert-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-left: 4px solid #ef4444;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  color: #ef4444;
}

.alert-text strong {
  font-size: 14px;
  color: #1e293b;
}

.alert-text p {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.action-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.action-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-info h3 {
  font-size: 15px;
  color: #1e293b;
  margin-bottom: 4px;
}

.action-info p {
  font-size: 13px;
  color: #64748b;
}

.action-arrow {
  margin-left: auto;
  color: #cbd5e1;
}

.activity-list {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  font-size: 14px;
  color: #475569;
}

.activity-content strong {
  color: #1e293b;
  margin-right: 8px;
}

.activity-time {
  font-size: 13px;
  color: #94a3b8;
  flex-shrink: 0;
}
</style>
