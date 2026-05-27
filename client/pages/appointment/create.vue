<template>
  <view class="appointment-page">
    <view class="step-indicator">
      <view class="step" :class="{ active: step >= 1, done: step > 1 }">
        <text class="step-num">1</text>
        <text class="step-name">选择就诊人</text>
      </view>
      <view class="step-line"></view>
      <view class="step" :class="{ active: step >= 2, done: step > 2 }">
        <text class="step-num">2</text>
        <text class="step-name">选择时间</text>
      </view>
      <view class="step-line"></view>
      <view class="step" :class="{ active: step >= 3 }">
        <text class="step-num">3</text>
        <text class="step-name">确认信息</text>
      </view>
    </view>
    
    <view class="step-content" v-if="step === 1">
      <view class="section-title">选择就诊人</view>
      <view class="member-list">
        <view 
          class="member-item" 
          v-for="member in members" 
          :key="member.id"
          :class="{ selected: selectedMember?.id === member.id }"
          @click="selectMember(member)"
        >
          <image class="avatar" :src="member.avatar ? getServerUrl(member.avatar) : '/static/default-avatar.svg'" mode="aspectFill"></image>
          <view class="info">
            <text class="name">{{ member.name }}</text>
            <text class="detail">{{ member.relation }} · {{ member.gender === 'male' ? '男' : '女' }}</text>
          </view>
          <text class="iconfont icon-check" v-if="selectedMember?.id === member.id"></text>
        </view>
      </view>
      <button class="btn-next" @click="nextStep" :disabled="!selectedMember">下一步</button>
    </view>
    
    <view class="step-content" v-if="step === 2">
      <view class="section-title">选择就诊时间</view>
      <view class="date-picker">
        <scroll-view scroll-x class="date-list">
          <view 
            class="date-item" 
            v-for="date in availableDates" 
            :key="date.value"
            :class="{ selected: selectedDate === date.value }"
            @click="selectDate(date.value)"
          >
            <text class="weekday">{{ date.weekday }}</text>
            <text class="day">{{ date.day }}</text>
          </view>
        </scroll-view>
      </view>
      <view class="slot-list" v-if="availableSlots.length > 0">
        <view 
          class="slot-item" 
          v-for="slot in availableSlots" 
          :key="slot.time_slot"
          :class="{ selected: selectedSlot === slot.time_slot, disabled: slot.remaining === 0 }"
          @click="selectSlot(slot)"
        >
          <text class="slot-name">{{ getSlotName(slot.time_slot) }}</text>
          <text class="slot-remaining">余{{ slot.remaining }}号</text>
        </view>
      </view>
      <view class="slot-loading" v-else-if="slotsLoading">
        <text>加载时段中...</text>
      </view>
      <view class="slot-empty" v-else-if="selectedDate">
        <text>该日期暂无可用时段，请选择其他日期</text>
      </view>
      <view class="btn-group">
        <button class="btn-prev" @click="prevStep">上一步</button>
        <button class="btn-next" @click="nextStep" :disabled="!selectedDate || !selectedSlot">下一步</button>
      </view>
    </view>
    
    <view class="step-content" v-if="step === 3">
      <view class="section-title">确认预约信息</view>
      <view class="confirm-card">
        <view class="confirm-item">
          <text class="label">就诊人</text>
          <text class="value">{{ selectedMember?.name }}</text>
        </view>
        <view class="confirm-item">
          <text class="label">就诊医院</text>
          <text class="value">{{ doctorInfo.hospital_name }}</text>
        </view>
        <view class="confirm-item">
          <text class="label">就诊科室</text>
          <text class="value">{{ doctorInfo.department_name }}</text>
        </view>
        <view class="confirm-item">
          <text class="label">就诊医生</text>
          <text class="value">{{ doctorInfo.name }} {{ doctorInfo.title }}</text>
        </view>
        <view class="confirm-item">
          <text class="label">就诊时间</text>
          <text class="value">{{ formatDate(selectedDate) }} {{ getSlotName(selectedSlot) }}</text>
        </view>
      </view>
      <view class="symptoms-input">
        <text class="label">症状描述（选填）</text>
        <textarea v-model="symptoms" placeholder="请简要描述您的症状，方便医生提前了解病情" maxlength="200"></textarea>
      </view>
      <view class="btn-group">
        <button class="btn-prev" @click="prevStep">上一步</button>
        <button class="btn-submit" @click="handleSubmit" :loading="loading">确认预约</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMemberList } from '@/services/member'
import { getDoctorDetail } from '@/services/hospital'
import { createAppointment, getAvailableSlots } from '@/services/appointment'
import { getServerUrl } from '@/utils/request'

const step = ref(1)
const members = ref([])
const selectedMember = ref(null)
const selectedDate = ref('')
const selectedSlot = ref('')
const symptoms = ref('')
const loading = ref(false)
const slotsLoading = ref(false)
const doctorInfo = ref({})
const availableSlots = ref([])

const doctorId = ref(null)
const hospitalId = ref(null)
const departmentId = ref(null)

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const availableDates = computed(() => {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push({
      value: d.toISOString().split('T')[0],
      weekday: i === 0 ? '今天' : i === 1 ? '明天' : weekDays[d.getDay()],
      day: `${d.getMonth() + 1}/${d.getDate()}`
    })
  }
  return dates
})

const getSlotName = (slot) => {
  const slots = { morning: '上午', afternoon: '下午', evening: '晚间' }
  return slots[slot] || slot
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
}

const loadMembers = async () => {
  try {
    const res = await getMemberList()
    members.value = res.data
  } catch (error) {
    console.error('加载成员失败:', error)
  }
}

const loadDoctorInfo = async () => {
  try {
    const res = await getDoctorDetail(doctorId.value)
    doctorInfo.value = res.data
  } catch (error) {
    console.error('加载医生信息失败:', error)
  }
}

const loadSlots = async () => {
  if (!selectedDate.value) return
  slotsLoading.value = true
  availableSlots.value = []
  try {
    const res = await getAvailableSlots(doctorId.value, { date: selectedDate.value })
    availableSlots.value = res.data || []
  } catch (error) {
    console.error('加载可用时段失败:', error)
    availableSlots.value = [
      { time_slot: 'morning', remaining: 10 },
      { time_slot: 'afternoon', remaining: 8 }
    ]
  } finally {
    slotsLoading.value = false
  }
}

const selectMember = (member) => {
  selectedMember.value = member
}

const selectDate = (date) => {
  selectedDate.value = date
  selectedSlot.value = ''
  loadSlots()
}

const selectSlot = (slot) => {
  if (slot.remaining === 0) {
    uni.showToast({ title: '该时段已约满', icon: 'none' })
    return
  }
  selectedSlot.value = slot.time_slot
}

const nextStep = () => {
  if (step.value < 3) {
    step.value++
    if (step.value === 2 && !selectedDate.value) {
      selectedDate.value = availableDates.value[0].value
      loadSlots()
    }
  }
}

const prevStep = () => {
  if (step.value > 1) {
    step.value--
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const res = await createAppointment({
      member_id: selectedMember.value.id,
      hospital_id: hospitalId.value,
      department_id: departmentId.value,
      doctor_id: doctorId.value,
      appointment_date: selectedDate.value,
      time_slot: selectedSlot.value,
      symptoms: symptoms.value
    })
    
    uni.showModal({
      title: '预约成功',
      content: `挂号单号：${res.data.orderNo}`,
      showCancel: false,
      success: () => {
        uni.navigateTo({ url: `/pages/appointment/detail?id=${res.data.id}` })
      }
    })
  } catch (error) {
    console.error('预约失败:', error)
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  doctorId.value = options.doctorId
  hospitalId.value = options.hospitalId
  departmentId.value = options.departmentId
  
  if (options.date) {
    selectedDate.value = options.date
  }
  if (options.slot) {
    selectedSlot.value = options.slot
  }
  
  loadMembers()
  loadDoctorInfo()
})
</script>

<style lang="scss" scoped>
.appointment-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .step-num {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background: #E5E5E5;
      color: #999999;
      font-size: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .step-name {
      font-size: 22rpx;
      color: #999999;
      margin-top: 8rpx;
    }
    
    &.active {
      .step-num {
        background: #4CAF50;
        color: #ffffff;
      }
      
      .step-name {
        color: #4CAF50;
      }
    }
    
    &.done {
      .step-num {
        background: #81C784;
        color: #ffffff;
      }
    }
  }
  
  .step-line {
    width: 60rpx;
    height: 4rpx;
    background: #E5E5E5;
    margin: 0 16rpx;
  }
}

.step-content {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
}

.member-list {
  .member-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    border: 2rpx solid #E5E5E5;
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    
    &.selected {
      border-color: #4CAF50;
      background: #E8F5E9;
    }
    
    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }
    
    .info {
      flex: 1;
      
      .name {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .detail {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-top: 8rpx;
      }
    }
    
    .iconfont {
      font-size: 40rpx;
      color: #4CAF50;
    }
  }
}

.date-picker {
  margin-bottom: 24rpx;
  
  .date-list {
    white-space: nowrap;
    
    .date-item {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 20rpx 30rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      margin-right: 16rpx;
      
      &.selected {
        background: #4CAF50;
        
        .weekday, .day {
          color: #ffffff;
        }
      }
      
      .weekday {
        font-size: 24rpx;
        color: #666666;
      }
      
      .day {
        font-size: 28rpx;
        font-weight: bold;
        color: #333333;
        margin-top: 8rpx;
      }
    }
  }
}

.slot-list {
  display: flex;
  gap: 20rpx;
  
  .slot-item {
    flex: 1;
    text-align: center;
    padding: 24rpx;
    background: #F5F5F5;
    border-radius: 12rpx;
    
    &.selected {
      background: #E8F5E9;
      border: 2rpx solid #4CAF50;
    }
    
    &.disabled {
      opacity: 0.5;
    }
    
    .slot-name {
      display: block;
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .slot-remaining {
      display: block;
      font-size: 24rpx;
      color: #4CAF50;
      margin-top: 8rpx;
    }
  }
}

.slot-loading, .slot-empty {
  text-align: center;
  padding: 40rpx 0;
  color: #999999;
  font-size: 26rpx;
}

.confirm-card {
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
  
  .confirm-item {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #E5E5E5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      font-size: 28rpx;
      color: #666666;
    }
    
    .value {
      font-size: 28rpx;
      color: #333333;
      font-weight: 500;
    }
  }
}

.symptoms-input {
  margin-top: 24rpx;
  
  .label {
    display: block;
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 16rpx;
  }
  
  textarea {
    width: 100%;
    height: 160rpx;
    background: #F5F5F5;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }
}

.btn-next, .btn-submit {
  margin-top: 40rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #ffffff;
  border: none;
  border-radius: 50rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 34rpx;
  
  &:disabled {
    opacity: 0.5;
  }
}

.btn-group {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
  
  .btn-prev {
    flex: 1;
    background: #F5F5F5;
    color: #666666;
    border: none;
    border-radius: 50rpx;
    height: 96rpx;
    line-height: 96rpx;
    font-size: 34rpx;
  }
  
  .btn-next, .btn-submit {
    flex: 2;
    margin-top: 0;
  }
}
</style>
