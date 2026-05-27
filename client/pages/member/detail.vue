<template>
  <view class="member-detail-page">
    <view class="profile-card">
      <image class="avatar" :src="member.avatar ? getServerUrl(member.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
      <text class="name">{{ member.name }}</text>
      <text class="relation">{{ member.relation }}</text>
    </view>
    
    <view class="info-card">
      <view class="info-item">
        <text class="label">性别</text>
        <text class="value">{{ member.gender === 'male' ? '男' : '女' }}</text>
      </view>
      <view class="info-item">
        <text class="label">年龄</text>
        <text class="value">{{ member.age }}岁</text>
      </view>
      <view class="info-item">
        <text class="label">出生日期</text>
        <text class="value">{{ formatDate(member.birth_date) }}</text>
      </view>
      <view class="info-item">
        <text class="label">手机号</text>
        <text class="value">{{ member.phone || '未填写' }}</text>
      </view>
    </view>
    
    <view class="action-card">
      <view class="action-item" @click="goHealthRecord">
        <text class="iconfont icon-health"></text>
        <text class="action-name">健康记录</text>
        <text class="iconfont icon-right"></text>
      </view>
      <view class="action-item" @click="goMedicalRecord">
        <text class="iconfont icon-medical"></text>
        <text class="action-name">就医记录</text>
        <text class="iconfont icon-right"></text>
      </view>
      <view class="action-item" @click="goCheckupReport">
        <text class="iconfont icon-report"></text>
        <text class="action-name">体检报告</text>
        <text class="iconfont icon-right"></text>
      </view>
    </view>
    
    <view class="btn-group">
      <button class="btn-edit" @click="goEdit">编辑信息</button>
      <button class="btn-delete" @click="handleDelete">删除成员</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMemberDetail, deleteMember } from '@/services/member'
import { useUserStore } from '@/stores/user'
import { getServerUrl } from '@/utils/request'

const userStore = useUserStore()
const member = ref({})
const memberId = ref(null)

const formatDate = (date) => {
  if (!date) return ''
  return date.split('T')[0]
}

const loadMember = async () => {
  try {
    const res = await getMemberDetail(memberId.value)
    member.value = res.data
  } catch (error) {
    console.error('加载成员信息失败:', error)
  }
}

const goEdit = () => {
  uni.navigateTo({ url: `/pages/member/add?id=${memberId.value}` })
}

const goHealthRecord = () => {
  userStore.setCurrentMember(member.value)
  uni.switchTab({ url: '/pages/health/record' })
}

const goMedicalRecord = () => {
  uni.navigateTo({ url: `/pages/record/medical?memberId=${memberId.value}` })
}

const goCheckupReport = () => {
  uni.navigateTo({ url: `/pages/record/checkup?memberId=${memberId.value}` })
}

const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后该成员的所有健康数据将被清除，是否继续？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteMember(memberId.value)
          if (userStore.currentMember?.id === Number(memberId.value)) {
            userStore.setCurrentMember(null)
          }
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } catch (error) {
          console.error('删除失败:', error)
        }
      }
    }
  })
}

onLoad((options) => {
  memberId.value = options.id
  loadMember()
})
</script>

<style lang="scss" scoped>
.member-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.profile-card {
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  margin-bottom: 20rpx;
  
  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    border: 6rpx solid rgba(255, 255, 255, 0.5);
  }
  
  .name {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #ffffff;
    margin-top: 20rpx;
  }
  
  .relation {
    display: inline-block;
    font-size: 24rpx;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.2);
    padding: 8rpx 24rpx;
    border-radius: 20rpx;
    margin-top: 16rpx;
  }
}

.info-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 10rpx 30rpx;
  margin-bottom: 20rpx;
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #F5F5F5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      font-size: 28rpx;
      color: #666666;
    }
    
    .value {
      font-size: 28rpx;
      color: #333333;
    }
  }
}

.action-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 10rpx 30rpx;
  margin-bottom: 40rpx;
  
  .action-item {
    display: flex;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #F5F5F5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .iconfont:first-child {
      font-size: 40rpx;
      color: #4CAF50;
      margin-right: 20rpx;
    }
    
    .action-name {
      flex: 1;
      font-size: 30rpx;
      color: #333333;
    }
    
    .icon-right {
      font-size: 28rpx;
      color: #CCCCCC;
    }
  }
}

.btn-group {
  display: flex;
  gap: 20rpx;
  
  .btn-edit {
    flex: 1;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: #ffffff;
    border: none;
    border-radius: 50rpx;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 30rpx;
  }
  
  .btn-delete {
    flex: 1;
    background: #ffffff;
    color: #f44336;
    border: 2rpx solid #f44336;
    border-radius: 50rpx;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 30rpx;
  }
}
</style>
