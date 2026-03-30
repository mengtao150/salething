<template>
  <div v-if="result" class="countdown" :class="statusClass">
    <el-icon class="icon"><Clock /></el-icon>
    <span class="text">{{ displayText }}</span>
  </div>
  <div v-else class="countdown pending">
    <el-icon class="icon"><Clock /></el-icon>
    <span class="text">待收货</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { getCountdown, getCountdownStatus, formatCountdown } from '@/utils/countdown'

const props = defineProps<{
  receivedTime?: string
}>()

const result = ref(getCountdown(props.receivedTime))
const statusClass = computed(() => {
  if (!props.receivedTime) return 'pending'
  return getCountdownStatus(props.receivedTime)
})

const displayText = computed(() => {
  if (!result.value) return '待收货'
  return formatCountdown(result.value)
})

let timer: number | null = null

onMounted(() => {
  // 每分钟更新一次
  timer = window.setInterval(() => {
    result.value = getCountdown(props.receivedTime)
  }, 60000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped lang="scss">
.countdown {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;

  .icon {
    font-size: 14px;
  }

  &.normal {
    background-color: #f0f9ff;
    color: $success-color;
  }

  &.warning {
    background-color: #fef3c7;
    color: $warning-color;
  }

  &.danger {
    background-color: #fee2e2;
    color: $danger-color;
  }

  &.expired {
    background-color: #f3f4f6;
    color: $info-color;
  }

  &.pending {
    background-color: #e5e7eb;
    color: #6b7280;
  }
}
</style>
