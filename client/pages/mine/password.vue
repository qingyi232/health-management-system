<template>
  <view class="password-page">
    <view class="form-container">
      <view class="form-item">
        <text class="label">原密码</text>
        <input v-model="form.oldPassword" type="password" placeholder="请输入原密码" />
      </view>
      <view class="form-item">
        <text class="label">新密码</text>
        <input v-model="form.newPassword" type="password" placeholder="请输入新密码" />
      </view>
      <view class="form-item">
        <text class="label">确认密码</text>
        <input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" />
      </view>
    </view>
    
    <button class="btn-save" @click="handleSave" :loading="loading">确认修改</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const form = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const loading = ref(false)

const handleSave = async () => {
  if (!form.value.oldPassword) {
    uni.showToast({ title: '请输入原密码', icon: 'none' })
    return
  }
  if (!form.value.newPassword) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return
  }
  if (form.value.newPassword.length < 6) {
    uni.showToast({ title: '新密码至少6位', icon: 'none' })
    return
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    await userStore.changePassword(form.value.oldPassword, form.value.newPassword)
    uni.showToast({ title: '修改成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('修改失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.password-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.form-container {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 10rpx 30rpx;
  
  .form-item {
    display: flex;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #F5F5F5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      width: 160rpx;
      font-size: 28rpx;
      color: #666666;
    }
    
    input {
      flex: 1;
      font-size: 28rpx;
    }
  }
}

.btn-save {
  margin-top: 60rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #ffffff;
  border: none;
  border-radius: 50rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 34rpx;
}
</style>
