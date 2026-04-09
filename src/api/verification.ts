import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse, VerificationInfo, VerificationReviewRequest } from '@/types'

// 获取认证列表 (文档 §18.4)
export function getVerificationList(params: { page: number; size: number; status?: string }) {
  return request.get<ApiResponse<PaginatedResponse<VerificationInfo>>>('/admin/verifications', { params })
}

// 获取认证详情 (文档 §18.5)
export function getVerificationDetail(verificationId: number) {
  return request.get<ApiResponse<VerificationInfo>>(`/admin/verifications/${verificationId}`)
}

// 审核认证 (文档 §18.6 - POST /admin/verifications/{id}/review)
export function reviewVerification(verificationId: number, data: VerificationReviewRequest) {
  return request.post<ApiResponse>(`/admin/verifications/${verificationId}/review`, data)
}
