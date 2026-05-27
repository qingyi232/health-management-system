<template>
  <view class="login-page">
    <view class="login-header">
      <image class="logo" src="/static/logo.svg" mode="aspectFit"></image>
      <text class="title">家庭健康管理</text>
      <text class="subtitle">守护家人健康，从这里开始</text>
    </view>
    
    <view class="login-form">
      <view class="form-item">
        <text class="iconfont icon-user"></text>
        <input 
          v-model="form.username" 
          type="text" 
          placeholder="请输入用户名/手机号"
          placeholder-class="placeholder"
        />
      </view>
      
      <view class="form-item">
        <text class="iconfont icon-lock"></text>
        <input 
          v-model="form.password" 
          type="password" 
          placeholder="请输入密码"
          placeholder-class="placeholder"
        />
      </view>
      
      <button class="btn-login" @click="handleLogin" :loading="loading">
        登录
      </button>
      
      <view class="register-link">
        <text>还没有账号？</text>
        <text class="link" @click="goRegister">立即注册</text>
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
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  if (!form.value.username) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!form.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    await userStore.login(form.value.username, form.value.password)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  uni.navigateTo({ url: '/pages/register/register' })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  padding: 100rpx 60rpx;
}

.login-header {
  text-align: center;
  margin-bottom: 80rpx;
  
  .logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 30rpx;
  }
  
  .title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 16rpx;
  }
  
  .subtitle {
    display: block;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.login-form {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  
  .form-item {
    display: flex;
    align-items: center;
    border-bottom: 1rpx solid #E5E5E5;
    padding: 24rpx 0;
    margin-bottom: 20rpx;
    
    .iconfont {
      font-size: 40rpx;
      color: #999999;
      margin-right: 20rpx;
    }
    
    input {
      flex: 1;
      font-size: 32rpx;
    }
  }
  
  .btn-login {
    margin-top: 60rpx;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: #ffffff;
    border: none;
    border-radius: 50rpx;
    height: 96rpx;
    line-height: 96rpx;
    font-size: 34rpx;
    font-weight: 500;
  }
  
  .register-link {
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

.placeholder {
  color: #CCCCCC;
}
</style>
