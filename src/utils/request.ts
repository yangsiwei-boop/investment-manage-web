import axios from 'axios'
import type { ApiResponse } from '@/types'
import { getToken, getRefreshToken, setToken, clearAuth } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

// 是否正在刷新Token
let isRefreshing = false
// 连续刷新失败次数
let refreshFailCount = 0
const MAX_REFRESH_RETRIES = 1
// 等待刷新的重试请求队列
let retryQueue: Array<{ resolve: Function; reject: Function }> = []

// 请求拦截器 - 自动添加Token
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 强制跳转登录页（防止重复调用）
function forceLogout(message = '登录已失效，请重新登录') {
  clearAuth()
  router.push('/login')
  ElMessage.error(message)
}

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.code === 200) {
      // 业务成功时重置刷新计数
      refreshFailCount = 0
      return response
    }
    // Token过期 code 20002
    if (data.code === 20002) {
      return handleTokenRefresh(response)
    }
    // Token无效 code 20003/20005
    if (data.code === 20003 || data.code === 20005) {
      forceLogout('登录已失效，请重新登录')
      return Promise.reject(new Error(data.message))
    }
    // 账号已禁用 code 20006
    if (data.code === 20006) {
      ElMessage.error('账号已被禁用，请联系客服')
      return Promise.reject(new Error(data.message))
    }
    // 其他业务错误
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message))
  },
  async (error) => {
    if (error.response?.status === 401) {
      // 超过重试次数，直接登出
      if (refreshFailCount >= MAX_REFRESH_RETRIES) {
        forceLogout('登录已过期，请重新登录')
        return Promise.reject(error)
      }
      return handleTokenRefresh(error.response)
    }
    if (error.response?.status === 403) {
      ElMessage.error('无权限访问')
    } else {
      ElMessage.error(error.response?.data?.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

// Token刷新逻辑
async function handleTokenRefresh(failedResponse: any) {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    forceLogout()
    return Promise.reject(new Error('请重新登录'))
  }

  if (!isRefreshing) {
    isRefreshing = true
    try {
      const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
      const newToken = data.data.token
      setToken(newToken)
      refreshFailCount = 0
      // 重试队列中的请求
      retryQueue.forEach(({ resolve }) => resolve())
      retryQueue = []
      // 重试原请求
      const config = failedResponse.config || failedResponse.response?.config
      if (config) {
        config.headers.Authorization = `Bearer ${newToken}`
        return request(config)
      }
    } catch {
      refreshFailCount++
      forceLogout('登录已过期，请重新登录')
      retryQueue.forEach(({ reject }) => reject(new Error('Token刷新失败')))
      retryQueue = []
    } finally {
      isRefreshing = false
    }
  }

  // 正在刷新时，将请求加入队列
  return new Promise((resolve, reject) => {
    retryQueue.push({ resolve, reject })
  })
}

export default request
