import request from '@/utils/request'
import type { ApiResponse, RoleInfo, PermissionInfo } from '@/types'

export function getRoleList() {
  return request.get<ApiResponse<RoleInfo[]>>('/admin/roles')
}

export function getRoleDetail(id: number) {
  return request.get<ApiResponse<RoleInfo>>(`/admin/roles/${id}`)
}

export function createRole(data: Partial<RoleInfo>) {
  return request.post<ApiResponse<RoleInfo>>('/admin/roles', data)
}

export function updateRole(id: number, data: { roleCode?: string; roleName?: string; permissionIds?: number[] }) {
  return request.put<ApiResponse>(`/admin/roles/${id}`, data)
}

export function deleteRole(id: number) {
  return request.delete<ApiResponse>(`/admin/roles/${id}`)
}

export function getPermissionList() {
  return request.get<ApiResponse<PermissionInfo[]>>('/admin/permissions')
}
