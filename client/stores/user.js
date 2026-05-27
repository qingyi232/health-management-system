import { defineStore } from 'pinia'
import { ref } from 'vue'
import { post, get, put } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')
  const userInfo = ref(uni.getStorageSync('userInfo') || null)
  const currentMember = ref(uni.getStorageSync('currentMember') || null)

  const login = async (username, password) => {
    const res = await post('/auth/login', { username, password })
    token.value = res.data.token
    userInfo.value = res.data.user
    uni.setStorageSync('token', res.data.token)
    uni.setStorageSync('userInfo', res.data.user)
    return res
  }

  const register = async (data) => {
    const res = await post('/auth/register', data)
    return res
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    currentMember.value = null
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('currentMember')
    uni.reLaunch({ url: '/pages/login/login' })
  }

  const getProfile = async () => {
    const res = await get('/auth/profile')
    userInfo.value = res.data
    uni.setStorageSync('userInfo', res.data)
    return res
  }

  const updateProfile = async (data) => {
    const res = await put('/auth/profile', data)
    return res
  }

  const changePassword = async (oldPassword, newPassword) => {
    const res = await put('/auth/password', { oldPassword, newPassword })
    return res
  }

  const setCurrentMember = (member) => {
    currentMember.value = member
    uni.setStorageSync('currentMember', member)
  }

  const isLoggedIn = () => {
    return !!token.value
  }

  return {
    token,
    userInfo,
    currentMember,
    login,
    register,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    setCurrentMember,
    isLoggedIn
  }
})
