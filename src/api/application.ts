import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse, ApplicationInfo, ApplicationReviewRequest } from '@/types'

// 获取BP申请列表
export function getApplicationList(params: { page: number; size: number; status?: string }) {
  return request.get<ApiResponse<PaginatedResponse<ApplicationInfo>>>('/admin/applications', { params })
}

// 获取BP申请详情
export function getApplicationDetail(applicationId: number) {
  return request.get<ApiResponse<ApplicationInfo>>(`/admin/applications/${applicationId}`)
}

// 审核BP申请
export function reviewApplication(applicationId: number, data: ApplicationReviewRequest) {
  return request.post<ApiResponse>(`/admin/applications/${applicationId}/review`, data)
}
