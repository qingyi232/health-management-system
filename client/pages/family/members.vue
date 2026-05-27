<template>
  <view class="family-members-page">
    <view class="member-list">
      <view class="member-item" v-for="member in members" :key="member.id">
        <image class="avatar" :src="member.avatar ? getServerUrl(member.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
        <view class="member-info">
          <text class="name">{{ member.username }}</text>
          <text class="role">{{ member.role === 'admin' ? '管理员' : '成员' }}</text>
        </view>
        <view class="member-actions" v-if="isAdmin && member.id !== currentUserId">
          <text class="remove" @click="handleRemove(member.id)">移除</text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-if="members.length === 0">
      <text>暂无成员</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getFamilyMembers, removeFamilyMember } from '@/services/family'
import { useUserStore } from '@/stores/user'
import { getServerUrl } from '@/utils/request'

const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id)

const familyId = ref(null)
const members = ref([])
const isAdmin = ref(false)

const loadMembers = async () => {
  try {
    const res = await getFamilyMembers(familyId.value)
    members.value = res.data
    const currentMember = res.data.find(m => m.id === currentUserId.value)
    isAdmin.value = currentMember?.role === 'admin'
  } catch (error) {
    console.error('加载成员失败:', error)
  }
}

const handleRemove = (userId) => {
  uni.showModal({
    title: '确认移除',
    content: '确定要将该成员移出家庭吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeFamilyMember(familyId.value, userId)
          uni.showToast({ title: '移除成功', icon: 'success' })
          loadMembers()
        } catch (error) {
          console.error('移除失败:', error)
        }
      }
    }
  })
}

onLoad((options) => {
  familyId.value = options.familyId
  loadMembers()
})
</script>

<style lang="scss" scoped>
.family-members-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.member-list {
  .member-item {
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }
    
    .member-info {
      flex: 1;
      
      .name {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .role {
        display: inline-block;
        font-size: 24rpx;
        color: #4CAF50;
        background: #E8F5E9;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        margin-top: 8rpx;
      }
    }
    
    .member-actions {
      .remove {
        font-size: 26rpx;
        color: #f44336;
      }
    }
  }
}

.empty {
  text-align: center;
  padding: 60rpx 0;
  color: #999999;
  font-size: 28rpx;
}
</style>
