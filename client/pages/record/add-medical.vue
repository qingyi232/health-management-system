<template>
  <view class="add-medical-page">
    <view class="form-container">
      <view class="form-item">
        <text class="label">医院名称 <text class="required">*</text></text>
        <input v-model="form.hospital_name" type="text" placeholder="请输入医院名称" />
      </view>
      
      <view class="form-item">
        <text class="label">就诊科室 <text class="required">*</text></text>
        <input v-model="form.department" type="text" placeholder="请输入科室" />
      </view>
      
      <view class="form-item">
        <text class="label">主治医生</text>
        <input v-model="form.doctor_name" type="text" placeholder="请输入医生姓名" />
      </view>
      
      <view class="form-item">
        <text class="label">就诊日期 <text class="required">*</text></text>
        <picker mode="date" :end="today" @change="onDateChange">
          <view class="picker-value">
            {{ form.visit_date || '请选择日期' }}
            <text class="iconfont icon-right"></text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">诊断结果</text>
        <textarea v-model="form.diagnosis" placeholder="请输入诊断结果" maxlength="500"></textarea>
      </view>
      
      <view class="form-item">
        <text class="label">处方/用药</text>
        <textarea v-model="form.prescription" placeholder="请输入处方或用药信息" maxlength="500"></textarea>
      </view>
      
      <view class="form-item">
        <text class="label">备注</text>
        <textarea v-model="form.remark" placeholder="其他备注信息" maxlength="200"></textarea>
      </view>
    </view>
    
    <button class="btn-submit" @click="handleSubmit" :loading="loading">
      {{ isEdit ? '保存修改' : '添加记录' }}
    </button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { addMedicalRecord, updateMedicalRecord } from '@/services/record'
import { get } from '@/utils/request'

const form = ref({
  hospital_name: '',
  department: '',
  doctor_name: '',
  visit_date: '',
  diagnosis: '',
  prescription: '',
  remark: ''
})

const loading = ref(false)
const memberId = ref(null)
const recordId = ref(null)
const isEdit = computed(() => !!recordId.value)

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const onDateChange = (e) => {
  form.value.visit_date = e.detail.value
}

const loadRecord = async () => {
  if (!recordId.value) return
  try {
    const res = await get(`/record/medical/${memberId.value}`)
    const record = res.data.find(r => r.id == recordId.value)
    if (record) {
      form.value = {
        hospital_name: record.hospital_name,
        department: record.department,
        doctor_name: record.doctor_name || '',
        visit_date: record.visit_date?.split('T')[0] || '',
        diagnosis: record.diagnosis || '',
        prescription: record.prescription || '',
        remark: record.remark || ''
      }
    }
  } catch (error) {
    console.error('加载记录失败:', error)
  }
}

const handleSubmit = async () => {
  if (!form.value.hospital_name) {
    uni.showToast({ title: '请输入医院名称', icon: 'none' })
    return
  }
  if (!form.value.department) {
    uni.showToast({ title: '请输入就诊科室', icon: 'none' })
    return
  }
  if (!form.value.visit_date) {
    uni.showToast({ title: '请选择就诊日期', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    if (isEdit.value) {
      await updateMedicalRecord(recordId.value, form.value)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await addMedicalRecord({
        member_id: memberId.value,
        ...form.value
      })
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
  memberId.value = options.memberId
  if (options.id) {
    recordId.value = options.id
    uni.setNavigationBarTitle({ title: '编辑就医记录' })
    loadRecord()
  }
})
</script>

<style lang="scss" scoped>
.add-medical-page {
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
