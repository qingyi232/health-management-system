<template>
  <view class="invitations-page">
    <view class="invitation-list" v-if="invitations.length > 0">
      <view class="invitation-item" v-for="inv in invitations" :key="inv.id">
        <view class="invitation-info">
          <text class="family-name">{{ inv.family_name }}</text>
          <text class="inviter">{{ inv.inviter_name }} 邀请您加入</text>
          <text class="time">{{ formatTime(inv.created_at) }}</text>
        </view>
        <view class="invitation-actions">
          <button class="btn-accept" @click="handleAccept(inv.id)">接受</button>
          <button class="btn-reject" @click="handleReject(inv.id)">拒绝</button>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <image src="/static/empty.svg" mode="aspectFit"></image>
      <text>暂无邀请</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMyInvitations, acceptInvitation, rejectInvitation } from '@/services/family'

const invitations = ref([])

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const loadInvitations = async () => {
  try {
    const res = await getMyInvitations()
    invitations.value = res.data
  } catch (error) {
    console.error('加载邀请失败', error)
  }
}

const handleAccept = async (id) => {
  try {
    await acceptInvitation(id)
    uni.showToast({ title: '已加入家庭', icon: 'success' })
    loadInvitations()
  } catch (error) {
    console.error('接受失败:', error)
  }
}

const handleReject = async (id) => {
  try {
    await rejectInvitation(id)
    uni.showToast({ title: '已拒', icon: 'none' })
    loadInvitations()
  } catch (error) {
    console.error('拒绝失败:', error)
  }
}

onShow(() => {
  loadInvitations()
})
</script>

<style lang="scss" scoped>
.invitations-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.invitation-list {
  .invitation-item {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .invitation-info {
      margin-bottom: 20rpx;
      
      .family-name {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .inviter {
        display: block;
        font-size: 26rpx;
        color: #666666;
        margin-top: 8rpx;
      }
      
      .time {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-top: 8rpx;
      }
    }
    
    .invitation-actions {
      display: flex;
      gap: 20rpx;
      
      button {
        flex: 1;
        height: 80rpx;
        line-height: 80rpx;
        font-size: 28rpx;
        border-radius: 40rpx;
      }
      
      .btn-accept {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: #ffffff;
        border: none;
      }
      
      .btn-reject {
        background: #ffffff;
        color: #999999;
        border: 2rpx solid #E5E5E5;
      }
    }
  }
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }
  
  text {
    display: block;
    font-size: 28rpx;
    color: #999999;
  }
}
</style>
