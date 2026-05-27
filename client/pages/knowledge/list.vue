<template>
  <view class="knowledge-page">
    <view class="search-bar">
      <text class="iconfont icon-search"></text>
      <input v-model="keyword" type="text" placeholder="搜索健康知识" @confirm="handleSearch" />
    </view>
    
    <scroll-view scroll-x class="category-tabs">
      <view 
        class="category-tab" 
        v-for="cat in categories" 
        :key="cat.key"
        :class="{ active: activeCategory === cat.key }"
        @click="changeCategory(cat.key)"
      >
        {{ cat.name }}
      </view>
    </scroll-view>
    
    <view class="article-list" v-if="articles.length > 0">
      <view 
        class="article-item" 
        v-for="article in articles" 
        :key="article.id"
        @click="goDetail(article.id)"
      >
        <view class="article-content">
          <text class="article-title">{{ article.title }}</text>
          <text class="article-summary">{{ article.summary }}</text>
          <view class="article-meta">
            <text class="category">{{ getCategoryName(article.category) }}</text>
            <text class="views">{{ article.view_count }}阅读</text>
          </view>
        </view>
        <image v-if="article.cover_image" class="article-cover" :src="article.cover_image" mode="aspectFill"></image>
      </view>
    </view>
    
    <view class="empty" v-else>
      <text>暂无相关文章</text>
    </view>
    
    <view class="load-more" v-if="hasMore" @click="loadMore">
      <text>{{ loading ? '加载中...' : '加载更多' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getKnowledgeList, getCategories } from '@/services/knowledge'

const categories = ref([
  { key: '', name: '全部' }
])
const activeCategory = ref('')
const keyword = ref('')
const articles = ref([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)

const getCategoryName = (key) => {
  const cat = categories.value.find(c => c.key === key)
  return cat?.name || key
}

const loadCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = [{ key: '', name: '全部' }, ...res.data]
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadArticles = async (reset = false) => {
  if (loading.value) return
  if (reset) {
    page.value = 1
    hasMore.value = true
  }
  
  loading.value = true
  try {
    const res = await getKnowledgeList({
      category: activeCategory.value || undefined,
      keyword: keyword.value || undefined,
      page: page.value,
      limit: 10
    })
    
    if (reset) {
      articles.value = res.data.list
    } else {
      articles.value = [...articles.value, ...res.data.list]
    }
    
    hasMore.value = articles.value.length < res.data.total
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const changeCategory = (key) => {
  activeCategory.value = key
  loadArticles(true)
}

const handleSearch = () => {
  loadArticles(true)
}

const loadMore = () => {
  if (!hasMore.value || loading.value) return
  page.value++
  loadArticles()
}

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/knowledge/detail?id=${id}` })
}

onShow(() => {
  loadCategories()
  loadArticles(true)
})
</script>

<style lang="scss" scoped>
.knowledge-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #ffffff;
  margin: 20rpx;
  padding: 20rpx 24rpx;
  border-radius: 40rpx;
  
  .iconfont {
    font-size: 32rpx;
    color: #999999;
    margin-right: 16rpx;
  }
  
  input {
    flex: 1;
    font-size: 28rpx;
  }
}

.category-tabs {
  white-space: nowrap;
  background: #ffffff;
  padding: 20rpx;
  
  .category-tab {
    display: inline-block;
    padding: 12rpx 28rpx;
    font-size: 26rpx;
    color: #666666;
    background: #F5F5F5;
    border-radius: 30rpx;
    margin-right: 16rpx;
    
    &.active {
      background: #E8F5E9;
      color: #4CAF50;
    }
  }
}

.article-list {
  padding: 20rpx;
  
  .article-item {
    display: flex;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .article-content {
      flex: 1;
      
      .article-title {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #333333;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .article-summary {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-top: 12rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .article-meta {
        display: flex;
        align-items: center;
        margin-top: 16rpx;
        
        .category {
          font-size: 22rpx;
          color: #4CAF50;
          background: #E8F5E9;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          margin-right: 16rpx;
        }
        
        .views {
          font-size: 22rpx;
          color: #999999;
        }
      }
    }
    
    .article-cover {
      width: 180rpx;
      height: 120rpx;
      border-radius: 12rpx;
      margin-left: 20rpx;
    }
  }
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
  font-size: 28rpx;
}

.load-more {
  text-align: center;
  padding: 30rpx;
  color: #999999;
  font-size: 26rpx;
}
</style>