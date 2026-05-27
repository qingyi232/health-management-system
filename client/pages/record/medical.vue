<template>
  <view class="medical-page">
    <view class="record-list" v-if="records.length > 0">
      <view class="record-item" v-for="record in records" :key="record.id">
        <view class="record-header">
          <text class="hospital">{{ record.hospital_name }}</text>
          <text class="date">{{ formatDate(record.visit_date) }}</text>
        </view>
        <view class="record-body">
          <view class="info-row">
            <text class="label">科室：</text>
            <text class="value">{{ record.department }}</text>
          </view>
          <view class="info-row">
            <text class="label">医生：</text>
            <text class="value">{{ record.doctor_name }}</text>
          </view>
          <view class="info-row" v-if="record.diagnosis">
            <text class="label">诊断：</text>
            <text class="value">{{ record.diagnosis }}</text>
          </view>
          <view class="info-row" v-if="record.prescription">
            <text class="label">处方：</text>
            <text class="value">{{ record.prescription }}</text>
          </view>
        </view>
        <view class="record-actions">
          <text class="edit" @click="goEdit(record)">编辑</text>
          <text class="delete" @click="handleDelete(record.id)">删除</text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <image src="/static/empty.svg" mode="aspectFit"></image>
      <text>暂无就医记录</text>
    </view>
    
    <view class="add-btn" @click="goAdd">
      <text class="iconfont icon-plus"></text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getMedicalRecords, deleteMedicalRecord } from '@/services/record'

const records = ref([])
const memberId = ref(null)

const formatDate = (date) => {
  if (!date) return ''
  return date.split('T')[0]
}

const loadRecords = async () => {
  if (!memberId.value) return
  try {
    const res = await getMedicalRecords(memberId.value)
    records.value = res.data
  } catch (error) {
    console.error('加载就医记录失败:', error)
  }
}

const goAdd = () => {
  uni.navigateTo({ url: `/pages/record/add-medical?memberId=${memberId.value}` })
}

const goEdit = (record) => {
  uni.navigateTo({ url: `/pages/record/add-medical?memberId=${memberId.value}&id=${record.id}` })
}

const handleDelete = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条就医记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteMedicalRecord(id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadRecords()
        } catch (error) {
          console.error('删除失败:', error)
        }
      }
    }
  })
}

onLoad((options) => {
  memberId.value = options.memberId
})

onShow(() => {
  loadRecords()
})
</script>

<style lang="scss" scoped>
.medical-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.record-list {
  .record-item {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16rpx;
      border-bottom: 1rpx solid #F5F5F5;
      margin-bottom: 16rpx;
      
      .hospital {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .date {
        font-size: 24rpx;
        color: #999999;
      }
    }
    
    .record-body {
      .info-row {
        display: flex;
        margin-bottom: 12rpx;
        
        .label {
          font-size: 26rpx;
          color: #999999;
          width: 100rpx;
        }
        
        .value {
          flex: 1;
          font-size: 26rpx;
          color: #333333;
        }
      }
    }
    
    .record-actions {
      display: flex;
      justify-content: flex-end;
      gap: 30rpx;
      margin-top: 16rpx;
      padding-top: 16rpx;
      border-top: 1rpx solid #F5F5F5;
      
      .edit {
        font-size: 26rpx;
        color: #4CAF50;
      }
      
      .delete {
        font-size: 26rpx;
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
  bottom: 60rpx;
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
</style>
