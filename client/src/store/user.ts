import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<null | {
    id: number
    username: string
    role: string
    avatar: string | null
  }>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  function setToken(val: string | null) {
    token.value = val
    if (val) localStorage.setItem('token', val)
    else localStorage.removeItem('token')
  }

  function setUserInfo(info: {
    id: number
    username: string
    role: string
    avatar?: string | null
  }) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  /** 登录成功后统一保存 token 和用户信息 */
  function setLogin(data: { token: string; userInfo: { id: number; username: string; role: string } }) {
    setToken(data.token)
    setUserInfo(data.userInfo)
  }

  /** 初始化时从 localStorage 恢复用户信息 */
  function initFromStorage() {
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      try { userInfo.value = JSON.parse(stored) } catch { /* ignore */ }
    }
  }

  function logout() {
    setToken(null)
    userInfo.value = null
    localStorage.removeItem('userInfo')
  }

  return {
    token, userInfo, isLoggedIn, isAdmin,
    setToken, setUserInfo, setLogin, initFromStorage, logout,
  }
})
