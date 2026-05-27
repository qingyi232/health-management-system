<template>
  <view class="member-list-page">
    <view class="member-card" v-for="member in members" :key="member.id" @click="goDetail(member.id)">
      <image class="avatar" :src="member.avatar ? getServerUrl(member.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
      <view class="info">
        <view class="name-row">
          <text class="name">{{ member.name }}</text>
          <text class="relation">{{ member.relation }}</text>
        </view>
        <view class="detail-row">
          <text class="detail">{{ member.gender === 'male' ? '男' : '女' }} · {{ member.age }}岁</text>
        </view>
      </view>
      <text class="iconfont icon-right"></text>
    </view>
    
    <view class="empty" v-if="members.length === 0">
      <text>暂无家庭成员</text>
    </view>
    
    <view class="add-btn" @click="goAdd">
      <text class="iconfont icon-plus"></text>
      <text>添加成员</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMemberList } from '@/services/member'
import { getServerUrl } from '@/utils/request'

const members = ref([])

const loadMembers = async () => {
  try {
    const res = await getMemberList()
    members.value = res.data
  } catch (error) {
    console.error('加载成员失败:', error)
  }
}

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/member/detail?id=${id}` })
}

const goAdd = () => {
  uni.navigateTo({ url: '/pages/member/add' })
}

onShow(() => {
  loadMembers()
})
</script>

<style lang="scss" scoped>
.member-list-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.member-card {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
  }
  
  .info {
    flex: 1;
    margin-left: 24rpx;
    
    .name-row {
      display: flex;
      align-items: center;
      
      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .relation {
        font-size: 24rpx;
        color: #4CAF50;
        background: #E8F5E9;
        padding: 4rpx 16rpx;
        border-radius: 20rpx;
        margin-left: 16rpx;
      }
    }
    
    .detail-row {
      margin-top: 12rpx;
      
      .detail {
        font-size: 26rpx;
        color: #999999;
      }
    }
  }
  
  .iconfont {
    font-size: 32rpx;
    color: #CCCCCC;
  }
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
  font-size: 28rpx;
}

.add-btn {
  position: fixed;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #ffffff;
  padding: 24rpx 60rpx;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3);
  
  .iconfont {
    font-size: 32rpx;
    margin-right: 12rpx;
  }
  
  text {
    font-size: 30rpx;
  }
}
</style>
