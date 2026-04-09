<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getVerificationList, reviewVerification } from '@/api/verification'
import type { VerificationInfo } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
// 后端状态值是大写: PENDING, APPROVED, REJECTED
const activeTab = ref('PENDING')
const verifications = ref<VerificationInfo[]>([])
const counts = ref({ PENDING: 0, APPROVED: 0, REJECTED: 0 })

// 加载三个Tab的计数
async function loadCounts() {
  try {
    const [pending, approved, rejected] = await Promise.all([
      getVerificationList({ page: 1, size: 1, status: 'PENDING' }),
      getVerificationList({ page: 1, size: 1, status: 'APPROVED' }),
      getVerificationList({ page: 1, size: 1, status: 'REJECTED' }),
    ])
    counts.value.PENDING = pending.data.data.totalElements
    counts.value.APPROVED = approved.data.data.totalElements
    counts.value.REJECTED = rejected.data.data.totalElements
  } catch {
    // ignore
  }
}

async function loadVerifications() {
  loading.value = true
  try {
    const { data } = await getVerificationList({
      page: 1,
      size: 20,
      status: activeTab.value,
    })
    verifications.value = data.data.content
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCounts()
  loadVerifications()
})

function handleTabChange() {
  loadVerifications()
}

async function handleApprove(item: VerificationInfo) {
  try {
    await ElMessageBox.confirm(`确定通过 "${item.realName}" 的实名认证吗？`, '审核确认', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'success',
    })
    await reviewVerification(item.id, { approved: true, comment: '审核通过' })
    ElMessage.success('审核通过')
    loadCounts()
    loadVerifications()
  } catch {
    // cancelled
  }
}

async function handleReject(item: VerificationInfo) {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝审核', {
      confirmButtonText: '确定拒绝',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请说明拒绝原因...',
      inputValidator: (val: string) => (val ? true : '拒绝原因不能为空'),
    })
    await reviewVerification(item.id, { approved: false, comment: value })
    ElMessage.success('已拒绝')
    loadCounts()
    loadVerifications()
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

function getVerTypeLabel(type: string | null | undefined) {
  if (!type) return '未知'
  return type.toLowerCase() === 'investor' ? '投资人' : '融资用户'
}
</script>

<template>
  <div class="verification-page">
    <div class="page-header">
      <div>
        <h1>实名认证审核</h1>
        <p class="page-subtitle">审核用户提交的实名认证材料</p>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="verification-tabs" @tab-change="handleTabChange">
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
    <div class="verification-list" v-loading="loading">
      <div
        v-for="item in verifications"
        :key="item.id"
        class="verification-card"
        :style="{ borderLeftColor: getStatusColor(item.status) }"
      >
        <div class="card-header">
          <div class="user-info">
            <el-avatar :size="44" :style="{
              background: item.verificationType?.toLowerCase() === 'investor'
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : 'linear-gradient(135deg, #10b981, #059669)'
            }">
              {{ item.realName?.charAt(0) || '?' }}
            </el-avatar>
            <div class="user-detail">
              <div class="user-name">
                {{ item.realName }}
                <span class="company-name" v-if="item.phone">{{ item.phone }}</span>
              </div>
              <span class="type-badge type-badge--investor">
                {{ getVerTypeLabel(item.verificationType) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 身份证信息 -->
        <div class="document-grid">
          <div class="doc-item">
            <div class="doc-icon" :style="{ background: '#3b82f620', color: '#3b82f6' }">
              <el-icon :size="20"><Document /></el-icon>
            </div>
            <div class="doc-info">
              <span class="doc-label">身份证号</span>
              <span class="doc-status">{{ item.idCardNumber || '未提供' }}</span>
            </div>
          </div>
          <div class="doc-item">
            <div class="doc-icon" :style="{ background: '#10b98120', color: '#10b981' }">
              <el-icon :size="20"><Picture /></el-icon>
            </div>
            <div class="doc-info">
              <span class="doc-label">身份证正面</span>
              <span class="doc-status" :style="{ color: item.idCardFrontUrl ? '#10b981' : '#94a3b8' }">
                {{ item.idCardFrontUrl ? '已上传' : '未上传' }}
              </span>
            </div>
          </div>
          <div class="doc-item">
            <div class="doc-icon" :style="{ background: '#8b5cf620', color: '#8b5cf6' }">
              <el-icon :size="20"><PictureFilled /></el-icon>
            </div>
            <div class="doc-info">
              <span class="doc-label">身份证背面</span>
              <span class="doc-status" :style="{ color: item.idCardBackUrl ? '#10b981' : '#94a3b8' }">
                {{ item.idCardBackUrl ? '已上传' : '未上传' }}
              </span>
            </div>
          </div>
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
          <div class="meta-item" v-if="item.reviewerId">
            <span class="meta-label">审核人ID</span>
            <span class="meta-value">{{ item.reviewerId }}</span>
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

      <el-empty v-if="!loading && verifications.length === 0" description="暂无数据" />
    </div>
  </div>
</template>

<style scoped>
.verification-page {
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

.verification-tabs {
  margin: 20px 0;
}

.tab-badge {
  margin-left: 4px;
}

.verification-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.verification-card {
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

.company-name {
  font-weight: 400;
  font-size: 14px;
  color: #64748b;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.doc-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.doc-info {
  display: flex;
  flex-direction: column;
}

.doc-label {
  font-size: 13px;
  color: #475569;
}

.doc-status {
  font-size: 12px;
  font-weight: 500;
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
