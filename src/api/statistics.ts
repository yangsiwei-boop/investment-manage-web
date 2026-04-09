import request from '@/utils/request'
import type { ApiResponse, DashboardData, StatisticsData } from '@/types'

// 管理员Dashboard (文档 §18.1 - GET /admin/dashboard)
export function getDashboard() {
  return request.get<ApiResponse<DashboardData>>('/admin/dashboard')
}

// 数据统计（扩展接口，非标准文档定义，后续可对接真实后端）
export function getStatisticsData(params: { period: string; startDate?: string; endDate?: string }) {
  return request.get<ApiResponse<StatisticsData>>('/admin/statistics', { params })
}
