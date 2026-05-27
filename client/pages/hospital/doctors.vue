<template>
  <view class="doctors-page">
    <view class="filter-bar" v-if="!departmentId">
      <picker :range="departments" range-key="name" @change="onDeptChange">
        <view class="filter-item">
          <text>{{ selectedDept?.name || '选择科室' }}</text>
          <text class="iconfont icon-down"></text>
        </view>
      </picker>
    </view>
    
    <view class="doctor-list" v-if="doctors.length > 0">
      <view 
        class="doctor-item" 
        v-for="doctor in doctors" 
        :key="doctor.id"
        @click="goDetail(doctor.id)"
      >
        <image class="doctor-avatar" :src="doctor.avatar ? getServerUrl(doctor.avatar) : '/static/doctor.svg'" mode="aspectFill"></image>
        <view class="doctor-info">
          <view class="name-row">
            <text class="name">{{ doctor.name }}</text>
            <text class="title">{{ doctor.title }}</text>
          </view>
          <text class="specialty">{{ doctor.specialty }}</text>
        </view>
        <view class="action">
          <text class="iconfont icon-right"></text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <text>暂无医生信息</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getDoctors, getDepartments } from '@/services/hospital'
import { getServerUrl } from '@/utils/request'

const hospitalId = ref(null)
const departmentId = ref(null)
const doctors = ref([])
const departments = ref([])
const selectedDept = ref(null)

const loadDepartments = async () => {
  try {
    const res = await getDepartments(hospitalId.value)
    departments.value = res.data
  } catch (error) {
    console.error('加载科室失败:', error)
  }
}

const loadDoctors = async () => {
  try {
    const res = await getDoctors(hospitalId.value, {
      department_id: departmentId.value || selectedDept.value?.id
    })
    doctors.value = res.data
  } catch (error) {
    console.error('加载医生列表失败:', error)
  }
}

const onDeptChange = (e) => {
  selectedDept.value = departments.value[e.detail.value]
  loadDoctors()
}

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/hospital/doctor-detail?id=${id}&hospitalId=${hospitalId.value}` })
}

onLoad((options) => {
  hospitalId.value = options.hospitalId
  departmentId.value = options.departmentId
  
  if (options.departmentName) {
    uni.setNavigationBarTitle({ title: options.departmentName })
  }
  
  if (!departmentId.value) {
    loadDepartments()
  }
  loadDoctors()
})
</script>

<style lang="scss" scoped>
.doctors-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.filter-bar {
  background: #ffffff;
  padding: 20rpx;
  
  .filter-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #F5F5F5;
    padding: 20rpx 24rpx;
    border-radius: 12rpx;
    
    text:first-child {
      font-size: 28rpx;
      color: #333333;
    }
    
    .iconfont {
      font-size: 24rpx;
      color: #999999;
    }
  }
}

.doctor-list {
  padding: 20rpx;
  
  .doctor-item {
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .doctor-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }
    
    .doctor-info {
      flex: 1;
      
      .name-row {
        display: flex;
        align-items: center;
        
        .name {
          font-size: 32rpx;
          font-weight: bold;
          color: #333333;
        }
        
        .title {
          font-size: 24rpx;
          color: #4CAF50;
          background: #E8F5E9;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          margin-left: 12rpx;
        }
      }
      
      .specialty {
        display: block;
        font-size: 26rpx;
        color: #666666;
        margin-top: 12rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .action {
      .iconfont {
        font-size: 28rpx;
        color: #CCCCCC;
      }
    }
  }
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
  font-size: 28rpx;
}
</style>
