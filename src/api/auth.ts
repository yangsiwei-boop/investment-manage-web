import request from '@/utils/request'
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types'

// 用户登录 (文档 §2.1)
export function loginApi(data: LoginRequest) {
  return request.post<ApiResponse<LoginResponse>>('/auth/login', data)
}

// 刷新Token (文档 §2.3)
export function refreshTokenApi(refreshToken: string) {
  return request.post<ApiResponse>('/auth/refresh', { refreshToken })
}

// 修改密码 (文档 §2.4)
export function changePasswordApi(data: { oldPassword: string; newPassword: string }) {
  return request.post<ApiResponse>('/auth/password/change', data)
}

// 登出 (文档 §2.5)
export function logoutApi() {
  return request.post<ApiResponse>('/auth/logout')
}
