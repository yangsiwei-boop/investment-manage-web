<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { getRoleList, updateRole, createRole, deleteRole } from '@/api/role'
import type { RoleInfo, PermissionInfo } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const roles = ref<RoleInfo[]>([])
const selectedRole = ref<RoleInfo | null>(null)

const roleIcons: Record<string, string> = {
  admin: '🔧',
  investor: '💼',
  entrepreneur: '🏢',
  guest: '📋',
}

const newRoleDialog = ref(false)
const newRoleForm = reactive({
  roleName: '',
  roleCode: '',
  description: '',
})

onMounted(loadRoles)

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

function selectRole(role: RoleInfo) {
  selectedRole.value = role
}

// 按 module 分组权限
const permissionGroups = computed(() => {
  if (!selectedRole.value?.permissions) return []
  const groupMap = new Map<string, PermissionInfo[]>()
  for (const perm of selectedRole.value.permissions) {
    const mod = perm.module || '其他'
    if (!groupMap.has(mod)) groupMap.set(mod, [])
    groupMap.get(mod)!.push(perm)
  }
  const moduleLabels: Record<string, string> = {
    user: '用户管理',
    project: '项目管理',
    teaser: 'Teaser管理',
    application: '申请管理',
    qa: '问答管理',
    admin: '后台管理',
  }
  return Array.from(groupMap.entries()).map(([mod, items]) => ({
    key: mod,
    title: moduleLabels[mod] || mod,
    items,
  }))
})

async function handlePermissionChange(perm: PermissionInfo, enabled: boolean) {
  perm.isEnabled = enabled
}

async function handleSave() {
  if (!selectedRole.value) return
  try {
    await updateRole(selectedRole.value.id, {
      permissions: selectedRole.value.permissions.map(p => ({ ...p })),
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
              <div class="role-count">{{ role.permissions?.length || 0 }} 个权限</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧权限详情 -->
      <div class="detail-panel" v-if="selectedRole">
        <div class="detail-header">
          <h2>{{ selectedRole.roleName }} - 权限配置</h2>
          <span class="role-desc-tag">{{ selectedRole.description }}</span>
        </div>

        <!-- 按 module 分组展示权限 -->
        <div v-for="group in permissionGroups" :key="group.key" class="permission-group">
          <div class="group-title">{{ group.title }}</div>
          <div class="permission-list">
            <div v-for="perm in group.items" :key="perm.id" class="permission-item">
              <div class="perm-info">
                <span class="perm-name">{{ perm.permissionName }}</span>
                <span class="perm-desc">{{ perm.description }}</span>
              </div>
              <el-switch v-model="perm.isEnabled" @change="(val: boolean) => handlePermissionChange(perm, val)" />
            </div>
          </div>
        </div>

        <el-empty v-if="permissionGroups.length === 0" description="该角色暂无权限配置" />

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <el-button type="primary" @click="handleSave">保存更改</el-button>
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
  width: 300px;
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
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
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

.perm-info {
  display: flex;
  flex-direction: column;
}

.perm-name {
  font-size: 14px;
  color: #475569;
}

.perm-desc {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.detail-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 8px;
}
</style>
