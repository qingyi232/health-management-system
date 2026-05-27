<template>
  <view class="checkup-page">
    <view class="report-list" v-if="reports.length > 0">
      <view class="report-item" v-for="report in reports" :key="report.id">
        <view class="report-icon">
          <text class="iconfont icon-file"></text>
        </view>
        <view class="report-content">
          <text class="report-title">{{ report.title }}</text>
          <text class="report-info">{{ report.hospital_name }} · {{ formatDate(report.checkup_date) }}</text>
          <text class="report-summary" v-if="report.summary">{{ report.summary }}</text>
        </view>
        <view class="report-actions">
          <text class="view" @click="viewReport(report)" v-if="report.file_url">查看</text>
          <text class="delete" @click="handleDelete(report.id)">删除</text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <image src="/static/empty.svg" mode="aspectFit"></image>
      <text>暂无体检报告</text>
    </view>
    
    <view class="add-btn" @click="goAdd">
      <text class="iconfont icon-plus"></text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getCheckupReports, deleteCheckupReport } from '@/services/record'

const reports = ref([])
const memberId = ref(null)

const formatDate = (date) => {
  if (!date) return ''
  return date.split('T')[0]
}

const loadReports = async () => {
  if (!memberId.value) return
  try {
    const res = await getCheckupReports(memberId.value)
    reports.value = res.data
  } catch (error) {
    console.error('加载体检报告失败:', error)
  }
}

const goAdd = () => {
  uni.navigateTo({ url: `/pages/record/add-checkup?memberId=${memberId.value}` })
}

const viewReport = (report) => {
  if (report.file_url) {
    uni.previewImage({
      urls: [`http://localhost:3000${report.file_url}`]
    })
  }
}

const handleDelete = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这份体检报告吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteCheckupReport(id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadReports()
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
  loadReports()
})
</script>

<style lang="scss" scoped>
.checkup-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.report-list {
  .report-item {
    display: flex;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .report-icon {
      width: 80rpx;
      height: 80rpx;
      background: #E8F5E9;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      
      .iconfont {
        font-size: 40rpx;
        color: #4CAF50;
      }
    }
    
    .report-content {
      flex: 1;
      
      .report-title {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .report-info {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-top: 8rpx;
      }
      
      .report-summary {
        display: block;
        font-size: 24rpx;
        color: #666666;
        margin-top: 12rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
    
    .report-actions {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16rpx;
      
      .view {
        font-size: 24rpx;
        color: #4CAF50;
      }
      
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
