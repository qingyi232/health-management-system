<template>
  <view class="bind-device-page">
    <view class="step-indicator">
      <view class="step" :class="{ active: step >= 1, done: step > 1 }">
        <text class="step-num">1</text>
        <text class="step-name">选择设备</text>
      </view>
      <view class="step-line"></view>
      <view class="step" :class="{ active: step >= 2, done: step > 2 }">
        <text class="step-num">2</text>
        <text class="step-name">选择成员</text>
      </view>
      <view class="step-line"></view>
      <view class="step" :class="{ active: step >= 3 }">
        <text class="step-num">3</text>
        <text class="step-name">完成绑定</text>
      </view>
    </view>
    
    <view class="step-content" v-if="step === 1">
      <view class="section-title">选择设备类型</view>
      <view class="device-type-list">
        <view 
          class="device-type-item" 
          v-for="type in deviceTypes" 
          :key="type.type"
          :class="{ selected: selectedType?.type === type.type }"
          @click="selectType(type)"
        >
          <view class="type-icon">
            <text class="iconfont" :class="type.icon"></text>
          </view>
          <text class="type-name">{{ type.name }}</text>
          <text class="type-data">{{ type.supportedData.join('、') }}</text>
        </view>
      </view>
      <button class="btn-next" @click="nextStep" :disabled="!selectedType">下一步</button>
    </view>
    
    <view class="step-content" v-if="step === 2">
      <view class="section-title">选择绑定成员</view>
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
            <text class="relation">{{ member.relation }}</text>
          </view>
          <text class="iconfont icon-check" v-if="selectedMember?.id === member.id"></text>
        </view>
      </view>
      <view class="btn-group">
        <button class="btn-prev" @click="prevStep">上一步</button>
        <button class="btn-next" @click="nextStep" :disabled="!selectedMember">下一步</button>
      </view>
    </view>
    
    <view class="step-content" v-if="step === 3">
      <view class="section-title">连接设备</view>
      
      <view class="connect-tabs">
        <view class="connect-tab" :class="{ active: connectMode === 'ble' }" @click="connectMode = 'ble'">蓝牙扫描</view>
        <view class="connect-tab" :class="{ active: connectMode === 'manual' }" @click="connectMode = 'manual'">手动输入</view>
      </view>
      
      <view v-if="connectMode === 'ble'" class="ble-section">
        <button class="btn-scan" @click="startBleScan" :loading="scanning" :disabled="scanning">
          {{ scanning ? '正在扫描...' : '开始扫描附近设备' }}
        </button>
        
        <view class="ble-device-list" v-if="bleDevices.length > 0">
          <view 
            class="ble-device-item" 
            v-for="dev in bleDevices" 
            :key="dev.deviceId"
            :class="{ selected: selectedBleDevice?.deviceId === dev.deviceId, connecting: connectingDeviceId === dev.deviceId }"
            @click="selectBleDevice(dev)"
          >
            <view class="ble-device-icon">
              <text class="iconfont icon-bluetooth"></text>
            </view>
            <view class="ble-device-info">
              <text class="ble-name">{{ dev.name || '未知设备' }}</text>
              <text class="ble-id">{{ dev.deviceId }}</text>
              <text class="ble-rssi">信号强度：{{ dev.RSSI }}dBm</text>
            </view>
            <view class="ble-status">
              <text v-if="connectingDeviceId === dev.deviceId" class="status-text connecting">连接中...</text>
              <text v-else-if="selectedBleDevice?.deviceId === dev.deviceId" class="status-text connected">已选择</text>
            </view>
          </view>
        </view>
        
        <view class="ble-empty" v-else-if="!scanning && bleScanned">
          <text>未发现蓝牙设备，请确保设备已开启蓝牙</text>
        </view>
        
        <view class="ble-tip" v-if="bleConnected">
          <text class="iconfont icon-check" style="color:#4CAF50"></text>
          <text>已成功连接：{{ selectedBleDevice?.name }}</text>
        </view>
        
        <view class="form-item" v-if="selectedBleDevice">
          <text class="label">设备备注名</text>
          <input v-model="deviceName" type="text" :placeholder="selectedBleDevice?.name || '输入备注名'" />
        </view>
      </view>
      
      <view v-if="connectMode === 'manual'" class="manual-section">
        <view class="form-item">
          <text class="label">设备名称</text>
          <input v-model="deviceName" type="text" placeholder="如：爸爸的手环" />
        </view>
        <view class="form-item">
          <text class="label">设备ID/序列号</text>
          <input v-model="deviceId" type="text" placeholder="请输入设备ID或序列号" />
        </view>
        <view class="tip">
          <text class="iconfont icon-info"></text>
          <text>设备ID通常在设备背面或包装盒上，也可在设备APP中查看</text>
        </view>
      </view>
      
      <view class="btn-group">
        <button class="btn-prev" @click="prevStep">上一步</button>
        <button class="btn-submit" @click="handleBind" :loading="loading">完成绑定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getDeviceTypes, bindDevice } from '@/services/device'
import { getMemberList } from '@/services/member'
import { getServerUrl } from '@/utils/request'

const step = ref(1)
const deviceTypes = ref([])
const members = ref([])
const selectedType = ref(null)
const selectedMember = ref(null)
const deviceName = ref('')
const deviceId = ref('')
const loading = ref(false)
const connectMode = ref('ble')
const scanning = ref(false)
const bleScanned = ref(false)
const bleDevices = ref([])
const selectedBleDevice = ref(null)
const connectingDeviceId = ref('')
const bleConnected = ref(false)

const dataTypeNames = {
  heart_rate: '心率',
  steps: '步数',
  sleep: '睡眠',
  blood_pressure: '血压',
  blood_sugar: '血糖',
  weight: '体重',
  temperature: '体温'
}

const loadDeviceTypes = async () => {
  try {
    const res = await getDeviceTypes()
    deviceTypes.value = res.data.map(t => ({
      ...t,
      supportedData: t.supportedData.map(d => dataTypeNames[d] || d)
    }))
  } catch (error) {
    console.error('加载设备类型失败:', error)
    deviceTypes.value = [
      { type: 'smart_band', name: '智能手环', icon: 'icon-watch', supportedData: ['心率', '步数', '睡眠'] },
      { type: 'blood_pressure', name: '智能血压计', icon: 'icon-heart', supportedData: ['血压'] },
      { type: 'blood_sugar', name: '智能血糖仪', icon: 'icon-droplet', supportedData: ['血糖'] },
      { type: 'scale', name: '智能体重秤', icon: 'icon-scale', supportedData: ['体重'] }
    ]
  }
}

const loadMembers = async () => {
  try {
    const res = await getMemberList()
    members.value = res.data
  } catch (error) {
    console.error('加载成员失败:', error)
  }
}

const selectType = (type) => {
  selectedType.value = type
}

const selectMember = (member) => {
  selectedMember.value = member
}

const nextStep = () => {
  if (step.value < 3) {
    step.value++
  }
}

const prevStep = () => {
  if (step.value > 1) {
    step.value--
  }
}

const startBleScan = async () => {
  bleDevices.value = []
  bleScanned.value = false
  selectedBleDevice.value = null
  bleConnected.value = false
  scanning.value = true
  
  try {
    await new Promise((resolve, reject) => {
      uni.openBluetoothAdapter({
        success: resolve,
        fail: (err) => {
          if (err.errCode === 10001) {
            reject(new Error('请先开启手机蓝牙'))
          } else {
            reject(new Error('蓝牙初始化失败：' + (err.errMsg || '')))
          }
        }
      })
    })
    
    uni.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) return
        const exists = bleDevices.value.find(d => d.deviceId === device.deviceId)
        if (!exists) {
          bleDevices.value.push({
            deviceId: device.deviceId,
            name: device.name || device.localName || '未知设备',
            RSSI: device.RSSI,
            advertisServiceUUIDs: device.advertisServiceUUIDs || []
          })
        } else {
          exists.RSSI = device.RSSI
        }
      })
    })
    
    await new Promise((resolve, reject) => {
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: resolve,
        fail: reject
      })
    })
    
    setTimeout(() => {
      uni.stopBluetoothDevicesDiscovery({ success: () => {} })
      scanning.value = false
      bleScanned.value = true
      if (bleDevices.value.length === 0) {
        uni.showToast({ title: '未发现附近蓝牙设备', icon: 'none' })
      }
    }, 8000)
    
  } catch (error) {
    scanning.value = false
    bleScanned.value = true
    uni.showToast({ title: error.message || '蓝牙扫描失败', icon: 'none' })
  }
}

const selectBleDevice = async (dev) => {
  if (connectingDeviceId.value) return
  connectingDeviceId.value = dev.deviceId
  
  try {
    uni.stopBluetoothDevicesDiscovery({ success: () => {} })
    scanning.value = false
    
    await new Promise((resolve, reject) => {
      uni.createBLEConnection({
        deviceId: dev.deviceId,
        timeout: 10000,
        success: resolve,
        fail: reject
      })
    })
    
    selectedBleDevice.value = dev
    deviceId.value = dev.deviceId
    deviceName.value = dev.name || ''
    bleConnected.value = true
    
    try {
      const services = await new Promise((resolve, reject) => {
        uni.getBLEDeviceServices({
          deviceId: dev.deviceId,
          success: (res) => resolve(res.services),
          fail: reject
        })
      })
      console.log('BLE服务列表:', services.map(s => s.uuid))
      
      const healthServices = ['0000180D', '00001810', '00001809', '00001808']
      for (const service of services) {
        const sUUID = service.uuid.toUpperCase().replace(/-/g, '')
        if (healthServices.some(hs => sUUID.includes(hs))) {
          try {
            const chars = await new Promise((resolve, reject) => {
              uni.getBLEDeviceCharacteristics({
                deviceId: dev.deviceId,
                serviceId: service.uuid,
                success: (res) => resolve(res.characteristics),
                fail: reject
              })
            })
            console.log(`服务 ${service.uuid} 的特征值:`, chars.map(c => c.uuid))
            
            for (const char of chars) {
              if (char.properties.notify || char.properties.indicate) {
                uni.notifyBLECharacteristicValueChange({
                  deviceId: dev.deviceId,
                  serviceId: service.uuid,
                  characteristicId: char.uuid,
                  state: true,
                  success: () => console.log('已订阅特征值:', char.uuid),
                  fail: () => {}
                })
              }
            }
          } catch (e) {
            console.warn('读取特征值失败:', e)
          }
        }
      }
    } catch (e) {
      console.warn('获取BLE服务失败:', e)
    }
    
    uni.showToast({ title: '设备连接成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '连接失败，请重试', icon: 'none' })
  } finally {
    connectingDeviceId.value = ''
  }
}

const closeBleConnection = () => {
  if (selectedBleDevice.value) {
    uni.closeBLEConnection({
      deviceId: selectedBleDevice.value.deviceId,
      success: () => {},
      fail: () => {}
    })
  }
  uni.closeBluetoothAdapter({ success: () => {}, fail: () => {} })
}

onBeforeUnmount(() => {
  closeBleConnection()
})

const handleBind = async () => {
  if (connectMode.value === 'ble') {
    if (!selectedBleDevice.value) {
      uni.showToast({ title: '请先扫描并选择设备', icon: 'none' })
      return
    }
  } else {
    if (!deviceName.value) {
      uni.showToast({ title: '请输入设备名', icon: 'none' })
      return
    }
    if (!deviceId.value) {
      uni.showToast({ title: '请输入设备ID', icon: 'none' })
      return
    }
  }
  
  loading.value = true
  try {
    await bindDevice({
      device_type: selectedType.value.type,
      device_name: deviceName.value || selectedBleDevice.value?.name || '蓝牙设备',
      device_id: deviceId.value,
      member_id: selectedMember.value.id
    })
    closeBleConnection()
    uni.showToast({ title: '绑定成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('绑定失败:', error)
  } finally {
    loading.value = false
  }
}

onShow(() => {
  loadDeviceTypes()
  loadMembers()
})
</script>

<style lang="scss" scoped>
.bind-device-page {
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

.device-type-list {
  .device-type-item {
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
    
    .type-icon {
      width: 80rpx;
      height: 80rpx;
      background: #F5F5F5;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      
      .iconfont {
        font-size: 40rpx;
        color: #4CAF50;
      }
    }
    
    .type-name {
      font-size: 30rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .type-data {
      flex: 1;
      text-align: right;
      font-size: 24rpx;
      color: #999999;
    }
  }
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
      
      .relation {
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

.connect-tabs {
  display: flex;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
  
  .connect-tab {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    font-size: 28rpx;
    color: #666666;
    border-radius: 10rpx;
    
    &.active {
      background: #ffffff;
      color: #4CAF50;
      font-weight: bold;
      box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
    }
  }
}

.ble-section {
  .btn-scan {
    background: linear-gradient(135deg, #2196F3, #1976D2);
    color: #ffffff;
    border: none;
    border-radius: 12rpx;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 30rpx;
    margin-bottom: 24rpx;
  }
  
  .ble-device-list {
    .ble-device-item {
      display: flex;
      align-items: center;
      padding: 20rpx;
      border: 2rpx solid #E5E5E5;
      border-radius: 12rpx;
      margin-bottom: 16rpx;
      transition: all 0.2s;
      
      &.selected {
        border-color: #4CAF50;
        background: #E8F5E9;
      }
      
      &.connecting {
        opacity: 0.7;
      }
      
      .ble-device-icon {
        width: 72rpx;
        height: 72rpx;
        background: #E3F2FD;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;
        
        .iconfont {
          font-size: 36rpx;
          color: #2196F3;
        }
      }
      
      .ble-device-info {
        flex: 1;
        
        .ble-name {
          display: block;
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
        }
        
        .ble-id {
          display: block;
          font-size: 20rpx;
          color: #999;
          margin-top: 4rpx;
        }
        
        .ble-rssi {
          display: block;
          font-size: 22rpx;
          color: #666;
          margin-top: 4rpx;
        }
      }
      
      .ble-status {
        .status-text {
          font-size: 24rpx;
          
          &.connecting { color: #FF9800; }
          &.connected { color: #4CAF50; font-weight: bold; }
        }
      }
    }
  }
  
  .ble-empty {
    text-align: center;
    padding: 40rpx 0;
    
    text { font-size: 26rpx; color: #999; }
  }
  
  .ble-tip {
    display: flex;
    align-items: center;
    background: #E8F5E9;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 24rpx;
    
    .iconfont { font-size: 36rpx; margin-right: 12rpx; }
    text:last-child { font-size: 26rpx; color: #333; }
  }
}

.form-item {
  margin-bottom: 24rpx;
  
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
    font-size: 30rpx;
    box-sizing: border-box;
  }
}

.tip {
  display: flex;
  align-items: flex-start;
  background: #FFF3E0;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
  
  .iconfont {
    font-size: 32rpx;
    color: #FF9800;
    margin-right: 12rpx;
  }
  
  text:last-child {
    flex: 1;
    font-size: 24rpx;
    color: #666666;
    line-height: 1.5;
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
