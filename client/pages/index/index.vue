<template>
  <view class="index-page">
    <view class="header">
      <view class="header-content">
        <view class="user-info">
          <image class="avatar" :src="userInfo?.avatar ? getServerUrl(userInfo.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
          <view class="info">
            <text class="greeting">{{ greeting }}</text>
            <text class="username">{{ userInfo?.username || '用户' }}</text>
          </view>
        </view>
        <view class="alert-icon" @click="goAlerts">
          <text class="iconfont icon-bell"></text>
          <view class="badge" v-if="alertCount > 0">{{ alertCount > 99 ? '99+' : alertCount }}</view>
        </view>
      </view>
    </view>
    
    <view class="content">
      <view class="member-section card">
        <view class="section-header">
          <text class="title">家庭成员</text>
          <text class="more" @click="goMemberList">管理 ></text>
        </view>
        <scroll-view scroll-x class="member-list">
          <view 
            class="member-item" 
            v-for="member in members" 
            :key="member.id"
            :class="{ active: currentMember?.id === member.id }"
            @click="selectMember(member)"
          >
            <image class="member-avatar" :src="member.avatar ? getServerUrl(member.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
            <text class="member-name">{{ member.name }}</text>
            <text class="member-relation">{{ member.relation }}</text>
          </view>
          <view class="member-item add" @click="goAddMember">
            <view class="add-icon">+</view>
            <text class="member-name">添加</text>
          </view>
        </scroll-view>
      </view>
      
      <view class="health-overview card" v-if="currentMember">
        <view class="section-header">
          <text class="title">健康概览</text>
          <text class="more" @click="goHealthRecord">详情 ></text>
        </view>
        <view class="health-grid">
          <view class="health-item" @click="goAddHealth('weight')">
            <text class="label">体重</text>
            <text class="value">{{ latestHealth.weight && latestHealth.weight.value ? latestHealth.weight.value.value : '--' }}</text>
            <text class="unit">kg</text>
            <text class="source-tag" v-if="latestHealth.weight">{{ latestHealth.weight.source === 'device' ? '设备' : '手动' }}</text>
          </view>
          <view class="health-item" @click="goAddHealth('blood_pressure')">
            <text class="label">血压</text>
            <text class="value">{{ formatBP(latestHealth.blood_pressure) }}</text>
            <text class="unit">mmHg</text>
            <text class="source-tag" v-if="latestHealth.blood_pressure">{{ latestHealth.blood_pressure.source === 'device' ? '设备' : '手动' }}</text>
          </view>
          <view class="health-item" @click="goAddHealth('blood_sugar')">
            <text class="label">血糖</text>
            <text class="value">{{ latestHealth.blood_sugar && latestHealth.blood_sugar.value ? latestHealth.blood_sugar.value.value : '--' }}</text>
            <text class="unit">mmol/L</text>
            <text class="source-tag" v-if="latestHealth.blood_sugar">{{ latestHealth.blood_sugar.source === 'device' ? '设备' : '手动' }}</text>
          </view>
          <view class="health-item" @click="goAddHealth('heart_rate')">
            <text class="label">心率</text>
            <text class="value">{{ latestHealth.heart_rate && latestHealth.heart_rate.value ? latestHealth.heart_rate.value.value : '--' }}</text>
            <text class="unit">bpm</text>
            <text class="source-tag" v-if="latestHealth.heart_rate">{{ latestHealth.heart_rate.source === 'device' ? '设备' : '手动' }}</text>
          </view>
          <view class="health-item" @click="goPage('/pages/device/list')">
            <text class="label">步数</text>
            <text class="value">{{ latestHealth.steps && latestHealth.steps.value ? latestHealth.steps.value.value : '--' }}</text>
            <text class="unit">步</text>
            <text class="source-tag device" v-if="latestHealth.steps">设备</text>
          </view>
          <view class="health-item" @click="goPage('/pages/device/list')">
            <text class="label">睡眠</text>
            <text class="value">{{ latestHealth.sleep && latestHealth.sleep.value ? latestHealth.sleep.value.duration : '--' }}</text>
            <text class="unit">小时</text>
            <text class="source-tag device" v-if="latestHealth.sleep">设备</text>
          </view>
        </view>
      </view>
      
      <view class="quick-actions card">
        <view class="section-header">
          <text class="title">快捷功能</text>
        </view>
        <view class="action-grid">
          <view class="action-item" @click="goPage('/pages/health/add')">
            <view class="action-icon" style="background: #E8F5E9;">
              <text class="iconfont icon-edit" style="color: #4CAF50;"></text>
            </view>
            <text class="action-name">记录数据</text>
          </view>
          <view class="action-item" @click="goPage('/pages/health/analysis')">
            <view class="action-icon" style="background: #E3F2FD;">
              <text class="iconfont icon-chart" style="color: #2196F3;"></text>
            </view>
            <text class="action-name">数据分析</text>
          </view>
          <view class="action-item" @click="goPage('/pages/hospital/list')">
            <view class="action-icon" style="background: #FFF3E0;">
              <text class="iconfont icon-hospital" style="color: #FF9800;"></text>
            </view>
            <text class="action-name">预约挂号</text>
          </view>
          <view class="action-item" @click="goPage('/pages/device/list')">
            <view class="action-icon" style="background: #F3E5F5;">
              <text class="iconfont icon-device" style="color: #9C27B0;"></text>
            </view>
            <text class="action-name">设备管理</text>
          </view>
        </view>
      </view>
      
      <view class="ai-advice-card card" v-if="aiAdvice">
        <view class="section-header">
          <view class="ai-title-row">
            <text class="ai-icon">🤖</text>
            <text class="title">AI 智能健康建议</text>
          </view>
          <text class="ai-source">{{ aiAdvice.source === 'ai' ? 'DeepSeek' : '智能分析' }}</text>
        </view>
        <view class="ai-overall">
          <text>{{ aiAdvice.overall }}</text>
        </view>
        <view class="ai-sections">
          <view class="ai-section" v-if="aiAdvice.diet?.length">
            <text class="ai-section-title">🥗 饮食建议</text>
            <view class="ai-items">
              <text class="ai-item" v-for="(item, i) in aiAdvice.diet.slice(0, 3)" :key="'d'+i">{{ item }}</text>
            </view>
          </view>
          <view class="ai-section" v-if="aiAdvice.exercise?.length">
            <text class="ai-section-title">🏃 运动方案</text>
            <view class="ai-items">
              <text class="ai-item" v-for="(item, i) in aiAdvice.exercise.slice(0, 3)" :key="'e'+i">{{ item }}</text>
            </view>
          </view>
          <view class="ai-section" v-if="aiAdvice.lifestyle?.length">
            <text class="ai-section-title">💡 生活习惯</text>
            <view class="ai-items">
              <text class="ai-item" v-for="(item, i) in aiAdvice.lifestyle.slice(0, 2)" :key="'l'+i">{{ item }}</text>
            </view>
          </view>
          <view class="ai-section" v-if="aiAdvice.medical?.length">
            <text class="ai-section-title">🏥 医疗提醒</text>
            <view class="ai-items">
              <text class="ai-item" v-for="(item, i) in aiAdvice.medical.slice(0, 2)" :key="'m'+i">{{ item }}</text>
            </view>
          </view>
        </view>
        <view class="ai-refresh" @click="loadAiAdvice">
          <text>刷新建议</text>
        </view>
      </view>
      
      <view class="knowledge-section card">
        <view class="section-header">
          <text class="title">个性化推荐</text>
          <text class="more" @click="goPage('/pages/knowledge/list')">更多 ></text>
        </view>
        <view class="recommend-hint" v-if="currentMember">
          <text class="hint-text">AI 根据 {{ currentMember.name }} 的健康数据为您推荐</text>
        </view>
        <view class="knowledge-list">
          <view 
            class="knowledge-item" 
            v-for="item in knowledgeList" 
            :key="item.id"
            @click="goKnowledgeDetail(item.id)"
          >
            <view class="knowledge-content">
              <text class="recommend-tag" v-if="item.recommend_reason">{{ item.recommend_reason }}</text>
              <text class="knowledge-title">{{ item.title }}</text>
              <text class="knowledge-summary">{{ item.summary }}</text>
            </view>
            <image v-if="item.cover_image" class="knowledge-cover" :src="item.cover_image" mode="aspectFill"></image>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { getMemberList } from '@/services/member'
import { getLatestHealth, getUnreadAlertCount } from '@/services/health'
import { getRecommendKnowledge, getKnowledgeList, getAiAdvice } from '@/services/knowledge'
import { getServerUrl } from '@/utils/request'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const currentMember = computed(() => userStore.currentMember)

const members = ref([])
const latestHealth = ref({})
const alertCount = ref(0)
const knowledgeList = ref([])
const aiAdvice = ref(null)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 17) return '下午好'
  if (hour < 19) return '傍晚好'
  return '晚上好'
})

const formatBP = (bp) => {
  if (!bp?.value) return '--/--'
  return `${bp.value.systolic}/${bp.value.diastolic}`
}

const loadMembers = async () => {
  try {
    const res = await getMemberList()
    members.value = res.data
    const currentExists = currentMember.value && res.data.some(member => member.id === currentMember.value.id)
    if (currentMember.value && !currentExists) {
      userStore.setCurrentMember(null)
    }
    if (res.data.length > 0 && !currentExists) {
      userStore.setCurrentMember(res.data[0])
    }
  } catch (error) {
    console.error('加载成员失败:', error)
  }
}

const loadLatestHealth = async () => {
  if (!currentMember.value) return
  try {
    const res = await getLatestHealth(currentMember.value.id)
    latestHealth.value = res.data
  } catch (error) {
    console.error('加载健康数据失败:', error)
  }
}

const loadAlertCount = async () => {
  try {
    const res = await getUnreadAlertCount()
    alertCount.value = res.data.count
  } catch (error) {
    console.error('加载预警数量失败:', error)
  }
}

const loadKnowledge = async () => {
  try {
    let res
    if (currentMember.value) {
      res = await getRecommendKnowledge(currentMember.value.id)
    } else {
      res = await getKnowledgeList({ limit: 5 })
    }
    knowledgeList.value = res.data.slice ? res.data.slice(0, 5) : res.data.list?.slice(0, 5) || []
  } catch (error) {
    console.error('加载健康知识失败:', error)
  }
}

const loadAiAdvice = async () => {
  if (!currentMember.value) return
  try {
    const res = await getAiAdvice(currentMember.value.id)
    aiAdvice.value = res.data
  } catch (error) {
    console.error('加载AI建议失败:', error)
  }
}

const selectMember = (member) => {
  userStore.setCurrentMember(member)
  loadLatestHealth()
  loadAlertCount()
  loadKnowledge()
  loadAiAdvice()
}

const goMemberList = () => {
  uni.navigateTo({ url: '/pages/member/list' })
}

const goAddMember = () => {
  uni.navigateTo({ url: '/pages/member/add' })
}

const goHealthRecord = () => {
  uni.switchTab({ url: '/pages/health/record' })
}

const goAddHealth = (type) => {
  uni.navigateTo({ url: `/pages/health/add?type=${type}` })
}

const goAlerts = () => {
  uni.navigateTo({ url: '/pages/health/alerts' })
}

const goPage = (url) => {
  if (url.includes('switchTab')) {
    uni.switchTab({ url })
  } else {
    uni.navigateTo({ url })
  }
}

const goKnowledgeDetail = (id) => {
  uni.navigateTo({ url: `/pages/knowledge/detail?id=${id}` })
}

onShow(() => {
  if (!userStore.isLoggedIn()) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loadMembers()
  loadLatestHealth()
  loadAlertCount()
  loadKnowledge()
  loadAiAdvice()
})

onMounted(() => {
  if (!userStore.isLoggedIn()) {
    uni.reLaunch({ url: '/pages/login/login' })
  }
})
</script>

<style lang="scss" scoped>
.index-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  padding: 80rpx 30rpx 40rpx;
  border-radius: 0 0 40rpx 40rpx;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(255, 255, 255, 0.5);
    }
    
    .info {
      margin-left: 20rpx;
      
      .greeting {
        display: block;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .username {
        display: block;
        font-size: 36rpx;
        font-weight: bold;
        color: #ffffff;
        margin-top: 8rpx;
      }
    }
  }
  
  .alert-icon {
    position: relative;
    width: 80rpx;
    height: 80rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconfont {
      font-size: 44rpx;
      color: #ffffff;
    }
    
    .badge {
      position: absolute;
      top: 0;
      right: 0;
      min-width: 32rpx;
      height: 32rpx;
      background: #f44336;
      border-radius: 16rpx;
      font-size: 20rpx;
      color: #ffffff;
      text-align: center;
      line-height: 32rpx;
      padding: 0 8rpx;
    }
  }
}

.content {
  padding: 20rpx;
  margin-top: -20rpx;
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
  
  .more {
    font-size: 26rpx;
    color: #999999;
  }
}

.member-section {
  .member-list {
    white-space: nowrap;
    
    .member-item {
      display: inline-block;
      text-align: center;
      margin-right: 30rpx;
      padding: 16rpx;
      border-radius: 12rpx;
      
      &.active {
        background: #E8F5E9;
      }
      
      .member-avatar {
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
      }
      
      .member-name {
        display: block;
        font-size: 26rpx;
        color: #333333;
        margin-top: 12rpx;
      }
      
      .member-relation {
        display: block;
        font-size: 22rpx;
        color: #999999;
        margin-top: 4rpx;
      }
      
      &.add {
        .add-icon {
          width: 100rpx;
          height: 100rpx;
          border: 2rpx dashed #CCCCCC;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48rpx;
          color: #CCCCCC;
        }
      }
    }
  }
}

.health-overview {
  .health-grid {
    display: flex;
    flex-wrap: wrap;
    
    .health-item {
      width: 33.33%;
      padding: 16rpx 10rpx;
      box-sizing: border-box;
      text-align: center;
      position: relative;
      
      .label {
        display: block;
        font-size: 24rpx;
        color: #999999;
      }
      
      .value {
        display: block;
        font-size: 40rpx;
        font-weight: bold;
        color: #333333;
        margin: 8rpx 0;
      }
      
      .unit {
        display: block;
        font-size: 22rpx;
        color: #999999;
      }
      
      .source-tag {
        display: inline-block;
        font-size: 18rpx;
        color: #4CAF50;
        background: #E8F5E9;
        padding: 2rpx 10rpx;
        border-radius: 6rpx;
        margin-top: 6rpx;
        
        &.device {
          color: #2196F3;
          background: #E3F2FD;
        }
      }
    }
  }
}

.quick-actions {
  .action-grid {
    display: flex;
    justify-content: space-around;
    
    .action-item {
      text-align: center;
      
      .action-icon {
        width: 100rpx;
        height: 100rpx;
        border-radius: 24rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        
        .iconfont {
          font-size: 48rpx;
        }
      }
      
      .action-name {
        display: block;
        font-size: 24rpx;
        color: #666666;
        margin-top: 12rpx;
      }
    }
  }
}

.ai-advice-card {
  .ai-title-row {
    display: flex;
    align-items: center;
    
    .ai-icon {
      margin-right: 8rpx;
      font-size: 32rpx;
    }
  }
  
  .ai-source {
    font-size: 22rpx;
    color: #9C27B0;
    background: #F3E5F5;
    padding: 4rpx 16rpx;
    border-radius: 12rpx;
  }
  
  .ai-overall {
    background: linear-gradient(135deg, #E8F5E9, #F3E5F5);
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
    
    text {
      font-size: 28rpx;
      color: #333333;
      line-height: 1.6;
    }
  }
  
  .ai-sections {
    .ai-section {
      margin-bottom: 20rpx;
      
      .ai-section-title {
        display: block;
        font-size: 26rpx;
        font-weight: bold;
        color: #333333;
        margin-bottom: 12rpx;
      }
      
      .ai-items {
        .ai-item {
          display: block;
          font-size: 24rpx;
          color: #555555;
          line-height: 1.6;
          padding: 8rpx 0 8rpx 24rpx;
          position: relative;
          
          &::before {
            content: '•';
            position: absolute;
            left: 8rpx;
            color: #4CAF50;
          }
        }
      }
    }
  }
  
  .ai-refresh {
    text-align: center;
    padding: 16rpx 0 8rpx;
    border-top: 1rpx solid #F5F5F5;
    
    text {
      font-size: 26rpx;
      color: #4CAF50;
    }
  }
}

.knowledge-section {
  .recommend-hint {
    margin-bottom: 16rpx;
    
    .hint-text {
      font-size: 22rpx;
      color: #4CAF50;
      background: #E8F5E9;
      padding: 8rpx 16rpx;
      border-radius: 8rpx;
    }
  }
  
  .knowledge-list {
    .knowledge-item {
      display: flex;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #F5F5F5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .knowledge-content {
        flex: 1;
        
        .recommend-tag {
          display: inline-block;
          font-size: 20rpx;
          color: #FF9800;
          background: #FFF3E0;
          padding: 2rpx 12rpx;
          border-radius: 6rpx;
          margin-bottom: 8rpx;
        }
        
        .knowledge-title {
          display: block;
          font-size: 28rpx;
          color: #333333;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .knowledge-summary {
          display: block;
          font-size: 24rpx;
          color: #999999;
          margin-top: 8rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }
      
      .knowledge-cover {
        width: 160rpx;
        height: 100rpx;
        border-radius: 8rpx;
        margin-left: 20rpx;
      }
    }
  }
}
</style>
