<template>
  <view class="knowledge-detail-page">
    <view class="article-header">
      <text class="title">{{ article.title }}</text>
      <view class="meta">
        <text class="category">{{ getCategoryName(article.category) }}</text>
        <text class="author" v-if="article.author">{{ article.author }}</text>
        <text class="views">{{ article.view_count }}阅读</text>
      </view>
    </view>
    
    <view class="article-content">
      <rich-text :nodes="article.content"></rich-text>
    </view>
    
    <view class="article-actions">
      <view class="action-item" :class="{ active: isFavorite }" @click="toggleFavorite">
        <text class="iconfont" :class="isFavorite ? 'icon-star-fill' : 'icon-star'"></text>
        <text>{{ isFavorite ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="action-item" @click="shareArticle">
        <text class="iconfont icon-share"></text>
        <text>分享</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getKnowledgeDetail, addFavorite, removeFavorite } from '@/services/knowledge'

const article = ref({})
const isFavorite = ref(false)

const categoryNames = {
  general: '健康常识',
  nutrition: '营养饮食',
  fitness: '运动健身',
  mental_health: '心理健康',
  chronic_disease: '慢病管理',
  hypertension: '高血压',
  diabetes: '糖尿病',
  elderly_care: '老年保健',
  youth_health: '青少年健康',
  growth: '生长发育',
  exercise: '运动方案'
}

const getCategoryName = (key) => {
  return categoryNames[key] || key
}

const loadArticle = async (id) => {
  try {
    const res = await getKnowledgeDetail(id)
    article.value = res.data
  } catch (error) {
    console.error('加载文章失败:', error)
  }
}

const toggleFavorite = async () => {
  try {
    if (isFavorite.value) {
      await removeFavorite(article.value.id)
      isFavorite.value = false
      uni.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      await addFavorite(article.value.id)
      isFavorite.value = true
      uni.showToast({ title: '收藏成功', icon: 'success' })
    }
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const shareArticle = () => {
  uni.setClipboardData({
    data: `【${article.value.title}】${article.value.summary || ''}`,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板，快去分享吧', icon: 'none' })
    }
  })
}

onLoad((options) => {
  if (options.id) {
    loadArticle(options.id)
  }
})
</script>

<style lang="scss" scoped>
.knowledge-detail-page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 120rpx;
}

.article-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #F5F5F5;
  
  .title {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #333333;
    line-height: 1.4;
  }
  
  .meta {
    display: flex;
    align-items: center;
    margin-top: 20rpx;
    
    .category {
      font-size: 24rpx;
      color: #4CAF50;
      background: #E8F5E9;
      padding: 6rpx 16rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
    }
    
    .author {
      font-size: 24rpx;
      color: #666666;
      margin-right: 20rpx;
    }
    
    .views {
      font-size: 24rpx;
      color: #999999;
    }
  }
}

.article-content {
  padding: 30rpx;
  font-size: 30rpx;
  color: #333333;
  line-height: 1.8;
}

.article-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #ffffff;
  border-top: 1rpx solid #F5F5F5;
  padding: 20rpx 0;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  
  .action-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .iconfont {
      font-size: 44rpx;
      color: #666666;
    }
    
    text:last-child {
      font-size: 24rpx;
      color: #666666;
      margin-top: 8rpx;
    }
    
    &.active {
      .iconfont {
        color: #FF9800;
      }
      
      text:last-child {
        color: #FF9800;
      }
    }
  }
}
</style>
