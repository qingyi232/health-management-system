<template>
  <view class="shared-health-page">
    <view class="member-selector">
      <text class="label">选择要查看的成员</text>
      <picker :range="healthMembers" range-key="displayName" @change="onMemberChange">
        <view class="picker-value">
          {{ selectedMember?.displayName || '请选择' }}
          <text class="iconfont icon-down"></text>
        </view>
      </picker>
    </view>
    
    <view class="health-data" v-if="selectedMember && healthData.length > 0">
      <view class="member-info">
        <image class="avatar" :src="memberDetail?.avatar ? getServerUrl(memberDetail.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
        <view class="info">
          <text class="name">{{ memberDetail?.name }}</text>
          <text class="detail">
            {{ memberDetail?.relation }} · {{ memberDetail?.gender === 'male' ? '男' : '女' }}
            · 档案ID: {{ memberDetail?.id }}
            · 账号ID: {{ memberDetail?.user_id }}
          </text>
        </view>
      </view>
      
      <view class="data-list">
        <view class="data-item" v-for="item in healthData" :key="item.id">
          <view class="data-header">
            <text class="type">{{ getTypeName(item.data_type) }}</text>
            <text class="date">{{ formatDate(item.record_date) }}</text>
          </view>
          <view class="data-value">
            <text class="value">{{ formatValue(item) }}</text>
            <text class="unit">{{ item.unit }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else-if="selectedMember">
      <text>暂无健康数据</text>
    </view>
    
    <view class="tip" v-else>
      <text>请选择要查看健康数据的家庭成员</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getFamilyHealthMembers, getSharedHealth } from '@/services/family'
import { getServerUrl } from '@/utils/request'

const familyId = ref(null)
const healthMembers = ref([])
const selectedMember = ref(null)
const memberDetail = ref(null)
const healthData = ref([])

const typeNames = {
  weight: '体重',
  height: '身高',
  blood_pressure: '血压',
  blood_sugar: '血糖',
  heart_rate: '心率',
  steps: '步数',
  sleep: '睡眠'
}

const getTypeName = (type) => typeNames[type] || type

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const formatValue = (item) => {
  try {
    const value = item.value
    if (item.data_type === 'blood_pressure') {
      return `${value.systolic}/${value.diastolic}`
    }
    if (item.data_type === 'sleep') {
      return `${value.duration}`
    }
    return value.value || value
  } catch (e) {
    return item.value
  }
}

const loadFamilyMembers = async () => {
  try {
    const res = await getFamilyHealthMembers(familyId.value)
    healthMembers.value = res.data.map(item => ({
      ...item,
      displayName: `${item.name}（档案ID:${item.id} / 账号ID:${item.user_id}）`
    }))
  } catch (error) {
    console.error('加载家庭成员失败:', error)
  }
}

const onMemberChange = async (e) => {
  const member = healthMembers.value[e.detail.value]
  selectedMember.value = member
  loadHealthData(member.id)
}

const loadHealthData = async (memberId) => {
  try {
    const res = await getSharedHealth(familyId.value, memberId)
    memberDetail.value = res.data.member
    healthData.value = res.data.healthData
  } catch (error) {
    console.error('加载健康数据失败:', error)
    healthData.value = []
  }
}

onLoad((options) => {
  familyId.value = options.familyId
  loadFamilyMembers()
})
</script>

<style lang="scss" scoped>
.shared-health-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.member-selector {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  
  .label {
    display: block;
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 16rpx;
  }
  
  .picker-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 80rpx;
    background: #F5F5F5;
    border-radius: 12rpx;
    padding: 0 24rpx;
    font-size: 30rpx;
    color: #333333;
    
    .iconfont {
      color: #CCCCCC;
    }
  }
}

.health-data {
  .member-info {
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(255, 255, 255, 0.5);
      margin-right: 20rpx;
    }
    
    .info {
      .name {
        display: block;
        font-size: 34rpx;
        font-weight: bold;
        color: #ffffff;
      }
      
      .detail {
        display: block;
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 8rpx;
      }
    }
  }
  
  .data-list {
    .data-item {
      background: #ffffff;
      border-radius: 16rpx;
      padding: 24rpx;
      margin-bottom: 16rpx;
      
      .data-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12rpx;
        
        .type {
          font-size: 26rpx;
          color: #4CAF50;
          background: #E8F5E9;
          padding: 4rpx 16rpx;
          border-radius: 8rpx;
        }
        
        .date {
          font-size: 24rpx;
          color: #999999;
        }
      }
      
      .data-value {
        .value {
          font-size: 44rpx;
          font-weight: bold;
          color: #333333;
        }
        
        .unit {
          font-size: 26rpx;
          color: #999999;
          margin-left: 8rpx;
        }
      }
    }
  }
}

.empty, .tip {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
  font-size: 28rpx;
}
</style>
