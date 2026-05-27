<template>
  <view class="add-checkup-page">
    <view class="form-container">
      <view class="form-item">
        <text class="label">报告标题 <text class="required">*</text></text>
        <input v-model="form.title" type="text" placeholder="如：2024年度体检报告" />
      </view>
      
      <view class="form-item">
        <text class="label">体检机构 <text class="required">*</text></text>
        <input v-model="form.hospital_name" type="text" placeholder="请输入体检机构名称" />
      </view>
      
      <view class="form-item">
        <text class="label">体检日期 <text class="required">*</text></text>
        <picker mode="date" :end="today" @change="onDateChange">
          <view class="picker-value">
            {{ form.checkup_date || '请选择日期' }}
            <text class="iconfont icon-right"></text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">报告摘要</text>
        <textarea v-model="form.summary" placeholder="请输入体检报告主要结论" maxlength="500"></textarea>
      </view>
      
      <view class="form-item">
        <text class="label">上传报告</text>
        <view class="upload-area" @click="chooseFile">
          <view class="upload-placeholder" v-if="!fileInfo.path">
            <text class="iconfont icon-upload"></text>
            <text class="upload-text">点击上传报告文件</text>
            <text class="upload-tip">支持图片、PDF格式</text>
          </view>
          <view class="file-preview" v-else>
            <image v-if="isImage" :src="fileInfo.path" mode="aspectFit"></image>
            <view class="file-info" v-else>
              <text class="iconfont icon-file"></text>
              <text class="file-name">{{ fileInfo.name }}</text>
            </view>
            <text class="remove" @click.stop="removeFile">删除</text>
          </view>
        </view>
      </view>
    </view>
    
    <button class="btn-submit" @click="handleSubmit" :loading="loading">
      上传报告
    </button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { uploadFile } from '@/utils/request'

const form = ref({
  title: '',
  hospital_name: '',
  checkup_date: '',
  summary: ''
})

const fileInfo = ref({
  path: '',
  name: ''
})

const loading = ref(false)
const memberId = ref(null)

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const isImage = computed(() => {
  const ext = fileInfo.value.name.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
})

const onDateChange = (e) => {
  form.value.checkup_date = e.detail.value
}

const chooseFile = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      fileInfo.value = {
        path: res.tempFilePaths[0],
        name: res.tempFilePaths[0].split('/').pop()
      }
    }
  })
}

const removeFile = () => {
  fileInfo.value = { path: '', name: '' }
}

const handleSubmit = async () => {
  if (!form.value.title) {
    uni.showToast({ title: '请输入报告标题', icon: 'none' })
    return
  }
  if (!form.value.hospital_name) {
    uni.showToast({ title: '请输入体检机构', icon: 'none' })
    return
  }
  if (!form.value.checkup_date) {
    uni.showToast({ title: '请选择体检日期', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    await uploadFile({
      url: '/record/checkup',
      filePath: fileInfo.value.path || '',
      name: 'file',
      formData: {
        member_id: memberId.value,
        title: form.value.title,
        hospital_name: form.value.hospital_name,
        checkup_date: form.value.checkup_date,
        summary: form.value.summary
      }
    })
    uni.showToast({ title: '上传成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('上传失败:', error)
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  memberId.value = options.memberId
})
</script>

<style lang="scss" scoped>
.add-checkup-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.form-container {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  
  .form-item {
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F5F5F5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      display: block;
      font-size: 28rpx;
      color: #333333;
      margin-bottom: 16rpx;
      
      .required {
        color: #f44336;
      }
    }
    
    input {
      width: 100%;
      height: 80rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      padding: 0 24rpx;
      font-size: 30rpx;
      box-sizing: border-box;
    }
    
    textarea {
      width: 100%;
      height: 160rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      padding: 20rpx 24rpx;
      font-size: 28rpx;
      box-sizing: border-box;
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
    
    .upload-area {
      background: #F5F5F5;
      border-radius: 12rpx;
      min-height: 200rpx;
      
      .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40rpx;
        
        .iconfont {
          font-size: 60rpx;
          color: #CCCCCC;
        }
        
        .upload-text {
          font-size: 28rpx;
          color: #666666;
          margin-top: 16rpx;
        }
        
        .upload-tip {
          font-size: 24rpx;
          color: #999999;
          margin-top: 8rpx;
        }
      }
      
      .file-preview {
        padding: 20rpx;
        
        image {
          width: 100%;
          height: 300rpx;
          border-radius: 8rpx;
        }
        
        .file-info {
          display: flex;
          align-items: center;
          padding: 20rpx;
          
          .iconfont {
            font-size: 48rpx;
            color: #4CAF50;
            margin-right: 16rpx;
          }
          
          .file-name {
            flex: 1;
            font-size: 28rpx;
            color: #333333;
          }
        }
        
        .remove {
          display: block;
          text-align: center;
          font-size: 26rpx;
          color: #f44336;
          margin-top: 16rpx;
        }
      }
    }
  }
}

.btn-submit {
  margin-top: 40rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #ffffff;
  border: none;
  border-radius: 50rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 34rpx;
}
</style>
