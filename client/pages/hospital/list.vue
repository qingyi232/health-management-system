<template>
  <view class="hospital-page">
    <view class="search-bar">
      <text class="iconfont icon-search"></text>
      <input v-model="keyword" type="text" placeholder="搜索医院" @confirm="handleSearch" />
    </view>
    
    <view class="location-bar" @click="getNearby">
      <text class="iconfont icon-location"></text>
      <text v-if="locating" class="locating">定位中...</text>
      <text v-else-if="currentAddress">{{ currentAddress }}</text>
      <text v-else>点击定位查看附近医院</text>
      <text class="refresh" v-if="currentAddress && !locating">刷新</text>
    </view>
    
    <view id="mapContainer" class="map-container" v-if="showMap"></view>
    
    <view class="hospital-list" v-if="hospitals.length > 0">
      <view 
        class="hospital-item" 
        v-for="hospital in hospitals" 
        :key="hospital.id"
        @click="goDetail(hospital)"
      >
        <image class="hospital-image" :src="hospital.image || '/static/hospital.svg'" mode="aspectFill"></image>
        <view class="hospital-info">
          <view class="name-row">
            <text class="name">{{ hospital.name }}</text>
            <text class="level">{{ hospital.level }}</text>
            <text class="source-tag" v-if="hospital.source === 'amap'">实时</text>
          </view>
          <text class="address">{{ hospital.address }}</text>
          <view class="meta-row">
            <text class="distance" v-if="hospital.distance !== undefined">{{ hospital.distance }}km</text>
            <text class="phone" v-if="hospital.phone">{{ hospital.phone }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <text>暂无医院信息</text>
    </view>
    
    <view class="quick-actions">
      <view class="action-btn" @click="goAppointments">
        <text class="iconfont icon-list"></text>
        <text>挂号记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getHospitalList, getNearbyHospitals, reverseGeocode, importHospital, getIpLocation } from '@/services/hospital'

const keyword = ref('')
const hospitals = ref([])
const currentAddress = ref('')
const showMap = ref(false)
const userLat = ref(0)
const userLng = ref(0)
const locating = ref(false)
let mapInstance = null

const loadHospitals = async () => {
  try {
    const res = await getHospitalList({ keyword: keyword.value || undefined })
    hospitals.value = res.data.list
  } catch (error) {
    console.error('加载医院列表失败:', error)
  }
}

const handleSearch = () => {
  loadHospitals()
}

const getLocationByGPS = () => {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.getLocation({
      type: 'gcj02',
      geocode: true,
      success: res => resolve({ latitude: res.latitude, longitude: res.longitude, source: 'gps' }),
      fail: () => reject(new Error('GPS定位失败'))
    })
    // #endif
    // #ifdef H5
    if (typeof AMap !== 'undefined' && AMap.Geolocation) {
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: false,
        timeout: 10000,
        noIpLocate: 0,
        GeoLocationFirst: false,
        maximumAge: 60000,
        convert: true
      })
      geolocation.getCurrentPosition((status, result) => {
        if (result && result.position) {
          resolve({
            latitude: result.position.getLat(),
            longitude: result.position.getLng(),
            address: result.formattedAddress || '',
            source: status === 'complete' ? 'amap-gps' : 'amap-ip'
          })
        } else {
          reject(new Error('高德定位失败: ' + (result?.message || '')))
        }
      })
    } else if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, source: 'browser' }),
        () => reject(new Error('浏览器定位失败')),
        { enableHighAccuracy: false, timeout: 10000 }
      )
    } else {
      reject(new Error('无GPS定位能力'))
    }
    // #endif
    // #ifdef MP-WEIXIN
    uni.getLocation({
      type: 'gcj02',
      success: res => resolve({ latitude: res.latitude, longitude: res.longitude, source: 'wx' }),
      fail: (err) => {
        console.error('uni.getLocation 详细错误:', JSON.stringify(err))
        reject(new Error('小程序定位失败: ' + (err.errMsg || JSON.stringify(err))))
      }
    })
    // #endif
  })
}

const getLocationByCitySearch = () => {
  return new Promise((resolve, reject) => {
    if (typeof AMap === 'undefined' || !AMap.CitySearch) {
      return reject(new Error('CitySearch不可用'))
    }
    const citySearch = new AMap.CitySearch()
    citySearch.getLocalCity((status, result) => {
      if (status === 'complete' && result.info === 'OK' && result.bounds) {
        const center = result.bounds.getCenter()
        resolve({
          latitude: center.getLat(),
          longitude: center.getLng(),
          address: result.city || '',
          source: 'citysearch'
        })
      } else {
        reject(new Error('CitySearch定位失败'))
      }
    })
  })
}

const getUserLocation = async () => {
  try {
    const gpsResult = await getLocationByGPS()
    if (gpsResult.latitude && gpsResult.longitude) {
      console.log('定位成功 [' + gpsResult.source + ']:', gpsResult.latitude, gpsResult.longitude)
      return gpsResult
    }
  } catch (e) {
    console.warn('GPS/高德定位失败:', e.message)
  }

  try {
    const cityResult = await getLocationByCitySearch()
    if (cityResult.latitude && cityResult.longitude) {
      console.log('CitySearch定位成功:', cityResult.latitude, cityResult.longitude)
      return cityResult
    }
  } catch (e) {
    console.warn('CitySearch定位失败:', e.message)
  }

  try {
    const ipRes = await getIpLocation()
    if (ipRes.data.latitude && ipRes.data.longitude) {
      console.log('服务端IP定位:', ipRes.data.latitude, ipRes.data.longitude)
      return {
        latitude: ipRes.data.latitude,
        longitude: ipRes.data.longitude,
        address: ipRes.data.address,
        source: 'server-ip'
      }
    }
  } catch (e) {
    console.warn('服务端IP定位失败:', e.message)
  }

  console.warn('所有定位方式均失败，使用默认位置')
  return {
    latitude: 39.9042,
    longitude: 116.4074,
    address: '北京市',
    source: 'default'
  }
}

const initMap = (lat, lng, hospitalList) => {
  if (typeof AMap === 'undefined') return
  showMap.value = true
  nextTick(() => {
    const container = document.getElementById('mapContainer')
    if (!container) return
    if (mapInstance) { mapInstance.destroy(); mapInstance = null }
    mapInstance = new AMap.Map('mapContainer', {
      zoom: 13,
      center: new AMap.LngLat(lng, lat),
      resizeEnable: true
    })
    const userMarker = new AMap.Marker({
      position: new AMap.LngLat(lng, lat),
      title: '我的位置'
    })
    userMarker.setLabel({ content: '<div style="color:#e00;font-size:12px;white-space:nowrap;">我的位置</div>', offset: new AMap.Pixel(0, -5) })
    mapInstance.add(userMarker)
    const markers = [userMarker]
    hospitalList.forEach(h => {
      if (h.latitude && h.longitude) {
        const m = new AMap.Marker({
          position: new AMap.LngLat(h.longitude, h.latitude),
          title: h.name
        })
        m.setLabel({ content: '<div style="font-size:12px;white-space:nowrap;">' + h.name + '</div>', offset: new AMap.Pixel(0, -5) })
        mapInstance.add(m)
        markers.push(m)
      }
    })
    mapInstance.setFitView(markers, false, [60, 60, 60, 60])
  })
}

const getNearby = async () => {
  locating.value = true
  uni.showLoading({ title: '定位中...' })
  try {
    const pos = await getUserLocation()
    userLat.value = pos.latitude
    userLng.value = pos.longitude
    
    if (pos.address) {
      currentAddress.value = pos.address
    } else {
      try {
        const geoRes = await reverseGeocode({ latitude: pos.latitude, longitude: pos.longitude })
        if (geoRes.data.address) {
          currentAddress.value = geoRes.data.address
        } else {
          currentAddress.value = `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`
        }
      } catch (e) {
        currentAddress.value = `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`
      }
    }
    
    const nearbyRes = await getNearbyHospitals({
      latitude: pos.latitude,
      longitude: pos.longitude,
      radius: 10
    })
    hospitals.value = nearbyRes.data
    uni.hideLoading()
    locating.value = false
    
    initMap(pos.latitude, pos.longitude, nearbyRes.data)
  } catch (error) {
    uni.hideLoading()
    locating.value = false
    // #ifdef MP-WEIXIN
    uni.showModal({
      title: '定位失败',
      content: '请在微信设置中允许该小程序使用位置信息',
      confirmText: '去设置',
      cancelText: '暂不',
      success: (res) => {
        if (res.confirm) {
          uni.openSetting()
        }
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    uni.showToast({ title: '定位失败，显示默认医院', icon: 'none' })
    // #endif
    loadHospitals()
  }
}

const goDetail = async (hospital) => {
  if (hospital.source === 'amap') {
    uni.showLoading({ title: '加载中...' })
    try {
      const res = await importHospital({
        name: hospital.name,
        level: hospital.level,
        address: hospital.address,
        phone: hospital.phone,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        distance: hospital.distance
      })
      uni.hideLoading()
      uni.navigateTo({ url: `/pages/hospital/detail?id=${res.data.id}` })
    } catch (error) {
      uni.hideLoading()
      console.error('导入医院失败:', error)
      uni.showToast({ title: '加载失败，请重试', icon: 'none' })
    }
    return
  }
  uni.navigateTo({ url: `/pages/hospital/detail?id=${hospital.id}` })
}

const goAppointments = () => {
  uni.navigateTo({ url: '/pages/appointment/list' })
}

onShow(() => {
  loadHospitals()
})
</script>

<style lang="scss" scoped>
.hospital-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
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

.location-bar {
  display: flex;
  align-items: center;
  background: #E8F5E9;
  margin: 0 20rpx 20rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  
  .iconfont {
    font-size: 32rpx;
    color: #4CAF50;
    margin-right: 12rpx;
  }
  
  text {
    font-size: 26rpx;
    color: #4CAF50;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .locating {
    color: #FF9800 !important;
  }
  
  .refresh {
    flex: none;
    font-size: 24rpx;
    color: #999;
    margin-left: 12rpx;
  }
}

.map-container {
  height: 400rpx;
  margin: 0 20rpx 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.hospital-list {
  padding: 0 20rpx;
  
  .hospital-item {
    display: flex;
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .hospital-image {
      width: 160rpx;
      height: 120rpx;
      border-radius: 12rpx;
      margin-right: 20rpx;
    }
    
    .hospital-info {
      flex: 1;
      
      .name-row {
        display: flex;
        align-items: center;
        
        .name {
          font-size: 32rpx;
          font-weight: bold;
          color: #333333;
        }
        
        .level {
          font-size: 22rpx;
          color: #FF9800;
          background: #FFF3E0;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          margin-left: 12rpx;
        }
        
        .source-tag {
          font-size: 20rpx;
          color: #2196F3;
          background: #E3F2FD;
          padding: 4rpx 10rpx;
          border-radius: 6rpx;
          margin-left: 8rpx;
        }
      }
      
      .address {
        display: block;
        font-size: 24rpx;
        color: #999999;
        margin-top: 12rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .meta-row {
        display: flex;
        align-items: center;
        margin-top: 12rpx;
        
        .distance {
          font-size: 24rpx;
          color: #4CAF50;
          margin-right: 20rpx;
        }
        
        .phone {
          font-size: 24rpx;
          color: #666666;
        }
      }
    }
  }
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
  font-size: 28rpx;
}

.quick-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #F5F5F5;
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: #ffffff;
    padding: 24rpx;
    border-radius: 50rpx;
    
    .iconfont {
      font-size: 32rpx;
      margin-right: 12rpx;
    }
    
    text:last-child {
      font-size: 30rpx;
    }
  }
}
</style>
