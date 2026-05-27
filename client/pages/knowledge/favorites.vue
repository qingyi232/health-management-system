<template>
  <view class="favorites-page">
    <view v-if="articles.length === 0 && !loading" class="empty">
      <text class="empty-text">暂无收藏文章</text>
    </view>
    
    <view v-for="item in articles" :key="item.id" class="article-item" @click="goDetail(item.id)">
      <view class="article-info">
        <text class="article-title">{{ item.title }}</text>
        <text class="article-summary">{{ item.summary }}</text>
        <view class="article-meta">
          <text class="category">{{ item.category }}</text>
          <text class="views">{{ item.view_count }}次阅读</text>
        </view>
      </view>
      <image v-if="item.cover_image" :src="item.cover_image" class="article-cover" mode="aspectFill"></image>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getFavorites } from '@/services/knowledge'

const articles = ref([])
const loading = ref(false)

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await getFavorites()
    articles.value = res.data
  } catch (error) {
    console.error('加载收藏失败:', error)
  } finally {
    loading.value = false
  }
}

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/knowledge/detail?id=${id}` })
}

onShow(() => {
  loadFavorites()
})
</script>

<style lang="scss" scoped>
.favorites-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  
  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

.article-item {
  display: flex;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  
  .article-info {
    flex: 1;
    
    .article-title {
      font-size: 30rpx;
      font-weight: 500;
      color: #333;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .article-summary {
      font-size: 24rpx;
      color: #999;
      margin-top: 12rpx;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .article-meta {
      display: flex;
      align-items: center;
      margin-top: 16rpx;
      gap: 20rpx;
      
      .category, .views {
        font-size: 22rpx;
        color: #999;
      }
      
      .category {
        background: #f0f7f0;
        color: #4CAF50;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
      }
    }
  }
  
  .article-cover {
    width: 180rpx;
    height: 130rpx;
    border-radius: 12rpx;
    margin-left: 20rpx;
    flex-shrink: 0;
  }
}
</style>