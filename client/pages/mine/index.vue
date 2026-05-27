<template>
  <view class="mine-page">
    <view class="user-header" @click="goProfile">
      <image class="avatar" :src="userInfo?.avatar ? getServerUrl(userInfo.avatar) : '/static/icons/user.svg'" mode="aspectFill"></image>
      <view class="user-info">
        <text class="username">{{ userInfo?.username || '未登录' }}</text>
        <text class="phone">{{ userInfo?.phone || '' }}</text>
      </view>
      <text class="iconfont icon-right"></text>
    </view>
    
    <view class="menu-section">
      <view class="menu-item" @click="goPage('/pages/member/list')">
        <text class="iconfont icon-users"></text>
        <text class="menu-name">家庭成员</text>
        <text class="iconfont icon-right"></text>
      </view>
      <view class="menu-item" @click="goPage('/pages/family/list')">
        <text class="iconfont icon-home"></text>
        <text class="menu-name">家庭管理</text>
        <text class="iconfont icon-right"></text>
      </view>
      <view class="menu-item" @click="goPage('/pages/family/invitations')">
        <text class="iconfont icon-mail"></text>
        <text class="menu-name">我的邀请</text>
        <text class="iconfont icon-right"></text>
      </view>
    </view>
    
    <view class="menu-section">
      <view class="menu-item" @click="goPage('/pages/device/list')">
        <text class="iconfont icon-device"></text>
        <text class="menu-name">我的设备</text>
        <text class="iconfont icon-right"></text>
      </view>
      <view class="menu-item" @click="goPage('/pages/appointment/list')">
        <text class="iconfont icon-calendar"></text>
        <text class="menu-name">挂号记录</text>
        <text class="iconfont icon-right"></text>
      </view>
      <view class="menu-item" @click="goFavorites">
        <text class="iconfont icon-star"></text>
        <text class="menu-name">我的收藏</text>
        <text class="iconfont icon-right"></text>
      </view>
    </view>
    
    <view class="menu-section">
      <view class="menu-item" @click="goPage('/pages/mine/profile')">
        <text class="iconfont icon-user"></text>
        <text class="menu-name">个人信息</text>
        <text class="iconfont icon-right"></text>
      </view>
      <view class="menu-item" @click="goPage('/pages/mine/password')">
        <text class="iconfont icon-lock"></text>
        <text class="menu-name">修改密码</text>
        <text class="iconfont icon-right"></text>
      </view>
    </view>
    
    <button class="btn-logout" @click="handleLogout">退出登录</button>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { getServerUrl } from '@/utils/request'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const goProfile = () => {
  uni.navigateTo({ url: '/pages/mine/profile' })
}

const goPage = (url) => {
  uni.navigateTo({ url })
}

const goFavorites = () => {
  uni.navigateTo({ url: '/pages/knowledge/favorites' })
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
  })
}

onShow(() => {
  if (!userStore.isLoggedIn()) {
    uni.reLaunch({ url: '/pages/login/login' })
  }
})
</script>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.user-header {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  padding: 60rpx 30rpx 40rpx;
  
  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255,255,255,0.5);
  }
  
  .user-info {
    flex: 1;
    margin-left: 24rpx;
    
    .username {
      font-size: 36rpx;
      font-weight: 600;
      color: #ffffff;
    }
    
    .phone {
      font-size: 26rpx;
      color: rgba(255,255,255,0.8);
      margin-top: 8rpx;
    }
  }
  
  .icon-right {
    font-size: 32rpx;
    color: rgba(255,255,255,0.6);
  }
}

.menu-section {
  background: #ffffff;
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .iconfont:first-child {
      font-size: 40rpx;
      color: #4CAF50;
      width: 50rpx;
    }
    
    .menu-name {
      flex: 1;
      font-size: 28rpx;
      color: #333;
      margin-left: 16rpx;
    }
    
    .icon-right {
      font-size: 24rpx;
      color: #ccc;
    }
  }
}

.btn-logout {
  margin: 40rpx 20rpx;
  background: #ffffff;
  color: #f44336;
  border: none;
  border-radius: 16rpx;
  font-size: 30rpx;
  height: 88rpx;
  line-height: 88rpx;
}
</style>