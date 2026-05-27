<template>
  <view class="alerts-page">
    <view class="alert-list" v-if="alerts.length > 0">
      <view 
        class="alert-item" 
        v-for="alert in alerts" 
        :key="alert.id"
        :class="[alert.alert_type, { unread: alert.status === 'unread' }]"
        @click="markAsRead(alert)"
      >
        <view class="alert-icon">
          <text class="iconfont" :class="getAlertIcon(alert.alert_type)"></text>
        </view>
        <view class="alert-content">
          <text class="alert-message">{{ alert.message }}</text>
          <text class="alert-time">{{ formatTime(alert.created_at) }}</text>
          <text class="alert-data" v-if="alert.data_type">
            {{ getDataTypeName(alert.data_type) }}: {{ formatAlertValue(alert) }}
          </text>
        </view>
        <view class="alert-status" v-if="alert.status === 'unread'">
          <view class="unread-dot"></view>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <image src="/static/empty.svg" mode="aspectFit"></image>
      <text>暂无健康预警</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { getAlerts, markAlertRead } from '@/services/health'
import { getMemberList } from '@/services/member'

const userStore = useUserStore()
const alerts = ref([])
const members = ref([])

const dataTypeNames = {
  blood_pressure: '血压',
  blood_sugar: '血糖',
  heart_rate: '心率',
  weight: '体重'
}

const getAlertIcon = (type) => {
  const icons = {
    warning: 'icon-warning',
    danger: 'icon-danger',
    info: 'icon-info'
  }
  return icons[type] || 'icon-warning'
}

const getDataTypeName = (type) => {
  return dataTypeNames[type] || type
}

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diff = now - d
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const formatAlertValue = (alert) => {
  try {
    const value = typeof alert.data_value === 'string' ? JSON.parse(alert.data_value) : alert.data_value
    if (alert.data_type === 'blood_pressure') {
      return `${value.systolic}/${value.diastolic} mmHg`
    }
    if (alert.data_type === 'blood_sugar') {
      return `${value.value} mmol/L`
    }
    if (alert.data_type === 'heart_rate') {
      return `${value.value} bpm`
    }
    return value.value || ''
  } catch (e) {
    return ''
  }
}

const loadAlerts = async () => {
  try {
    const memberRes = await getMemberList()
    members.value = memberRes.data
    
    const allAlerts = []
    for (const member of members.value) {
      const res = await getAlerts(member.id)
      allAlerts.push(...res.data.map(a => ({ ...a, memberName: member.name })))
    }
    
    alerts.value = allAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (error) {
    console.error('加载预警失败:', error)
  }
}

const markAsRead = async (alert) => {
  if (alert.status === 'read') return
  try {
    await markAlertRead(alert.id)
    alert.status = 'read'
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

onShow(() => {
  loadAlerts()
})
</script>

<style lang="scss" scoped>
.alerts-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.alert-list {
  .alert-item {
    display: flex;
    align-items: flex-start;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    &.unread {
      background: #FFFDE7;
    }
    
    .alert-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      
      .iconfont {
        font-size: 40rpx;
      }
    }
    
    &.warning {
      .alert-icon {
        background: #FFF3E0;
        
        .iconfont {
          color: #FF9800;
        }
      }
    }
    
    &.danger {
      .alert-icon {
        background: #FFEBEE;
        
        .iconfont {
          color: #F44336;
        }
      }
    }
    
    &.info {
      .alert-icon {
        background: #E3F2FD;
        
        .iconfont {
          color: #2196F3;
        }
      }
    }
    
    .alert-content {
      flex: 1;
      
      .alert-message {
        display: block;
        font-size: 30rpx;
        color: #333333;
        font-weight: 500;
      }
      
      .alert-time {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-top: 8rpx;
      }
      
      .alert-data {
        display: inline-block;
        font-size: 24rpx;
        color: #666666;
        background: #F5F5F5;
        padding: 8rpx 16rpx;
        border-radius: 8rpx;
        margin-top: 12rpx;
      }
    }
    
    .alert-status {
      .unread-dot {
        width: 16rpx;
        height: 16rpx;
        background: #F44336;
        border-radius: 50%;
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
