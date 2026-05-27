<template>
  <view class="add-health-page">
    <view class="type-selector" v-if="!selectedType">
      <view class="type-grid">
        <view 
          class="type-item" 
          v-for="type in dataTypes" 
          :key="type.key"
          @click="selectType(type.key)"
        >
          <view class="type-icon" :style="{ background: type.bgColor }">
            <text class="iconfont" :class="type.icon" :style="{ color: type.color }"></text>
          </view>
          <text class="type-name">{{ type.name }}</text>
        </view>
      </view>
    </view>
    
    <view class="form-container" v-else>
      <view class="form-header">
        <text class="type-name">{{ currentTypeName }}</text>
        <text class="change" @click="selectedType = ''">更换</text>
      </view>
      
      <view class="form-item" v-if="selectedType === 'weight'">
        <text class="label">体重 (kg)</text>
        <input v-model="form.value" type="digit" placeholder="请输入体重" />
      </view>
      
      <view class="form-item" v-if="selectedType === 'height'">
        <text class="label">身高 (cm)</text>
        <input v-model="form.value" type="digit" placeholder="请输入身高" />
      </view>
      
      <view class="form-group" v-if="selectedType === 'blood_pressure'">
        <view class="form-item">
          <text class="label">收缩压(mmHg)</text>
          <input v-model="form.systolic" type="number" placeholder="高压" />
        </view>
        <view class="form-item">
          <text class="label">舒张压(mmHg)</text>
          <input v-model="form.diastolic" type="number" placeholder="低压" />
        </view>
      </view>
      
      <view class="form-item" v-if="selectedType === 'blood_sugar'">
        <text class="label">血糖(mmol/L)</text>
        <input v-model="form.value" type="digit" placeholder="请输入血糖值" />
        <view class="sub-options">
          <view 
            class="sub-option" 
            :class="{ active: form.timing === 'fasting' }"
            @click="form.timing = 'fasting'"
          >空腹</view>
          <view 
            class="sub-option" 
            :class="{ active: form.timing === 'after_meal' }"
            @click="form.timing = 'after_meal'"
          >餐后</view>
        </view>
      </view>
      
      <view class="form-item" v-if="selectedType === 'heart_rate'">
        <text class="label">心率 (bpm)</text>
        <input v-model="form.value" type="number" placeholder="请输入心率" />
      </view>
      
      <view class="form-item" v-if="selectedType === 'steps'">
        <text class="label">步数</text>
        <input v-model="form.value" type="number" placeholder="请输入步数" />
      </view>
      
      <view class="form-group" v-if="selectedType === 'sleep'">
        <view class="form-item">
          <text class="label">睡眠时长 (小时)</text>
          <input v-model="form.duration" type="digit" placeholder="总时长" />
        </view>
        <view class="form-item">
          <text class="label">深睡时长 (小时)</text>
          <input v-model="form.deep" type="digit" placeholder="深睡" />
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">记录日期</text>
        <picker mode="date" :end="today" @change="onDateChange">
          <view class="picker-value">
            {{ form.record_date || '请选择日期' }}
            <text class="iconfont icon-right"></text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">备注</text>
        <textarea v-model="form.remark" placeholder="添加备注（选填）" maxlength="200"></textarea>
      </view>
      
      <button class="btn-submit" @click="handleSubmit" :loading="loading">
        保存记录
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { addHealthData } from '@/services/health'

const userStore = useUserStore()
const currentMember = computed(() => userStore.currentMember)

const dataTypes = [
  { key: 'weight', name: '体重', icon: 'icon-weight', color: '#4CAF50', bgColor: '#E8F5E9' },
  { key: 'height', name: '身高', icon: 'icon-height', color: '#2196F3', bgColor: '#E3F2FD' },
  { key: 'blood_pressure', name: '血压', icon: 'icon-heart', color: '#F44336', bgColor: '#FFEBEE' },
  { key: 'blood_sugar', name: '血糖', icon: 'icon-droplet', color: '#FF9800', bgColor: '#FFF3E0' },
  { key: 'heart_rate', name: '心率', icon: 'icon-pulse', color: '#E91E63', bgColor: '#FCE4EC' },
  { key: 'steps', name: '步数', icon: 'icon-walk', color: '#9C27B0', bgColor: '#F3E5F5' },
  { key: 'sleep', name: '睡眠', icon: 'icon-moon', color: '#3F51B5', bgColor: '#E8EAF6' }
]

const selectedType = ref('')
const form = ref({
  value: '',
  systolic: '',
  diastolic: '',
  duration: '',
  deep: '',
  timing: 'fasting',
  record_date: '',
  remark: ''
})
const loading = ref(false)

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const currentTypeName = computed(() => {
  return dataTypes.find(t => t.key === selectedType.value)?.name || ''
})

const selectType = (type) => {
  selectedType.value = type
  form.value.record_date = today.value
}

const onDateChange = (e) => {
  form.value.record_date = e.detail.value
}

const getUnit = () => {
  const units = {
    weight: 'kg',
    height: 'cm',
    blood_pressure: 'mmHg',
    blood_sugar: 'mmol/L',
    heart_rate: 'bpm',
    steps: '步',
    sleep: '小时'
  }
  return units[selectedType.value] || ''
}

const getValue = () => {
  switch (selectedType.value) {
    case 'blood_pressure':
      return { systolic: parseInt(form.value.systolic), diastolic: parseInt(form.value.diastolic) }
    case 'blood_sugar':
      return { value: parseFloat(form.value.value), timing: form.value.timing }
    case 'sleep':
      return { duration: parseFloat(form.value.duration), deep: parseFloat(form.value.deep || 0) }
    default:
      return { value: parseFloat(form.value.value) }
  }
}

const validateForm = () => {
  if (!currentMember.value) {
    uni.showToast({ title: '请先选择家庭成员', icon: 'none' })
    return false
  }
  
  if (selectedType.value === 'blood_pressure') {
    if (!form.value.systolic || !form.value.diastolic) {
      uni.showToast({ title: '请输入完整的血压值', icon: 'none' })
      return false
    }
  } else if (selectedType.value === 'sleep') {
    if (!form.value.duration) {
      uni.showToast({ title: '请输入睡眠时长', icon: 'none' })
      return false
    }
  } else {
    if (!form.value.value) {
      uni.showToast({ title: '请输入数值', icon: 'none' })
      return false
    }
  }
  
  if (!form.value.record_date) {
    uni.showToast({ title: '请选择记录日期', icon: 'none' })
    return false
  }
  
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  try {
    await addHealthData({
      member_id: currentMember.value.id,
      data_type: selectedType.value,
      value: getValue(),
      unit: getUnit(),
      record_date: form.value.record_date,
      remark: form.value.remark
    })
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  if (options.type) {
    selectType(options.type)
  }
})
</script>

<style lang="scss" scoped>
.add-health-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.type-selector {
  .type-grid {
    display: flex;
    flex-wrap: wrap;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 20rpx;
    
    .type-item {
      width: 25%;
      text-align: center;
      padding: 30rpx 0;
      
      .type-icon {
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
      
      .type-name {
        display: block;
        font-size: 26rpx;
        color: #333333;
        margin-top: 16rpx;
      }
    }
  }
}

.form-container {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #F5F5F5;
    
    .type-name {
      font-size: 36rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .change {
      font-size: 26rpx;
      color: #4CAF50;
    }
  }
  
  .form-item {
    margin-bottom: 30rpx;
    
    .label {
      display: block;
      font-size: 28rpx;
      color: #333333;
      margin-bottom: 16rpx;
    }
    
    input {
      width: 100%;
      height: 88rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      padding: 0 24rpx;
      font-size: 32rpx;
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
      height: 88rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      padding: 0 24rpx;
      font-size: 30rpx;
      color: #333333;
      
      .iconfont {
        color: #CCCCCC;
      }
    }
    
    .sub-options {
      display: flex;
      gap: 20rpx;
      margin-top: 16rpx;
      
      .sub-option {
        flex: 1;
        text-align: center;
        padding: 16rpx 0;
        background: #F5F5F5;
        border-radius: 8rpx;
        font-size: 26rpx;
        color: #666666;
        
        &.active {
          background: #E8F5E9;
          color: #4CAF50;
        }
      }
    }
  }
  
  .form-group {
    display: flex;
    gap: 20rpx;
    
    .form-item {
      flex: 1;
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
}
</style>
