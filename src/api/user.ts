import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse, UserInfo, UserFilterParams, UpdateUserStatusRequest } from '@/types'

// 获取用户列表 (文档 §18.2)
export function getUserList(params: UserFilterParams) {
  return request.get<ApiResponse<PaginatedResponse<UserInfo>>>('/admin/users', { params })
}

// 更新用户状态 (文档 §18.3)
export function updateUserStatus(userId: number, data: UpdateUserStatusRequest) {
  return request.put<ApiResponse>(`/admin/users/${userId}/status`, data)
}

// 删除用户
export function deleteUser(userId: number) {
  return request.delete<ApiResponse>(`/admin/users/${userId}`)
}
