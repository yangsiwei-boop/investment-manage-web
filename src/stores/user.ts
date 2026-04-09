import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo } from '@/types'
import { getToken, setToken, removeToken, setUser, removeUser, getUser, setRefreshToken, removeRefreshToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const userInfo = ref<UserInfo | null>(getUser())

  function setAuth(newToken: string, newRefreshToken: string, user: UserInfo) {
    token.value = newToken
    userInfo.value = user
    setToken(newToken)
    setRefreshToken(newRefreshToken)
    setUser(user)
  }

  function clearAuth() {
    token.value = null
    userInfo.value = null
    removeToken()
    removeRefreshToken()
    removeUser()
  }

  function getDisplayName(): string {
    if (userInfo.value?.realName) return userInfo.value.realName
    return '管理员'
  }

  return {
    token,
    userInfo,
    setAuth,
    clearAuth,
    getDisplayName,
  }
})
