<template>
  <view class="profile-page">
    <view class="avatar-section" @click="changeAvatar">
      <image class="avatar" :src="userInfo?.avatar ? getServerUrl(userInfo.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
      <text class="change-text">点击更换头像</text>
    </view>
    
    <view class="form-container">
      <view class="form-item">
        <text class="label">用户名</text>
        <text class="value">{{ userInfo?.username }}</text>
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <text class="value">{{ userInfo?.phone }}</text>
      </view>
      <view class="form-item">
        <text class="label">邮箱</text>
        <input v-model="form.email" type="text" placeholder="请输入邮箱" />
      </view>
      <view class="form-item">
        <text class="label">注册时间</text>
        <text class="value">{{ formatDate(userInfo?.created_at) }}</text>
      </view>
    </view>
    
    <button class="btn-save" @click="handleSave" :loading="loading">保存修改</button>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { put, uploadFile, getServerUrl } from '@/utils/request'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const form = ref({
  email: ''
})
const loading = ref(false)

const formatDate = (date) => {
  if (!date) return ''
  return date.split('T')[0]
}

const changeAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (chooseRes) => {
      const tempFilePath = chooseRes.tempFilePaths[0]
      uni.showLoading({ title: '上传中...' })
      try {
        const res = await uploadFile('/auth/avatar', tempFilePath)
        uni.hideLoading()
        uni.showToast({ title: '头像更新成功', icon: 'success' })
        userStore.getProfile()
      } catch (error) {
        uni.hideLoading()
        console.error('头像上传失败:', error)
      }
    }
  })
}

const handleSave = async () => {
  loading.value = true
  try {
    await put('/auth/profile', {
      email: form.value.email,
      avatar: userInfo.value?.avatar
    })
    uni.showToast({ title: '保存成功', icon: 'success' })
    userStore.getProfile()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await userStore.getProfile()
  form.value.email = userInfo.value?.email || ''
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  
  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
  }
  
  .change-text {
    font-size: 26rpx;
    color: #4CAF50;
    margin-top: 16rpx;
  }
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
    
    .value {
      flex: 1;
      font-size: 28rpx;
      color: #333333;
      text-align: right;
    }
    
    input {
      flex: 1;
      font-size: 28rpx;
      text-align: right;
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
