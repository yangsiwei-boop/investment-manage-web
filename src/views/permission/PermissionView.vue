<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getRoleList, getRoleDetail, updateRole, createRole, deleteRole } from '@/api/role'
import type { RoleInfo, PermissionInfo, RoleUser } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const roles = ref<RoleInfo[]>([])
const selectedRole = ref<RoleInfo | null>(null)
const permissions = ref<PermissionInfo[]>([])
const roleUsers = ref<RoleUser[]>([])

const roleIcons: Record<string, string> = {
  investor: '💼',
  entrepreneur: '🏢',
  vip_investor: '⭐',
  admin: '🔧',
  disabled: '🚫',
}

const newRoleDialog = ref(false)
const newRoleForm = reactive({
  roleName: '',
  roleCode: '',
  description: '',
})

onMounted(async () => {
  await loadRoles()
})

async function loadRoles() {
  loading.value = true
  try {
    const { data } = await getRoleList()
    roles.value = data.data
    if (roles.value.length > 0 && !selectedRole.value) {
      selectRole(roles.value[0])
    }
  } finally {
    loading.value = false
  }
}

async function selectRole(role: RoleInfo) {
  selectedRole.value = role
  try {
    const { data } = await getRoleDetail(role.id)
    const detail = data.data
    permissions.value = detail.permissions || []
    roleUsers.value = detail.users || []
  } catch {
    permissions.value = []
    roleUsers.value = []
  }
}

function getPermissionGroups() {
  const viewPerms = permissions.value.filter((_, i) => i < 4)
  const actionPerms = permissions.value.filter((_, i) => i >= 4 && i < 8)
  const restrictPerms = permissions.value.filter((_, i) => i >= 8)
  return [
    { title: '查看权限', items: viewPerms },
    { title: '操作权限', items: actionPerms },
    { title: '限制权限', items: restrictPerms },
  ]
}

async function handlePermissionChange(perm: PermissionInfo, enabled: boolean) {
  perm.isEnabled = enabled
}

async function handleSave() {
  if (!selectedRole.value) return
  try {
    await updateRole(selectedRole.value.id, {
      permissions: permissions.value.map(p => ({ ...p })),
    })
    ElMessage.success('保存成功')
  } catch {
    // handled by interceptor
  }
}

async function handleCreateRole() {
  try {
    await createRole(newRoleForm)
    ElMessage.success('角色创建成功')
    newRoleDialog.value = false
    newRoleForm.roleName = ''
    newRoleForm.roleCode = ''
    newRoleForm.description = ''
    loadRoles()
  } catch {
    // handled
  }
}

async function handleDeleteRole() {
  if (!selectedRole.value || selectedRole.value.isSystem) {
    ElMessage.warning('系统角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除角色 "${selectedRole.value.roleName}" 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteRole(selectedRole.value.id)
    ElMessage.success('删除成功')
    selectedRole.value = null
    loadRoles()
  } catch {
    // cancelled
  }
}

async function handleRemoveUser(user: RoleUser) {
  ElMessage.info(`已移除用户 ${user.realName}`)
}
</script>

<template>
  <div class="permission-page">
    <div class="page-header">
      <div>
        <h1>权限管理</h1>
        <p class="page-subtitle">管理用户角色和功能权限</p>
      </div>
      <el-button type="primary" @click="newRoleDialog = true">
        <el-icon><Plus /></el-icon> 新建角色
      </el-button>
    </div>

    <div class="permission-layout" v-loading="loading">
      <!-- 左侧角色列表 -->
      <div class="role-panel">
        <div class="panel-title">角色列表</div>
        <div class="role-list">
          <div
            v-for="role in roles"
            :key="role.id"
            class="role-item"
            :class="{ active: selectedRole?.id === role.id }"
            @click="selectRole(role)"
          >
            <div class="role-icon">{{ roleIcons[role.roleCode] || '📋' }}</div>
            <div class="role-info">
              <div class="role-name">{{ role.roleName }}</div>
              <div class="role-count">{{ role.usersCount }}人</div>
            </div>
            <div class="role-desc">{{ role.description }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧权限详情 -->
      <div class="detail-panel" v-if="selectedRole">
        <div class="detail-header">
          <h2>{{ selectedRole.roleName }} - 权限配置</h2>
          <span class="role-desc-tag">{{ selectedRole.description }}</span>
        </div>

        <!-- 权限组 -->
        <div v-for="group in getPermissionGroups()" :key="group.title" class="permission-group">
          <div class="group-title">{{ group.title }}</div>
          <div class="permission-list">
            <div v-for="perm in group.items" :key="perm.id" class="permission-item">
              <span class="perm-name">{{ perm.permissionName }}</span>
              <el-switch v-model="perm.isEnabled" @change="(val: boolean) => handlePermissionChange(perm, val)" />
            </div>
          </div>
        </div>

        <!-- 角色中的用户 -->
        <div class="users-section">
          <div class="group-title">角色中的用户</div>
          <p class="users-tip">共{{ selectedRole.usersCount }}人，显示前20人</p>
          <div class="user-tags">
            <el-tag
              v-for="user in roleUsers"
              :key="user.id"
              closable
              @close="handleRemoveUser(user)"
              class="user-tag"
            >
              {{ user.realName }}
            </el-tag>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <el-button type="primary" @click="handleSave">保存更改</el-button>
          <el-button @click="">复制角色</el-button>
          <el-button type="danger" @click="handleDeleteRole" :disabled="selectedRole.isSystem">删除角色</el-button>
        </div>
      </div>

      <el-empty v-else description="请选择左侧角色查看权限配置" />
    </div>

    <!-- 新建角色弹窗 -->
    <el-dialog v-model="newRoleDialog" title="新建角色" width="480px">
      <el-form :model="newRoleForm" label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="newRoleForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码">
          <el-input v-model="newRoleForm.roleCode" placeholder="请输入角色代码，如 reviewer" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="newRoleForm.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.permission-page {
  padding: 32px 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
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

.permission-layout {
  display: flex;
  gap: 24px;
  min-height: 500px;
}

.role-panel {
  width: 350px;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.panel-title {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
}

.role-list {
  max-height: 600px;
  overflow-y: auto;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.role-item:hover {
  background: #f8fafc;
}

.role-item.active {
  background: #f5f3ff;
  border-left: 3px solid #667eea;
}

.role-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 10px;
  flex-shrink: 0;
}

.role-info {
  flex: 1;
  min-width: 0;
}

.role-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.role-count {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.role-desc {
  font-size: 12px;
  color: #94a3b8;
  text-align: right;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
}

.detail-header {
  margin-bottom: 24px;
}

.detail-header h2 {
  font-size: 18px;
  color: #1e293b;
  margin-bottom: 8px;
}

.role-desc-tag {
  font-size: 13px;
  color: #64748b;
}

.permission-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.permission-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.perm-name {
  font-size: 14px;
  color: #475569;
}

.users-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.users-tip {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-tag {
  font-size: 13px;
}

.detail-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 8px;
}
</style>
