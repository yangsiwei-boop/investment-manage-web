<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getApplicationList, reviewApplication } from '@/api/application'
import type { ApplicationInfo } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const activeTab = ref('PENDING')
const applications = ref<ApplicationInfo[]>([])
const counts = ref({ PENDING: 0, APPROVED: 0, REJECTED: 0 })

// 加载三个Tab的计数
async function loadCounts() {
  try {
    const [pending, approved, rejected] = await Promise.all([
      getApplicationList({ page: 1, size: 1, status: 'PENDING' }),
      getApplicationList({ page: 1, size: 1, status: 'APPROVED' }),
      getApplicationList({ page: 1, size: 1, status: 'REJECTED' }),
    ])
    counts.value.PENDING = pending.data.data.totalElements
    counts.value.APPROVED = approved.data.data.totalElements
    counts.value.REJECTED = rejected.data.data.totalElements
  } catch {
    // ignore
  }
}

async function loadApplications() {
  loading.value = true
  try {
    const { data } = await getApplicationList({
      page: 1,
      size: 20,
      status: activeTab.value,
    })
    applications.value = data.data.content
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCounts()
  loadApplications()
})

function handleTabChange() {
  loadApplications()
}

async function handleApprove(item: ApplicationInfo) {
  try {
    await ElMessageBox.confirm(
      `确定通过 "${item.applicantName}" 对 "${item.projectName}" 的BP获取申请吗？`,
      '审核确认',
      { confirmButtonText: '通过', cancelButtonText: '取消', type: 'success' }
    )
    await reviewApplication(item.id, { approved: true, comment: '审核通过' })
    ElMessage.success('审核通过')
    loadCounts()
    loadApplications()
  } catch {
    // cancelled
  }
}

async function handleReject(item: ApplicationInfo) {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝审核', {
      confirmButtonText: '确定拒绝',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请说明拒绝原因...',
      inputValidator: (val: string) => (val ? true : '拒绝原因不能为空'),
    })
    await reviewApplication(item.id, { approved: false, comment: value })
    ElMessage.success('已拒绝')
    loadCounts()
    loadApplications()
  } catch {
    // cancelled
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: '#f59e0b',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
  }
  return colors[status] || '#64748b'
}
</script>

<template>
  <div class="application-page">
    <div class="page-header">
      <div>
        <h1>BP申请审核</h1>
        <p class="page-subtitle">审核投资人提交的BP获取申请</p>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="application-tabs" @tab-change="handleTabChange">
      <el-tab-pane name="PENDING">
        <template #label>
          <span>待审核 <el-badge v-if="counts.PENDING" :value="counts.PENDING" class="tab-badge" /></span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="APPROVED">
        <template #label>
          <span>已通过 <el-badge v-if="counts.APPROVED" :value="counts.APPROVED" class="tab-badge" type="success" /></span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="REJECTED">
        <template #label>
          <span>已拒绝 <el-badge v-if="counts.REJECTED" :value="counts.REJECTED" class="tab-badge" type="danger" /></span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 审核卡片列表 -->
    <div class="application-list" v-loading="loading">
      <div
        v-for="item in applications"
        :key="item.id"
        class="application-card"
        :style="{ borderLeftColor: getStatusColor(item.status) }"
      >
        <div class="card-header">
          <div class="user-info">
            <el-avatar :size="44" :style="{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }">
              {{ item.applicantName?.charAt(0) || '?' }}
            </el-avatar>
            <div class="user-detail">
              <div class="user-name">
                {{ item.applicantName || '未知用户' }}
                <span class="user-phone" v-if="item.applicantPhone">{{ item.applicantPhone }}</span>
              </div>
              <span class="project-badge">申请获取：{{ item.projectName }}</span>
            </div>
          </div>
        </div>

        <!-- 项目信息 -->
        <div class="info-grid">
          <div class="info-item">
            <div class="info-icon" :style="{ background: '#3b82f620', color: '#3b82f6' }">
              <el-icon :size="20"><OfficeBuilding /></el-icon>
            </div>
            <div class="info-content">
              <span class="info-label">所属公司</span>
              <span class="info-value">{{ item.projectCompanyName || '未提供' }}</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon" :style="{ background: '#10b98120', color: '#10b981' }">
              <el-icon :size="20"><Coin /></el-icon>
            </div>
            <div class="info-content">
              <span class="info-label">所属行业</span>
              <span class="info-value">{{ item.projectIndustry || '未提供' }}</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon" :style="{ background: '#8b5cf620', color: '#8b5cf6' }">
              <el-icon :size="20"><TrendCharts /></el-icon>
            </div>
            <div class="info-content">
              <span class="info-label">融资阶段</span>
              <span class="info-value">{{ item.projectStage || '未提供' }}</span>
            </div>
          </div>
        </div>

        <!-- 申请理由 -->
        <div class="apply-reason" v-if="item.applyReason">
          <span class="reason-label">申请理由</span>
          <p class="reason-text">{{ item.applyReason }}</p>
        </div>

        <!-- 元数据 -->
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">提交时间</span>
            <span class="meta-value">{{ item.createdAt?.substring(0, 16).replace('T', ' ') }}</span>
          </div>
          <div class="meta-item" v-if="item.status !== 'PENDING'">
            <span class="meta-label">{{ item.status === 'APPROVED' ? '审核时间' : '拒绝时间' }}</span>
            <span class="meta-value">{{ item.reviewedAt?.substring(0, 16).replace('T', ' ') }}</span>
          </div>
          <div class="meta-item" v-if="item.reviewComment">
            <span class="meta-label">审核意见</span>
            <span class="meta-value" :style="{ color: item.status === 'REJECTED' ? '#ef4444' : '' }">{{ item.reviewComment }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="card-actions">
          <template v-if="item.status === 'PENDING'">
            <el-button type="success" @click="handleApprove(item)">通过审核</el-button>
            <el-button type="danger" plain @click="handleReject(item)">拒绝</el-button>
          </template>
          <template v-else-if="item.status === 'REJECTED'">
            <el-button type="primary" @click="handleApprove(item)">重新审核</el-button>
          </template>
        </div>
      </div>

      <el-empty v-if="!loading && applications.length === 0" description="暂无数据" />
    </div>
  </div>
</template>

<style scoped>
.application-page {
  padding: 32px 40px;
}

.page-header h1 {
  font-size: 22px;
  color: #1e293b;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
}

.application-tabs {
  margin: 20px 0;
}

.tab-badge {
  margin-left: 4px;
}

.application-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.application-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid;
  padding: 24px;
}

.card-header {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-phone {
  font-weight: 400;
  font-size: 14px;
  color: #64748b;
}

.project-badge {
  font-size: 13px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 10px;
  border-radius: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 13px;
  color: #475569;
}

.info-value {
  font-size: 12px;
  font-weight: 500;
}

.apply-reason {
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 20px;
}

.reason-label {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  display: block;
  margin-bottom: 6px;
}

.reason-text {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.6;
  margin: 0;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 12px;
  color: #94a3b8;
}

.meta-value {
  font-size: 13px;
  color: #475569;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}
</style>
