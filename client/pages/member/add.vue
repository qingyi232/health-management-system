<template>
  <view class="add-member-page">
    <view class="form-container">
      <view class="form-item">
        <text class="label">姓名 <text class="required">*</text></text>
        <input v-model="form.name" type="text" placeholder="请输入姓名" />
      </view>
      
      <view class="form-item">
        <text class="label">关系 <text class="required">*</text></text>
        <picker :range="relationOptions" @change="onRelationChange">
          <view class="picker-value">
            {{ form.relation || '请选择关系' }}
            <text class="iconfont icon-right"></text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">性别 <text class="required">*</text></text>
        <view class="gender-options">
          <view 
            class="gender-item" 
            :class="{ active: form.gender === 'male' }"
            @click="form.gender = 'male'"
          >
            <text class="iconfont icon-male"></text>
            <text>男</text>
          </view>
          <view 
            class="gender-item" 
            :class="{ active: form.gender === 'female' }"
            @click="form.gender = 'female'"
          >
            <text class="iconfont icon-female"></text>
            <text>女</text>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">出生日期 <text class="required">*</text></text>
        <picker mode="date" :end="today" @change="onDateChange">
          <view class="picker-value">
            {{ form.birth_date || '请选择出生日期' }}
            <text class="iconfont icon-right"></text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="form.phone" type="number" placeholder="请输入手机号（选填）" maxlength="11" />
      </view>
    </view>
    
    <button class="btn-submit" @click="handleSubmit" :loading="loading">
      {{ isEdit ? '保存修改' : '添加成员' }}
    </button>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { addMember, getMemberDetail, updateMember } from '@/services/member'

const relationOptions = ['本人', '配偶', '父亲', '母亲', '儿子', '女儿', '爷爷', '奶奶', '外公', '外婆', '其他']

const form = ref({
  name: '',
  relation: '',
  gender: '',
  birth_date: '',
  phone: ''
})

const loading = ref(false)
const memberId = ref(null)
const isEdit = computed(() => !!memberId.value)

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const onRelationChange = (e) => {
  form.value.relation = relationOptions[e.detail.value]
}

const onDateChange = (e) => {
  form.value.birth_date = e.detail.value
}

const loadMember = async () => {
  if (!memberId.value) return
  try {
    const res = await getMemberDetail(memberId.value)
    form.value = {
      name: res.data.name,
      relation: res.data.relation,
      gender: res.data.gender,
      birth_date: res.data.birth_date?.split('T')[0],
      phone: res.data.phone || ''
    }
  } catch (error) {
    console.error('加载成员信息失败:', error)
  }
}

const handleSubmit = async () => {
  if (!form.value.name) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }
  if (!form.value.relation) {
    uni.showToast({ title: '请选择关系', icon: 'none' })
    return
  }
  if (!form.value.gender) {
    uni.showToast({ title: '请选择性别', icon: 'none' })
    return
  }
  if (!form.value.birth_date) {
    uni.showToast({ title: '请选择出生日期', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    if (isEdit.value) {
      await updateMember(memberId.value, form.value)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await addMember(form.value)
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  if (options.id) {
    memberId.value = options.id
    uni.setNavigationBarTitle({ title: '编辑成员' })
    loadMember()
  }
})
</script>

<style lang="scss" scoped>
.add-member-page {
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
      margin-bottom: 20rpx;
      
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
    
    .gender-options {
      display: flex;
      gap: 30rpx;
      
      .gender-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 80rpx;
        background: #F5F5F5;
        border-radius: 12rpx;
        font-size: 30rpx;
        color: #666666;
        
        .iconfont {
          margin-right: 10rpx;
        }
        
        &.active {
          background: #E8F5E9;
          color: #4CAF50;
        }
      }
    }
  }
}

.btn-submit {
  margin-top: 60rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #ffffff;
  border: none;
  border-radius: 50rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 34rpx;
}
</style>
