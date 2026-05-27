<template>
  <view class="icon-wrapper" :style="{ width: size, height: size }">
    <image :src="iconSrc" mode="aspectFit" :style="{ width: size, height: size }" />
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: '48rpx'
  },
  color: {
    type: String,
    default: ''
  }
})

const iconSrc = computed(() => {
  return `/static/icons/${props.name}.svg`
})
</script>

<style scoped>
.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
