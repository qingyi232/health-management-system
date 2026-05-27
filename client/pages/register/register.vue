<template>
  <view class="register-page">
    <view class="form-container">
      <view class="form-item">
        <text class="label">用户名</text>
        <input v-model="form.username" type="text" placeholder="请输入用户名" />
      </view>
      
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="form.phone" type="number" placeholder="请输入手机号" maxlength="11" />
      </view>
      
      <view class="form-item">
        <text class="label">邮箱</text>
        <input v-model="form.email" type="text" placeholder="请输入邮箱（选填）" />
      </view>
      
      <view class="form-item">
        <text class="label">密码</text>
        <input v-model="form.password" type="password" placeholder="请输入密码" />
      </view>
      
      <view class="form-item">
        <text class="label">确认密码</text>
        <input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" />
      </view>
      
      <button class="btn-register" @click="handleRegister" :loading="loading">
        注册
      </button>
      
      <view class="login-link">
        <text>已有账号？</text>
        <text class="link" @click="goLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const form = ref({
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)

const handleRegister = async () => {
  if (!form.value.username) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!form.value.phone || form.value.phone.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!form.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    await userStore.register({
      username: form.value.username,
      phone: form.value.phone,
      email: form.value.email,
      password: form.value.password
    })
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx;
}

.form-container {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 40rpx;
  
  .form-item {
    margin-bottom: 30rpx;
    
    .label {
      display: block;
      font-size: 28rpx;
      color: #333333;
      margin-bottom: 16rpx;
    }
    
    input {
      width: 100%;
      height: 88rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      padding: 0 24rpx;
      font-size: 30rpx;
      box-sizing: border-box;
    }
  }
  
  .btn-register {
    margin-top: 40rpx;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: #ffffff;
    border: none;
    border-radius: 50rpx;
    height: 96rpx;
    line-height: 96rpx;
    font-size: 34rpx;
  }
  
  .login-link {
    text-align: center;
    margin-top: 40rpx;
    font-size: 28rpx;
    color: #666666;
    
    .link {
      color: #4CAF50;
      margin-left: 10rpx;
    }
  }
}
</style>
