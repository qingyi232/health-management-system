<template>
  <view class="appointment-list-page">
    <view class="tab-bar">
      <view 
        class="tab-item" 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="changeTab(tab.key)"
      >
        {{ tab.name }}
      </view>
    </view>
    
    <view class="appointment-list" v-if="appointments.length > 0">
      <view 
        class="appointment-item" 
        v-for="item in appointments" 
        :key="item.id"
        @click="goDetail(item.id)"
      >
        <view class="item-header">
          <text class="hospital">{{ item.hospital_name }}</text>
          <text class="status" :class="item.status">{{ getStatusName(item.status) }}</text>
        </view>
        <view class="item-body">
          <view class="info-row">
            <text class="label">就诊人：</text>
            <text class="value">{{ item.member_name }}</text>
          </view>
          <view class="info-row">
            <text class="label">科室：</text>
            <text class="value">{{ item.department_name }}</text>
          </view>
          <view class="info-row">
            <text class="label">医生：</text>
            <text class="value">{{ item.doctor_name }} {{ item.doctor_title }}</text>
          </view>
          <view class="info-row">
            <text class="label">时间：</text>
            <text class="value">{{ formatDate(item.appointment_date) }} {{ getSlotName(item.time_slot) }}</text>
          </view>
        </view>
        <view class="item-footer" v-if="item.status === 'pending'">
          <button class="btn-cancel" @click.stop="handleCancel(item.id)">取消预约</button>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <image src="/static/empty.svg" mode="aspectFit"></image>
      <text>暂无挂号记录</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAppointmentList, cancelAppointment } from '@/services/appointment'

const tabs = [
  { key: '', name: '全部' },
  { key: 'pending', name: '待就诊' },
  { key: 'completed', name: '已完成' },
  { key: 'cancelled', name: '已取消' }
]

const activeTab = ref('')
const appointments = ref([])

const statusNames = {
  pending: '待就诊',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
}

const getStatusName = (status) => statusNames[status] || status

const getSlotName = (slot) => {
  const slots = { morning: '上午', afternoon: '下午', evening: '晚间' }
  return slots[slot] || slot
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const loadAppointments = async () => {
  try {
    const res = await getAppointmentList({
      status: activeTab.value || undefined
    })
    appointments.value = res.data
  } catch (error) {
    console.error('加载挂号记录失败:', error)
  }
}

const changeTab = (key) => {
  activeTab.value = key
  loadAppointments()
}

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/appointment/detail?id=${id}` })
}

const handleCancel = (id) => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个预约吗',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelAppointment(id)
          uni.showToast({ title: '取消成功', icon: 'success' })
          loadAppointments()
        } catch (error) {
          console.error('取消失败:', error)
        }
      }
    }
  })
}

onShow(() => {
  loadAppointments()
})
</script>

<style lang="scss" scoped>
.appointment-list-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tab-bar {
  display: flex;
  background: #ffffff;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 24rpx 0;
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

.appointment-list {
  padding: 20rpx;
  
  .appointment-item {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16rpx;
      border-bottom: 1rpx solid #F5F5F5;
      
      .hospital {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .status {
        font-size: 24rpx;
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
        
        &.pending {
          background: #E3F2FD;
          color: #2196F3;
        }
        
        &.confirmed {
          background: #E8F5E9;
          color: #4CAF50;
        }
        
        &.completed {
          background: #F5F5F5;
          color: #999999;
        }
        
        &.cancelled {
          background: #FFEBEE;
          color: #F44336;
        }
      }
    }
    
    .item-body {
      padding: 16rpx 0;
      
      .info-row {
        display: flex;
        margin-bottom: 12rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .label {
          font-size: 26rpx;
          color: #999999;
          width: 120rpx;
        }
        
        .value {
          flex: 1;
          font-size: 26rpx;
          color: #333333;
        }
      }
    }
    
    .item-footer {
      padding-top: 16rpx;
      border-top: 1rpx solid #F5F5F5;
      
      .btn-cancel {
        background: #ffffff;
        color: #f44336;
        border: 2rpx solid #f44336;
        border-radius: 40rpx;
        height: 72rpx;
        line-height: 72rpx;
        font-size: 28rpx;
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
