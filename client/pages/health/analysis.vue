<template>
  <view class="analysis-page">
    <view class="member-selector" @click="showMemberPicker = true">
      <image class="avatar" :src="currentMember?.avatar ? getServerUrl(currentMember.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
      <text class="name">{{ currentMember?.name || '选择成员' }}</text>
      <text class="iconfont icon-down"></text>
    </view>
    
    <view class="statistics-card card">
      <view class="section-header">
        <text class="title">健康统计</text>
        <text class="period">近30天</text>
      </view>
      <view class="stat-grid">
        <view class="stat-item">
          <text class="stat-label">体重变化</text>
          <text class="stat-value" :class="statistics.weight?.trend">
            {{ statistics.weight?.change > 0 ? '+' : '' }}{{ statistics.weight?.change || '0' }} kg
          </text>
        </view>
        <view class="stat-item">
          <text class="stat-label">平均血压</text>
          <text class="stat-value">
            {{ statistics.blood_pressure?.avgSystolic || '--' }}/{{ statistics.blood_pressure?.avgDiastolic || '--' }}
          </text>
        </view>
        <view class="stat-item">
          <text class="stat-label">平均血糖</text>
          <text class="stat-value">{{ statistics.blood_sugar?.average || '--' }} mmol/L</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">累计步数</text>
          <text class="stat-value">{{ statistics.steps?.total || '--' }} 步</text>
        </view>
      </view>
    </view>
    
    <view class="trend-card card">
      <view class="section-header">
        <text class="title">趋势分析</text>
      </view>
      <view class="type-tabs">
        <view 
          class="type-tab" 
          v-for="type in trendTypes" 
          :key="type.key"
          :class="{ active: activeTrendType === type.key }"
          @click="changeTrendType(type.key)"
        >
          {{ type.name }}
        </view>
      </view>
      <view class="period-tabs">
        <view 
          class="period-tab" 
          v-for="period in periods" 
          :key="period.value"
          :class="{ active: activePeriod === period.value }"
          @click="changePeriod(period.value)"
        >
          {{ period.name }}
        </view>
      </view>
      <view class="chart-container">
        <view class="chart-placeholder" v-if="trendData.length === 0">
          <text v-if="!currentMember">请先选择成员</text>
          <text v-else-if="loading">加载中...</text>
          <text v-else>暂无{{ trendTypes.find(t => t.key === activeTrendType)?.name }}数据，请先录入</text>
        </view>
        <view class="simple-chart" v-else>
          <view class="chart-bars">
            <view 
              class="chart-bar" 
              v-for="(item, index) in trendData" 
              :key="index"
              :style="{ height: getBarHeight(item) + '%' }"
            >
              <text class="bar-value">{{ getDisplayValue(item) }}</text>
            </view>
          </view>
          <view class="chart-labels">
            <text v-for="(item, index) in trendData" :key="index">{{ formatChartDate(item.date) }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="report-card card" @click="viewReport">
      <view class="report-content">
        <text class="iconfont icon-report"></text>
        <view class="report-info">
          <text class="report-title">健康报告</text>
          <text class="report-desc">查看详细健康分析报告</text>
        </view>
      </view>
      <text class="iconfont icon-right"></text>
    </view>
    
    <view class="no-member-tip card" v-if="!currentMember">
      <text class="tip-text">请先选择家庭成员查看数据分析</text>
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
          <text class="relation">{{ member.relation }}</text>
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
import { getStatistics, getTrendData, getHealthReport } from '@/services/health'
import { getMemberList } from '@/services/member'
import { getServerUrl } from '@/utils/request'

const userStore = useUserStore()
const currentMember = computed(() => userStore.currentMember)
const members = ref([])

const trendTypes = [
  { key: 'weight', name: '体重' },
  { key: 'blood_pressure', name: '血压' },
  { key: 'blood_sugar', name: '血糖' },
  { key: 'heart_rate', name: '心率' }
]

const periods = [
  { value: '7', name: '7天' },
  { value: '30', name: '30天' },
  { value: '90', name: '3月' }
]

const statistics = ref({})
const trendData = ref([])
const activeTrendType = ref('weight')
const activePeriod = ref('7')
const showMemberPicker = ref(false)
const loading = ref(false)

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

const selectMember = (member) => {
  userStore.setCurrentMember(member)
  showMemberPicker.value = false
}

const loadStatistics = async () => {
  if (!currentMember.value) return
  try {
    const res = await getStatistics(currentMember.value.id)
    statistics.value = res.data || {}
  } catch (error) {
    console.error('加载统计数据失败:', error)
    statistics.value = {}
  }
}

const loadTrendData = async () => {
  if (!currentMember.value) return
  loading.value = true
  try {
    const res = await getTrendData(currentMember.value.id, {
      type: activeTrendType.value,
      period: activePeriod.value
    })
    trendData.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('加载趋势数据失败:', error)
    trendData.value = []
  } finally {
    loading.value = false
  }
}

const changeTrendType = (type) => {
  activeTrendType.value = type
  loadTrendData()
}

const changePeriod = (period) => {
  activePeriod.value = period
  loadTrendData()
}

const getBarHeight = (item) => {
  if (trendData.value.length === 0) return 0
  let value = 0
  if (activeTrendType.value === 'blood_pressure') {
    value = item.value?.systolic || 0
  } else {
    value = item.value?.value || 0
  }
  const maxValue = Math.max(...trendData.value.map(d => {
    if (activeTrendType.value === 'blood_pressure') {
      return d.value?.systolic || 0
    }
    return d.value?.value || 0
  }))
  return maxValue > 0 ? (value / maxValue) * 80 + 20 : 50
}

const getDisplayValue = (item) => {
  if (activeTrendType.value === 'blood_pressure') {
    return `${item.value?.systolic || 0}/${item.value?.diastolic || 0}`
  }
  return item.value?.value || 0
}

const formatChartDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const viewReport = async () => {
  if (!currentMember.value) {
    uni.showToast({ title: '请先选择成员', icon: 'none' })
    return
  }
  uni.showToast({ title: '报告生成中...', icon: 'loading' })
  try {
    const res = await getHealthReport(currentMember.value.id, { period: '30' })
    const report = res.data
    uni.hideToast()
    const alertInfo = report.alerts && report.alerts.length > 0 
      ? `\n预警记录：${report.alerts.length} 条` : ''
    const suggestions = report.suggestions && report.suggestions.length > 0
      ? '\n\n【健康建议】\n' + report.suggestions.join('\n') : ''
    const dietPlan = report.dietPlan ? '\n\n【饮食方案】\n' + report.dietPlan : ''
    const exercisePlan = report.exercisePlan ? '\n\n【运动方案】\n' + report.exercisePlan : ''
    uni.showModal({
      title: `${report.member.name} 的健康报告`,
      content: `${report.period}共 ${report.summary.totalRecords} 条健康记录${alertInfo}${suggestions}${dietPlan}${exercisePlan}`,
      showCancel: false
    })
  } catch (error) {
    uni.hideToast()
    console.error('生成报告失败:', error)
  }
}

watch(currentMember, () => {
  loadStatistics()
  loadTrendData()
})

onShow(() => {
  loadMembers()
  loadStatistics()
  loadTrendData()
})
</script>

<style lang="scss" scoped>
.analysis-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.member-selector {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 24rpx 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  
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

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  
  .title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }
  
  .period {
    font-size: 24rpx;
    color: #999999;
  }
}

.statistics-card {
  .stat-grid {
    display: flex;
    flex-wrap: wrap;
    
    .stat-item {
      width: 50%;
      padding: 20rpx;
      box-sizing: border-box;
      text-align: center;
      
      .stat-label {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-bottom: 12rpx;
      }
      
      .stat-value {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
        
        &.up {
          color: #f44336;
        }
        
        &.down {
          color: #4CAF50;
        }
      }
    }
  }
}

.trend-card {
  .type-tabs {
    display: flex;
    margin-bottom: 16rpx;
    
    .type-tab {
      padding: 12rpx 24rpx;
      font-size: 26rpx;
      color: #666666;
      background: #F5F5F5;
      border-radius: 20rpx;
      margin-right: 16rpx;
      
      &.active {
        background: #E8F5E9;
        color: #4CAF50;
      }
    }
  }
  
  .period-tabs {
    display: flex;
    margin-bottom: 20rpx;
    
    .period-tab {
      padding: 8rpx 20rpx;
      font-size: 24rpx;
      color: #999999;
      margin-right: 20rpx;
      
      &.active {
        color: #4CAF50;
        font-weight: bold;
      }
    }
  }
  
  .chart-container {
    height: 300rpx;
    
    .chart-placeholder {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999999;
      font-size: 28rpx;
    }
    
    .simple-chart {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      .chart-bars {
        flex: 1;
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        padding: 0 10rpx;
        
        .chart-bar {
          width: 40rpx;
          background: linear-gradient(180deg, #4CAF50, #81C784);
          border-radius: 8rpx 8rpx 0 0;
          position: relative;
          min-height: 20%;
          
          .bar-value {
            position: absolute;
            top: -40rpx;
            left: 50%;
            transform: translateX(-50%);
            font-size: 20rpx;
            color: #666666;
            white-space: nowrap;
          }
        }
      }
      
      .chart-labels {
        display: flex;
        justify-content: space-around;
        padding: 16rpx 10rpx 0;
        
        text {
          font-size: 20rpx;
          color: #999999;
        }
      }
    }
  }
}

.report-card {
  display: flex;
  align-items: center;
  
  .report-content {
    flex: 1;
    display: flex;
    align-items: center;
    
    .iconfont {
      font-size: 60rpx;
      color: #4CAF50;
      margin-right: 20rpx;
    }
    
    .report-info {
      .report-title {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .report-desc {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-top: 8rpx;
      }
    }
  }
  
  .icon-right {
    font-size: 28rpx;
    color: #CCCCCC;
  }
}

.no-member-tip {
  text-align: center;
  padding: 60rpx 30rpx;
  
  .tip-text {
    font-size: 28rpx;
    color: #999999;
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
        font-size: 30rpx;
        color: #333333;
        margin-left: 20rpx;
      }
      
      .relation {
        flex: 1;
        font-size: 24rpx;
        color: #999999;
        margin-left: 12rpx;
      }
      
      .iconfont {
        font-size: 36rpx;
        color: #4CAF50;
      }
    }
  }
}
</style>
