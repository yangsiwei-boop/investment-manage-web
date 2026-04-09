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
// 等待刷新的重试请求队列
let retryQueue: Array<{ resolve: Function; reject: Function }> = []

// 请求拦截器 - 自动添加Token (文档 §1.2)
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

// 响应拦截器 - 统一错误处理 (文档 §1.4)
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.code === 200) {
      return response
    }
    // Token过期 (文档 §1.4: code 20002)
    if (data.code === 20002) {
      return handleTokenRefresh(response)
    }
    // Token无效 (文档 §1.4: code 20003/20005)
    if (data.code === 20003 || data.code === 20005) {
      clearAuth()
      router.push('/login')
      ElMessage.error('登录已失效，请重新登录')
      return Promise.reject(new Error(data.message))
    }
    // 账号已禁用 (文档 §1.4: code 20006)
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

// Token刷新逻辑 (文档 §2.3)
async function handleTokenRefresh(failedResponse: any) {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearAuth()
    router.push('/login')
    return Promise.reject(new Error('请重新登录'))
  }

  if (!isRefreshing) {
    isRefreshing = true
    try {
      const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
      const newToken = data.data.token
      setToken(newToken)
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
      clearAuth()
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
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
