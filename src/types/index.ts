// 通用API响应 (文档 §1.1)
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp?: string
}

// Spring Data 分页响应 (文档 §1.3)
export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  numberOfElements: number
}

// 用户类型 (后端实际返回大写)
export type UserType = 'INVESTOR' | 'ENTREPRENEUR' | 'ADMIN'

// 用户状态 (后端实际返回大写)
export type UserStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'BANNED'

// 认证状态 (后端实际返回大写)
export type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// 用户信息 (管理端用户列表实际返回)
export interface UserInfo {
  id: number
  phone: string
  nickname?: string | null
  email?: string | null
  userType: UserType
  realName?: string | null
  avatarUrl?: string | null
  status: UserStatus
  isVerified: boolean
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string | null
}

// 实名认证信息 (后端实际返回)
export interface VerificationInfo {
  id: number
  userId: number
  userNickname?: string | null
  phone?: string | null
  realName: string
  idCardNumber?: string | null
  idCardFrontUrl?: string | null
  idCardBackUrl?: string | null
  verificationType?: string | null
  status: VerifyStatus
  reviewComment?: string | null
  reviewerId?: number | null
  reviewedAt?: string | null
  createdAt: string
}

// 角色信息
export interface RoleInfo {
  id: number
  roleCode: string
  roleName: string
  description?: string | null
  roleLevel: number
  isSystem: boolean
  isEnabled: boolean
  permissionsCount: number
  usersCount: number
  permissions?: PermissionInfo[]
  users?: RoleUser[]
}

// 权限信息 (后端实际返回)
export interface PermissionInfo {
  id: number
  permissionCode: string
  permissionName: string
  description?: string | null
  module?: string | null
  parentId?: number | null
  permissionType: string
  resourcePath?: string | null
  httpMethods?: string[] | null
  sortOrder: number
  isEnabled: boolean
  icon?: string | null
}

// 角色中的用户
export interface RoleUser {
  id: number
  realName: string
  avatarUrl?: string | null
  userType: UserType
}

// 管理员Dashboard (文档 §18.1)
export interface DashboardData {
  totalUsers: number
  investorCount: number
  entrepreneurCount: number
  todayNewUsers: number
  totalProjects: number
  publishedTeaserCount: number
  pendingVerificationCount: number
  pendingApplicationCount: number
  totalViewCount: number
  totalFavoriteCount: number
  activeUserCount: number
}

// 数据统计 - 后端实际返回结构
export interface StatisticsOverview {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalProjects: number
  newProjectsToday: number
  totalTeasers: number
  publishedTeasers: number
  totalViews: number
  totalFavorites: number
  totalApplications: number
  pendingApplications: number
}

export interface TrendItem {
  date: string
  value: number
}

export interface DistributionItem {
  name: string
  value: number
}

export interface StatisticsData {
  overview: StatisticsOverview
  userTrend: TrendItem[]
  projectTrend: TrendItem[]
  viewTrend: TrendItem[]
  industryDistribution: DistributionItem[]
  stageDistribution: DistributionItem[]
}

// 登录请求 (文档 §2.1)
export interface LoginRequest {
  phone: string
  password: string
  loginType?: 'PASSWORD' | 'SMS_CODE'
}

// 登录响应 (文档 §2.1)
export interface LoginResponse {
  token: string
  refreshToken: string
  user: UserInfo
}

// 用户筛选参数 (文档 §18.2)
// 注意：后端status/userType筛选存在类型转换问题，暂不传这两个参数
export interface UserFilterParams {
  page: number
  size: number
  keyword?: string
}

// 审核认证请求 (文档 §18.6)
export interface VerificationReviewRequest {
  approved: boolean
  comment?: string
}

// 更新用户状态请求 (文档 §18.3)
export interface UpdateUserStatusRequest {
  status: string
  reason?: string
}
