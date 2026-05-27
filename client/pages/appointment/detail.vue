<template>
  <view class="appointment-detail-page">
    <view class="status-header" :class="appointment.status">
      <text class="status-icon iconfont" :class="getStatusIcon(appointment.status)"></text>
      <text class="status-text">{{ getStatusName(appointment.status) }}</text>
    </view>
    
    <view class="info-card">
      <view class="card-title">预约信息</view>
      <view class="info-item">
        <text class="label">挂号单号</text>
        <text class="value">{{ appointment.order_no }}</text>
      </view>
      <view class="info-item">
        <text class="label">就诊人</text>
        <text class="value">{{ appointment.member_name }}</text>
      </view>
      <view class="info-item">
        <text class="label">就诊时间</text>
        <text class="value">{{ formatDate(appointment.appointment_date) }} {{ getSlotName(appointment.time_slot) }}</text>
      </view>
    </view>
    
    <view class="info-card">
      <view class="card-title">医院信息</view>
      <view class="info-item">
        <text class="label">医院名称</text>
        <text class="value">{{ appointment.hospital_name }}</text>
      </view>
      <view class="info-item">
        <text class="label">医院地址</text>
        <text class="value">{{ appointment.hospital_address }}</text>
      </view>
      <view class="info-item">
        <text class="label">联系电话</text>
        <text class="value link" @click="callHospital">{{ appointment.hospital_phone }}</text>
      </view>
    </view>
    
    <view class="info-card">
      <view class="card-title">就诊信息</view>
      <view class="info-item">
        <text class="label">就诊科室</text>
        <text class="value">{{ appointment.department_name }}</text>
      </view>
      <view class="info-item">
        <text class="label">科室位置</text>
        <text class="value">{{ appointment.department_location || '请到导诊台咨询' }}</text>
      </view>
      <view class="info-item">
        <text class="label">主治医生</text>
        <text class="value">{{ appointment.doctor_name }} {{ appointment.doctor_title }}</text>
      </view>
    </view>
    
    <view class="info-card" v-if="appointment.symptoms">
      <view class="card-title">症状描述</view>
      <text class="symptoms">{{ appointment.symptoms }}</text>
    </view>
    
    <view class="action-bar" v-if="appointment.status === 'pending'">
      <button class="btn-cancel" @click="handleCancel">取消预约</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAppointmentDetail, cancelAppointment } from '@/services/appointment'

const appointment = ref({})

const statusNames = {
  pending: '待就诊',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
}

const getStatusName = (status) => statusNames[status] || status

const getStatusIcon = (status) => {
  const icons = {
    pending: 'icon-clock',
    confirmed: 'icon-check',
    completed: 'icon-check-circle',
    cancelled: 'icon-close'
  }
  return icons[status] || 'icon-info'
}

const getSlotName = (slot) => {
  const slots = { morning: '上午', afternoon: '下午', evening: '晚间' }
  return slots[slot] || slot
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
}

const loadAppointment = async (id) => {
  try {
    const res = await getAppointmentDetail(id)
    appointment.value = res.data
  } catch (error) {
    console.error('加载预约详情失败:', error)
  }
}

const callHospital = () => {
  if (appointment.value.hospital_phone) {
    uni.makePhoneCall({
      phoneNumber: appointment.value.hospital_phone
    })
  }
}

const handleCancel = () => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个预约吗？取消后号源将被释放',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelAppointment(appointment.value.id)
          uni.showToast({ title: '取消成功', icon: 'success' })
          appointment.value.status = 'cancelled'
        } catch (error) {
          console.error('取消失败:', error)
        }
      }
    }
  })
}

onLoad((options) => {
  if (options.id) {
    loadAppointment(options.id)
  }
})
</script>

<style lang="scss" scoped>
.appointment-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.status-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  
  .status-icon {
    font-size: 80rpx;
  }
  
  .status-text {
    font-size: 36rpx;
    font-weight: bold;
    margin-top: 20rpx;
  }
  
  &.pending {
    background: linear-gradient(135deg, #2196F3, #64B5F6);
    
    .status-icon, .status-text {
      color: #ffffff;
    }
  }
  
  &.confirmed {
    background: linear-gradient(135deg, #4CAF50, #81C784);
    
    .status-icon, .status-text {
      color: #ffffff;
    }
  }
  
  &.completed {
    background: #F5F5F5;
    
    .status-icon, .status-text {
      color: #999999;
    }
  }
  
  &.cancelled {
    background: #FFEBEE;
    
    .status-icon, .status-text {
      color: #F44336;
    }
  }
}

.info-card {
  background: #ffffff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  
  .card-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 20rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #F5F5F5;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    
    .label {
      font-size: 28rpx;
      color: #999999;
    }
    
    .value {
      font-size: 28rpx;
      color: #333333;
      text-align: right;
      max-width: 60%;
      
      &.link {
        color: #4CAF50;
      }
    }
  }
  
  .symptoms {
    font-size: 28rpx;
    color: #666666;
    line-height: 1.6;
  }
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #F5F5F5;
  
  .btn-cancel {
    background: #ffffff;
    color: #f44336;
    border: 2rpx solid #f44336;
    border-radius: 50rpx;
    height: 96rpx;
    line-height: 96rpx;
    font-size: 34rpx;
  }
}
</style>
