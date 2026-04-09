<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { getUserList, updateUserStatus, deleteUser } from '@/api/user'
import type { UserInfo } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const users = ref<UserInfo[]>([])
const total = ref(0)

// 筛选条件（前端本地过滤，后端status/userType筛选有类型转换问题暂不用）
const filterUserType = ref('')
const filterStatus = ref('')
const filterKeyword = ref('')

const params = reactive({
  page: 1,
  size: 10,
  keyword: '',
})

// 后端返回的数据全量，前端做二次过滤
const allUsers = ref<UserInfo[]>([])

async function loadUsers() {
  loading.value = true
  try {
    const { data } = await getUserList({ page: 1, size: 9999, keyword: params.keyword })
    allUsers.value = data.data.content
    applyFilters()
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  let filtered = [...allUsers.value]
  if (filterUserType.value) {
    filtered = filtered.filter(u => u.userType === filterUserType.value)
  }
  if (filterStatus.value) {
    filtered = filtered.filter(u => u.status === filterStatus.value)
  }
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    filtered = filtered.filter(u =>
      (u.nickname && u.nickname.toLowerCase().includes(kw)) ||
      (u.realName && u.realName.toLowerCase().includes(kw)) ||
      u.phone.includes(kw)
    )
  }
  total.value = filtered.length
  const start = (params.page - 1) * params.size
  users.value = filtered.slice(start, start + params.size)
}

onMounted(loadUsers)

function handleSearch() {
  params.keyword = filterKeyword.value
  params.page = 1
  loadUsers()
}

function handleFilterChange() {
  params.page = 1
  applyFilters()
}

function handlePageChange(page: number) {
  params.page = page
  applyFilters()
}

function handleSizeChange(size: number) {
  params.size = size
  params.page = 1
  applyFilters()
}

function handleReset() {
  filterUserType.value = ''
  filterStatus.value = ''
  filterKeyword.value = ''
  params.keyword = ''
  params.page = 1
  loadUsers()
}

async function handleStatusChange(user: UserInfo, newStatus: string) {
  const actionMap: Record<string, string> = {
    ACTIVE: '启用',
    BANNED: '禁用',
    PENDING: '批准',
  }
  const label = user.nickname || user.realName || user.phone
  try {
    await ElMessageBox.confirm(`确定要${actionMap[newStatus]}用户 "${label}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await updateUserStatus(user.id, { status: newStatus })
    ElMessage.success(`${actionMap[newStatus]}成功`)
    loadUsers()
  } catch {
    // cancelled
  }
}

async function handleDelete(user: UserInfo) {
  const label = user.nickname || user.realName || user.phone
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${label}" 吗？此操作不可恢复。`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUser(user.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch {
    // cancelled
  }
}

function getTypeBadgeClass(type: string) {
  return `type-badge type-badge--${type.toLowerCase()}`
}

function getStatusBadgeClass(status: string) {
  // 后端返回大写，CSS用小写
  return `status-badge status-badge--${status.toLowerCase()}`
}

function getVerifyBadgeClass(verified: boolean) {
  return `status-badge status-badge--${verified ? 'verified' : 'unverified'}`
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: '活跃', PENDING: '待审核', INACTIVE: '未激活', BANNED: '已禁用',
  }
  return map[status] || status
}

function getUserLabel(user: UserInfo) {
  return user.nickname || user.realName || user.phone
}

function formatDateTime(dt: string | null | undefined) {
  if (!dt) return '从未'
  return dt.substring(0, 16).replace('T', ' ')
}

const viewUser = ref<UserInfo | null>(null)
const viewDialogVisible = ref(false)

function handleView(user: UserInfo) {
  viewUser.value = user
  viewDialogVisible.value = true
}

function handleEdit(user: UserInfo) {
  viewUser.value = user
  viewDialogVisible.value = true
}
</script>

<template>
  <div class="user-list-page">
    <div class="page-header">
      <div>
        <h1>用户管理</h1>
        <p class="page-subtitle">查看和管理平台所有用户</p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">用户类型：</span>
        <el-radio-group v-model="filterUserType" @change="handleFilterChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="INVESTOR">投资人</el-radio-button>
          <el-radio-button value="ENTREPRENEUR">融资用户</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-group">
        <span class="filter-label">账号状态：</span>
        <el-radio-group v-model="filterStatus" @change="handleFilterChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="ACTIVE">活跃</el-radio-button>
          <el-radio-button value="PENDING">待审核</el-radio-button>
          <el-radio-button value="BANNED">已禁用</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-actions">
        <el-input
          v-model="filterKeyword"
          placeholder="搜索用户名、手机号..."
          clearable
          style="width: 260px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
          </template>
        </el-input>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 用户表格 -->
    <div class="table-wrapper">
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column label="用户" width="80">
          <template #default="{ row }">
            <el-avatar :size="36" :style="{ background: row.userType === 'INVESTOR' ? '#3b82f6' : '#ec4899' }">
              {{ getUserLabel(row).charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" min-width="200">
          <template #default="{ row }">
            <div class="user-contact">
              <strong>{{ getUserLabel(row) }}</strong>
              <span>{{ row.email || row.phone }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <span :class="getTypeBadgeClass(row.userType)">
              {{ row.userType === 'INVESTOR' ? '投资人' : row.userType === 'ENTREPRENEUR' ? '融资用户' : row.userType }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="getStatusBadgeClass(row.status)">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="实名认证" width="100">
          <template #default="{ row }">
            <span :class="getVerifyBadgeClass(row.isVerified)">
              {{ row.isVerified ? '已认证' : '未认证' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.lastLoginAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'ACTIVE'">
              <el-tooltip content="查看" placement="top"><el-button type="primary" link size="small" @click="handleView(row)"><el-icon><View /></el-icon></el-button></el-tooltip>
              <el-tooltip content="编辑" placement="top"><el-button type="primary" link size="small" @click="handleEdit(row)"><el-icon><Edit /></el-icon></el-button></el-tooltip>
              <el-tooltip content="禁用" placement="top"><el-button type="danger" link size="small" @click="handleStatusChange(row, 'BANNED')"><el-icon><CloseBold /></el-icon></el-button></el-tooltip>
            </template>
            <template v-else-if="row.status === 'PENDING'">
              <el-tooltip content="批准" placement="top"><el-button type="success" link size="small" @click="handleStatusChange(row, 'ACTIVE')"><el-icon><Select /></el-icon></el-button></el-tooltip>
              <el-tooltip content="查看" placement="top"><el-button type="primary" link size="small" @click="handleView(row)"><el-icon><View /></el-icon></el-button></el-tooltip>
              <el-tooltip content="删除" placement="top"><el-button type="danger" link size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon></el-button></el-tooltip>
            </template>
            <template v-else>
              <el-tooltip content="启用" placement="top"><el-button type="success" link size="small" @click="handleStatusChange(row, 'ACTIVE')"><el-icon><Select /></el-icon></el-button></el-tooltip>
              <el-tooltip content="查看" placement="top"><el-button type="primary" link size="small" @click="handleView(row)"><el-icon><View /></el-icon></el-button></el-tooltip>
              <el-tooltip content="删除" placement="top"><el-button type="danger" link size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon></el-button></el-tooltip>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="params.page"
        v-model:page-size="params.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="viewDialogVisible" title="用户详情" width="520px">
      <template v-if="viewUser">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ viewUser.id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ viewUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ viewUser.nickname || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ viewUser.realName || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ viewUser.email || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">
            <span :class="getTypeBadgeClass(viewUser.userType)">
              {{ viewUser.userType === 'INVESTOR' ? '投资人' : viewUser.userType === 'ENTREPRENEUR' ? '融资用户' : viewUser.userType }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="账号状态">
            <span :class="getStatusBadgeClass(viewUser.status)">{{ getStatusLabel(viewUser.status) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="实名认证">
            <span :class="getVerifyBadgeClass(viewUser.isVerified)">{{ viewUser.isVerified ? '已认证' : '未认证' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDateTime(viewUser.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ formatDateTime(viewUser.lastLoginAt) }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-list-page {
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

.filter-bar {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #64748b;
  white-space: nowrap;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.table-wrapper {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.user-contact {
  display: flex;
  flex-direction: column;
}

.user-contact strong {
  font-size: 14px;
  color: #1e293b;
}

.user-contact span {
  font-size: 13px;
  color: #64748b;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
