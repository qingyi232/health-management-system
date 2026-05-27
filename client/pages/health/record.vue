<template>
  <view class="health-record-page">
    <view class="member-selector" @click="showMemberPicker = true">
      <image class="avatar" :src="currentMember?.avatar ? getServerUrl(currentMember.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
      <text class="name">{{ currentMember?.name || '选择成员' }}</text>
      <text class="iconfont icon-down"></text>
    </view>
    
    <view class="tab-bar">
      <view 
        class="tab-item" 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.name }}
      </view>
    </view>
    
    <view class="record-list" v-if="healthData.length > 0">
      <view class="record-item" v-for="item in healthData" :key="item.id">
        <view class="record-header">
          <text class="date">{{ formatDate(item.record_date) }}</text>
          <text class="source" :class="item.source">{{ item.source === 'manual' ? '手动录入' : '设备同步' }}</text>
        </view>
        <view class="record-content">
          <view class="data-value">
            <text class="value">{{ formatValue(item) }}</text>
            <text class="unit">{{ item.unit }}</text>
          </view>
          <text class="remark" v-if="item.remark">{{ item.remark }}</text>
        </view>
        <view class="record-actions">
          <text class="delete" @click="handleDelete(item.id)">删除</text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <image src="/static/empty.svg" mode="aspectFit"></image>
      <text>暂无{{ currentTabName }}记录</text>
    </view>
    
    <view class="add-btn" @click="goAdd">
      <text class="iconfont icon-plus"></text>
    </view>
    
    <view class="popup-mask" v-if="showMemberPicker" @click="showMemberPicker = false"></view>
    <view class="member-picker" :class="{ show: showMemberPicker }">
      <view class="picker-header">
        <text class="cancel" @click="showMemberPicker = false">取消</text>
        <text class="title">选择成员</text>
        <text class="confirm" @click="showMemberPicker = false">确定</text>
      </view>
      <view class="picker-content">
        <view 
          class="picker-item" 
          v-for="member in members" 
          :key="member.id"
          :class="{ active: currentMember?.id === member.id }"
          @click="selectMember(member)"
        >
          <image class="avatar" :src="member.avatar ? getServerUrl(member.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
          <text class="name">{{ member.name }}</text>
          <text class="iconfont icon-check" v-if="currentMember?.id === member.id"></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { getMemberList } from '@/services/member'
import { getHealthData, deleteHealthData } from '@/services/health'
import { getServerUrl } from '@/utils/request'

const userStore = useUserStore()
const currentMember = computed(() => userStore.currentMember)

const tabs = [
  { key: 'weight', name: '体重' },
  { key: 'blood_pressure', name: '血压' },
  { key: 'blood_sugar', name: '血糖' },
  { key: 'heart_rate', name: '心率' },
  { key: 'steps', name: '步数' },
  { key: 'sleep', name: '睡眠' }
]

const activeTab = ref('weight')
const healthData = ref([])
const members = ref([])
const showMemberPicker = ref(false)

const currentTabName = computed(() => {
  return tabs.find(t => t.key === activeTab.value)?.name || ''
})

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const formatValue = (item) => {
  try {
    const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value
    if (activeTab.value === 'blood_pressure') {
      return `${value.systolic}/${value.diastolic}`
    }
    if (activeTab.value === 'sleep') {
      return `${value.duration}小时`
    }
    return value.value || value
  } catch (e) {
    return item.value
  }
}

const loadMembers = async () => {
  try {
    const res = await getMemberList()
    members.value = res.data
    if (res.data.length > 0 && !currentMember.value) {
      userStore.setCurrentMember(res.data[0])
    }
  } catch (error) {
    console.error('加载成员失败:', error)
  }
}

const loadHealthData = async () => {
  if (!currentMember.value) return
  try {
    const res = await getHealthData(currentMember.value.id, { type: activeTab.value })
    healthData.value = res.data
  } catch (error) {
    console.error('加载健康数据失败:', error)
  }
}

const selectMember = (member) => {
  userStore.setCurrentMember(member)
  showMemberPicker.value = false
}

const handleDelete = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteHealthData(id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadHealthData()
        } catch (error) {
          console.error('删除失败:', error)
        }
      }
    }
  })
}

const goAdd = () => {
  uni.navigateTo({ url: `/pages/health/add?type=${activeTab.value}` })
}

watch(activeTab, () => {
  loadHealthData()
})

watch(currentMember, () => {
  loadHealthData()
})

onShow(() => {
  loadMembers()
  loadHealthData()
})
</script>

<style lang="scss" scoped>
.health-record-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.member-selector {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 24rpx 30rpx;
  
  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
  }
  
  .name {
    flex: 1;
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
    margin-left: 20rpx;
  }
  
  .iconfont {
    font-size: 28rpx;
    color: #999999;
  }
}

.tab-bar {
  display: flex;
  background: #ffffff;
  padding: 0 20rpx;
  border-top: 1rpx solid #F5F5F5;
  overflow-x: auto;
  white-space: nowrap;
  
  .tab-item {
    padding: 24rpx 30rpx;
    font-size: 28rpx;
    color: #666666;
    position: relative;
    
    &.active {
      color: #4CAF50;
      font-weight: bold;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background: #4CAF50;
        border-radius: 3rpx;
      }
    }
  }
}

.record-list {
  padding: 20rpx;
  
  .record-item {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;
      
      .date {
        font-size: 26rpx;
        color: #999999;
      }
      
      .source {
        font-size: 22rpx;
        padding: 4rpx 16rpx;
        border-radius: 20rpx;
        
        &.manual {
          background: #E8F5E9;
          color: #4CAF50;
        }
        
        &.device {
          background: #E3F2FD;
          color: #2196F3;
        }
      }
    }
    
    .record-content {
      .data-value {
        .value {
          font-size: 48rpx;
          font-weight: bold;
          color: #333333;
        }
        
        .unit {
          font-size: 26rpx;
          color: #999999;
          margin-left: 8rpx;
        }
      }
      
      .remark {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-top: 12rpx;
      }
    }
    
    .record-actions {
      margin-top: 16rpx;
      text-align: right;
      
      .delete {
        font-size: 24rpx;
        color: #f44336;
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

.add-btn {
  position: fixed;
  right: 40rpx;
  bottom: 140rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3);
  
  .iconfont {
    font-size: 48rpx;
    color: #ffffff;
  }
}

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.member-picker {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 999;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  
  &.show {
    transform: translateY(0);
  }
  
  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #F5F5F5;
    
    .cancel {
      font-size: 28rpx;
      color: #999999;
    }
    
    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .confirm {
      font-size: 28rpx;
      color: #4CAF50;
    }
  }
  
  .picker-content {
    max-height: 600rpx;
    overflow-y: auto;
    
    .picker-item {
      display: flex;
      align-items: center;
      padding: 24rpx 30rpx;
      border-bottom: 1rpx solid #F5F5F5;
      
      &.active {
        background: #E8F5E9;
      }
      
      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
      }
      
      .name {
        flex: 1;
        font-size: 30rpx;
        color: #333333;
        margin-left: 20rpx;
      }
      
      .iconfont {
        font-size: 36rpx;
        color: #4CAF50;
      }
    }
  }
}
</style>
