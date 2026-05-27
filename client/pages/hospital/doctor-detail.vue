<template>
  <view class="doctor-detail-page">
    <view class="doctor-header">
      <image class="doctor-avatar" :src="doctor.avatar ? getServerUrl(doctor.avatar) : '/static/doctor.svg'" mode="aspectFill"></image>
      <view class="doctor-info">
        <view class="name-row">
          <text class="name">{{ doctor.name }}</text>
          <text class="title">{{ doctor.title }}</text>
        </view>
        <text class="hospital">{{ doctor.hospital_name }}</text>
        <text class="department">{{ doctor.department_name }}</text>
      </view>
    </view>
    
    <view class="section card">
      <view class="section-header">
        <text class="title">擅长领域</text>
      </view>
      <text class="content">{{ doctor.specialty || '暂无信息' }}</text>
    </view>
    
    <view class="section card">
      <view class="section-header">
        <text class="title">医生简介</text>
      </view>
      <text class="content">{{ doctor.introduction || '暂无简介' }}</text>
    </view>
    
    <view class="section card">
      <view class="section-header">
        <text class="title">出诊时间</text>
      </view>
      <view class="schedule-list" v-if="schedules.length > 0">
        <view 
          class="schedule-item" 
          v-for="schedule in schedules" 
          :key="schedule.id"
          :class="{ disabled: schedule.remaining === 0 }"
          @click="selectSchedule(schedule)"
        >
          <text class="date">{{ formatDate(schedule.schedule_date) }}</text>
          <text class="slot">{{ getSlotName(schedule.time_slot) }}</text>
          <text class="remaining">余{{ schedule.remaining }}号</text>
        </view>
      </view>
      <view class="empty-schedule" v-else>
        <text>暂无排班信息</text>
      </view>
    </view>
    
    <view class="action-bar">
      <button class="btn-appointment" @click="goAppointment">
        预约挂号
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getDoctorDetail, getDoctorSchedule } from '@/services/hospital'
import { getServerUrl } from '@/utils/request'

const doctor = ref({})
const schedules = ref([])
const doctorId = ref(null)
const hospitalId = ref(null)

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
}

const getSlotName = (slot) => {
  const slots = {
    morning: '上午',
    afternoon: '下午',
    evening: '晚间'
  }
  return slots[slot] || slot
}

const loadDoctor = async () => {
  try {
    const res = await getDoctorDetail(doctorId.value)
    doctor.value = res.data
  } catch (error) {
    console.error('加载医生详情失败:', error)
  }
}

const loadSchedules = async () => {
  try {
    const res = await getDoctorSchedule(doctorId.value)
    schedules.value = res.data
  } catch (error) {
    console.error('加载排班失败:', error)
  }
}

const selectSchedule = (schedule) => {
  if (schedule.remaining === 0) {
    uni.showToast({ title: '该时段已约满', icon: 'none' })
    return
  }
  goAppointment(schedule)
}

const goAppointment = (schedule) => {
  const params = {
    doctorId: doctorId.value,
    hospitalId: hospitalId.value,
    departmentId: doctor.value.department_id
  }
  if (schedule) {
    params.date = schedule.schedule_date
    params.slot = schedule.time_slot
  }
  const query = Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
  uni.navigateTo({ url: `/pages/appointment/create?${query}` })
}

onLoad((options) => {
  doctorId.value = options.id
  hospitalId.value = options.hospitalId
  loadDoctor()
  loadSchedules()
})
</script>

<style lang="scss" scoped>
.doctor-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.doctor-header {
  display: flex;
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  padding: 40rpx 30rpx;
  
  .doctor-avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    border: 6rpx solid rgba(255, 255, 255, 0.5);
    margin-right: 30rpx;
  }
  
  .doctor-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    
    .name-row {
      display: flex;
      align-items: center;
      
      .name {
        font-size: 40rpx;
        font-weight: bold;
        color: #ffffff;
      }
      
      .title {
        font-size: 24rpx;
        color: #ffffff;
        background: rgba(255, 255, 255, 0.3);
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
        margin-left: 16rpx;
      }
    }
    
    .hospital {
      display: block;
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 16rpx;
    }
    
    .department {
      display: block;
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 8rpx;
    }
  }
}

.card {
  background: #ffffff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-header {
  margin-bottom: 16rpx;
  
  .title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333333;
  }
}

.content {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

.schedule-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  
  .schedule-item {
    width: calc(50% - 8rpx);
    background: #E8F5E9;
    border-radius: 12rpx;
    padding: 20rpx;
    box-sizing: border-box;
    
    .date {
      display: block;
      font-size: 26rpx;
      color: #333333;
      font-weight: 500;
    }
    
    .slot {
      display: block;
      font-size: 24rpx;
      color: #666666;
      margin-top: 8rpx;
    }
    
    .remaining {
      display: block;
      font-size: 24rpx;
      color: #4CAF50;
      margin-top: 8rpx;
    }
    
    &.disabled {
      background: #F5F5F5;
      
      .remaining {
        color: #999999;
      }
    }
  }
}

.empty-schedule {
  text-align: center;
  padding: 40rpx;
  color: #999999;
  font-size: 28rpx;
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
  
  .btn-appointment {
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: #ffffff;
    border: none;
    border-radius: 50rpx;
    height: 96rpx;
    line-height: 96rpx;
    font-size: 34rpx;
  }
}
</style>
