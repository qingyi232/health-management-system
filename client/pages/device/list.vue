<template>
  <view class="device-list-page">
    <view class="device-list" v-if="devices.length > 0">
      <view class="device-item" v-for="device in devices" :key="device.id">
        <view class="device-icon">
          <text class="iconfont" :class="getDeviceIcon(device.device_type)"></text>
        </view>
        <view class="device-info">
          <text class="device-name">{{ device.device_name }}</text>
          <text class="device-type">{{ getDeviceTypeName(device.device_type) }}</text>
          <text class="last-sync" v-if="device.last_sync">上次同步：{{ formatTime(device.last_sync) }}</text>
        </view>
        <view class="device-actions">
          <button class="btn-sync" @click="handleSync(device.id)">同步</button>
          <text class="unbind" @click="handleUnbind(device.id)">解绑</text>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <image src="/static/empty.svg" mode="aspectFit"></image>
      <text>暂未绑定设备</text>
      <text class="sub">绑定智能设备，自动同步健康数据</text>
    </view>
    
    <view class="add-btn" @click="goBind">
      <text class="iconfont icon-plus"></text>
      <text>绑定设备</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getDeviceList, unbindDevice, syncDevice } from '@/services/device'

const devices = ref([])

const deviceTypeNames = {
  smart_band: '智能手环',
  blood_pressure: '智能血压计',
  blood_sugar: '智能血糖仪',
  scale: '智能体重秤',
  thermometer: '智能体温计'
}

const deviceIcons = {
  smart_band: 'icon-watch',
  blood_pressure: 'icon-heart',
  blood_sugar: 'icon-droplet',
  scale: 'icon-scale',
  thermometer: 'icon-thermometer'
}

const getDeviceTypeName = (type) => deviceTypeNames[type] || type
const getDeviceIcon = (type) => deviceIcons[type] || 'icon-device'

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadDevices = async () => {
  try {
    const res = await getDeviceList()
    devices.value = res.data
  } catch (error) {
    console.error('加载设备列表失败:', error)
  }
}

const handleSync = async (id) => {
  const device = devices.value.find(d => d.id === id)
  if (!device) return
  
  uni.showLoading({ title: '尝试蓝牙连接...' })
  
  let bleData = null
  try {
    await new Promise((resolve, reject) => {
      uni.openBluetoothAdapter({ success: resolve, fail: reject })
    })
    
    await new Promise((resolve, reject) => {
      uni.createBLEConnection({
        deviceId: device.device_id,
        timeout: 5000,
        success: resolve,
        fail: reject
      })
    })
    
    const services = await new Promise((resolve, reject) => {
      uni.getBLEDeviceServices({
        deviceId: device.device_id,
        success: (res) => resolve(res.services),
        fail: reject
      })
    })
    
    bleData = { source: 'ble', services: services.map(s => s.uuid) }
    
    uni.closeBLEConnection({ deviceId: device.device_id, success: () => {} })
    uni.closeBluetoothAdapter({ success: () => {} })
  } catch (bleErr) {
    try { uni.closeBluetoothAdapter({ success: () => {} }) } catch(e) {}
  }
  
  uni.showLoading({ title: bleData ? '蓝牙同步中...' : '云端同步中...' })
  try {
    const res = await syncDevice(id)
    uni.hideLoading()
    const msg = bleData
      ? `蓝牙同步成功，获取${res.data.count}条数据`
      : `云端同步成功，获取${res.data.count}条数据`
    uni.showToast({ title: msg, icon: 'none' })
    loadDevices()
  } catch (error) {
    uni.hideLoading()
    console.error('同步失败:', error)
  }
}

const handleUnbind = (id) => {
  uni.showModal({
    title: '确认解绑',
    content: '解绑后将无法自动同步该设备数据，是否继续？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await unbindDevice(id)
          uni.showToast({ title: '解绑成功', icon: 'success' })
          loadDevices()
        } catch (error) {
          console.error('解绑失败:', error)
        }
      }
    }
  })
}

const goBind = () => {
  uni.navigateTo({ url: '/pages/device/bind' })
}

onShow(() => {
  loadDevices()
})
</script>

<style lang="scss" scoped>
.device-list-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 140rpx;
}

.device-list {
  .device-item {
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .device-icon {
      width: 100rpx;
      height: 100rpx;
      background: #E8F5E9;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      
      .iconfont {
        font-size: 48rpx;
        color: #4CAF50;
      }
    }
    
    .device-info {
      flex: 1;
      
      .device-name {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .device-type {
        display: block;
        font-size: 24rpx;
        color: #666666;
        margin-top: 8rpx;
      }
      
      .last-sync {
        display: block;
        font-size: 22rpx;
        color: #999999;
        margin-top: 8rpx;
      }
    }
    
    .device-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12rpx;
      
      .btn-sync {
        background: #4CAF50;
        color: #ffffff;
        font-size: 24rpx;
        padding: 12rpx 24rpx;
        border-radius: 30rpx;
        border: none;
        line-height: 1;
      }
      
      .unbind {
        font-size: 22rpx;
        color: #999999;
      }
    }
  }
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }
  
  text {
    display: block;
    font-size: 28rpx;
    color: #999999;
  }
  
  .sub {
    font-size: 24rpx;
    color: #CCCCCC;
    margin-top: 12rpx;
  }
}

.add-btn {
  position: fixed;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #ffffff;
  padding: 24rpx 60rpx;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3);
  
  .iconfont {
    font-size: 32rpx;
    margin-right: 12rpx;
  }
  
  text:last-child {
    font-size: 30rpx;
  }
}
</style>
