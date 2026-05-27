<template>
  <view class="hospital-detail-page">
    <view class="hospital-header">
      <image class="hospital-image" :src="hospital.image || '/static/hospital.svg'" mode="aspectFill"></image>
      <view class="hospital-info">
        <view class="name-row">
          <text class="name">{{ hospital.name }}</text>
          <text class="level">{{ hospital.level }}</text>
        </view>
        <text class="address">{{ hospital.address }}</text>
        <text class="phone">电话：{{ hospital.phone }}</text>
      </view>
    </view>
    
    <view class="section card">
      <view class="section-header">
        <text class="title">医院简介</text>
      </view>
      <text class="description">{{ hospital.description || '暂无简介' }}</text>
    </view>
    
    <view class="section card">
      <view class="section-header">
        <text class="title">科室列表</text>
      </view>
      <view class="department-grid">
        <view 
          class="department-item" 
          v-for="dept in departments" 
          :key="dept.id"
          @click="goDoctors(dept)"
        >
          <text class="dept-name">{{ dept.name }}</text>
          <text class="dept-location">{{ dept.location }}</text>
        </view>
      </view>
    </view>
    
    <view class="action-bar">
      <view class="action-btn call" @click="callHospital">
        <text class="iconfont icon-phone"></text>
        <text>电话咨询</text>
      </view>
      <view class="action-btn appointment" @click="goAppointment">
        <text class="iconfont icon-calendar"></text>
        <text>预约挂号</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getHospitalDetail, getDepartments } from '@/services/hospital'

const hospital = ref({})
const departments = ref([])
const hospitalId = ref(null)

const loadHospital = async () => {
  try {
    const res = await getHospitalDetail(hospitalId.value)
    hospital.value = res.data
    departments.value = res.data.departments || []
  } catch (error) {
    console.error('加载医院详情失败:', error)
  }
}

const callHospital = () => {
  if (hospital.value.phone) {
    uni.makePhoneCall({
      phoneNumber: hospital.value.phone
    })
  }
}

const goDoctors = (dept) => {
  uni.navigateTo({ 
    url: `/pages/hospital/doctors?hospitalId=${hospitalId.value}&departmentId=${dept.id}&departmentName=${dept.name}` 
  })
}

const goAppointment = () => {
  uni.navigateTo({ url: `/pages/hospital/doctors?hospitalId=${hospitalId.value}` })
}

onLoad((options) => {
  hospitalId.value = options.id
  loadHospital()
})
</script>

<style lang="scss" scoped>
.hospital-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.hospital-header {
  background: #ffffff;
  padding: 30rpx;
  
  .hospital-image {
    width: 100%;
    height: 300rpx;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
  }
  
  .hospital-info {
    .name-row {
      display: flex;
      align-items: center;
      
      .name {
        font-size: 36rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .level {
        font-size: 24rpx;
        color: #FF9800;
        background: #FFF3E0;
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
        margin-left: 16rpx;
      }
    }
    
    .address {
      display: block;
      font-size: 26rpx;
      color: #666666;
      margin-top: 16rpx;
    }
    
    .phone {
      display: block;
      font-size: 26rpx;
      color: #4CAF50;
      margin-top: 12rpx;
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
  margin-bottom: 20rpx;
  
  .title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }
}

.description {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

.department-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  
  .department-item {
    width: calc(50% - 10rpx);
    background: #F5F5F5;
    border-radius: 12rpx;
    padding: 24rpx;
    box-sizing: border-box;
    
    .dept-name {
      display: block;
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .dept-location {
      display: block;
      font-size: 24rpx;
      color: #999999;
      margin-top: 8rpx;
    }
  }
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  background: #ffffff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #F5F5F5;
  
  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx;
    border-radius: 50rpx;
    
    .iconfont {
      font-size: 32rpx;
      margin-right: 12rpx;
    }
    
    text:last-child {
      font-size: 28rpx;
    }
    
    &.call {
      background: #F5F5F5;
      color: #333333;
    }
    
    &.appointment {
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: #ffffff;
    }
  }
}
</style>
