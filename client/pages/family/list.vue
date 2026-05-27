<template>
  <view class="family-list-page">
    <view class="family-card" v-for="family in families" :key="family.id">
      <view class="family-header">
        <text class="family-name">{{ family.name }}</text>
        <text class="family-role">{{ family.user_role === 'admin' ? '管理员' : '成员' }}</text>
      </view>
      <view class="family-actions">
        <view class="action-item" @click="goMembers(family.id)">
          <text class="iconfont icon-users"></text>
          <text>成员管理</text>
        </view>
        <view class="action-item" @click="goInvite(family.id)" v-if="family.user_role === 'admin'">
          <text class="iconfont icon-add-user"></text>
          <text>邀请成员</text>
        </view>
        <view class="action-item" @click="goSharedHealth(family.id)">
          <text class="iconfont icon-share"></text>
          <text>健康共享</text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-if="families.length === 0">
      <text>暂无家庭</text>
    </view>
    
    <view class="invitation-section" v-if="invitations.length > 0">
      <view class="section-title">待处理邀请</view>
      <view class="invitation-item" v-for="inv in invitations" :key="inv.id">
        <view class="invitation-info">
          <text class="family-name">{{ inv.family_name }}</text>
          <text class="inviter">{{ inv.inviter_name }} 邀请您加入</text>
        </view>
        <view class="invitation-actions">
          <button class="btn-accept" @click="handleAccept(inv.id)">接受</button>
          <button class="btn-reject" @click="handleReject(inv.id)">拒绝</button>
        </view>
      </view>
    </view>
    
    <view class="create-btn" @click="showCreateModal = true">
      <text class="iconfont icon-plus"></text>
      <text>创建新家庭</text>
    </view>
    
    <view class="modal" v-if="showCreateModal" @click="showCreateModal = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">创建家庭</text>
        <input v-model="newFamilyName" type="text" placeholder="请输入家庭名称" />
        <view class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">取消</button>
          <button class="btn-confirm" @click="handleCreate">创建</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getFamilyList, createFamily, getMyInvitations, acceptInvitation, rejectInvitation } from '@/services/family'

const families = ref([])
const invitations = ref([])
const showCreateModal = ref(false)
const newFamilyName = ref('')

const loadFamilies = async () => {
  try {
    const res = await getFamilyList()
    families.value = res.data
  } catch (error) {
    console.error('加载家庭列表失败:', error)
  }
}

const loadInvitations = async () => {
  try {
    const res = await getMyInvitations()
    invitations.value = res.data
  } catch (error) {
    console.error('加载邀请列表失败', error)
  }
}

const handleCreate = async () => {
  if (!newFamilyName.value) {
    uni.showToast({ title: '请输入家庭名称', icon: 'none' })
    return
  }
  try {
    await createFamily({ name: newFamilyName.value })
    uni.showToast({ title: '创建成功', icon: 'success' })
    showCreateModal.value = false
    newFamilyName.value = ''
    loadFamilies()
  } catch (error) {
    console.error('创建失败:', error)
  }
}

const handleAccept = async (id) => {
  try {
    await acceptInvitation(id)
    uni.showToast({ title: '已加入家庭', icon: 'success' })
    loadFamilies()
    loadInvitations()
  } catch (error) {
    console.error('接受邀请失败', error)
  }
}

const handleReject = async (id) => {
  try {
    await rejectInvitation(id)
    uni.showToast({ title: '已拒', icon: 'none' })
    loadInvitations()
  } catch (error) {
    console.error('拒绝邀请失败', error)
  }
}

const goMembers = (familyId) => {
  uni.navigateTo({ url: `/pages/family/members?familyId=${familyId}` })
}

const goInvite = (familyId) => {
  uni.navigateTo({ url: `/pages/family/invite?familyId=${familyId}` })
}

const goSharedHealth = (familyId) => {
  uni.navigateTo({ url: `/pages/family/shared-health?familyId=${familyId}` })
}

onShow(() => {
  loadFamilies()
  loadInvitations()
})
</script>

<style lang="scss" scoped>
.family-list-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 140rpx;
}

.family-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  
  .family-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #F5F5F5;
    
    .family-name {
      font-size: 34rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .family-role {
      font-size: 24rpx;
      color: #4CAF50;
      background: #E8F5E9;
      padding: 6rpx 16rpx;
      border-radius: 8rpx;
    }
  }
  
  .family-actions {
    display: flex;
    justify-content: space-around;
    padding-top: 20rpx;
    
    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .iconfont {
        font-size: 44rpx;
        color: #4CAF50;
      }
      
      text:last-child {
        font-size: 24rpx;
        color: #666666;
        margin-top: 8rpx;
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

.invitation-section {
  margin-top: 30rpx;
  
  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 20rpx;
  }
  
  .invitation-item {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    
    .invitation-info {
      margin-bottom: 16rpx;
      
      .family-name {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .inviter {
        display: block;
        font-size: 26rpx;
        color: #666666;
        margin-top: 8rpx;
      }
    }
    
    .invitation-actions {
      display: flex;
      gap: 20rpx;
      
      button {
        flex: 1;
        height: 72rpx;
        line-height: 72rpx;
        font-size: 28rpx;
        border-radius: 40rpx;
      }
      
      .btn-accept {
        background: #4CAF50;
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

.create-btn {
  position: fixed;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #ffffff;
  padding: 24rpx 60rpx;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3);
  
  .iconfont {
    font-size: 32rpx;
    margin-right: 12rpx;
  }
  
  text:last-child {
    font-size: 30rpx;
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  
  .modal-content {
    width: 80%;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 40rpx;
    
    .modal-title {
      display: block;
      font-size: 34rpx;
      font-weight: bold;
      color: #333333;
      text-align: center;
      margin-bottom: 30rpx;
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
    
    .modal-actions {
      display: flex;
      gap: 20rpx;
      margin-top: 40rpx;
      
      button {
        flex: 1;
        height: 88rpx;
        line-height: 88rpx;
        font-size: 30rpx;
        border-radius: 44rpx;
      }
      
      .btn-cancel {
        background: #F5F5F5;
        color: #666666;
        border: none;
      }
      
      .btn-confirm {
        background: #4CAF50;
        color: #ffffff;
        border: none;
      }
    }
  }
}
</style>
