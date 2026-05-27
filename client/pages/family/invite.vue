<template>
  <view class="invite-page">
    <view class="form-container">
      <view class="form-item">
        <text class="label">被邀请人手机号</text>
        <input v-model="phone" type="number" placeholder="请输入手机号" maxlength="11" />
      </view>
      <text class="tip">请输入已注册用户的手机号，邀请成功后对方需要确认才能加入家庭</text>
    </view>
    
    <button class="btn-invite" @click="handleInvite" :loading="loading">
      发送邀请
    </button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { inviteMember } from '@/services/family'

const familyId = ref(null)
const phone = ref('')
const loading = ref(false)

const handleInvite = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    await inviteMember(familyId.value, phone.value)
    uni.showToast({ title: '邀请已发', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('邀请失败', error)
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  familyId.value = options.familyId
})
</script>

<style lang="scss" scoped>
.invite-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.form-container {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  
  .form-item {
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
      font-size: 32rpx;
      box-sizing: border-box;
    }
  }
  
  .tip {
    display: block;
    font-size: 24rpx;
    color: #999999;
    margin-top: 20rpx;
    line-height: 1.5;
  }
}

.btn-invite {
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
