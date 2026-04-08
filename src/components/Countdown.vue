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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { formatCountdown, getCountdown, getCountdownStatus } from '@/utils/countdown'

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

watch(
  () => props.receivedTime,
  value => {
    result.value = getCountdown(value)
  },
  { immediate: true }
)

onMounted(() => {
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
  gap: 6px;
  min-height: 34px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;

  .icon {
    font-size: 13px;
  }

  &.normal {
    background: rgba(40, 179, 125, 0.12);
    color: $success-color;
  }

  &.warning {
    background: rgba(242, 165, 59, 0.14);
    color: $warning-color;
  }

  &.danger {
    background: rgba(228, 93, 111, 0.14);
    color: $danger-color;
  }

  &.expired {
    background: rgba(123, 135, 156, 0.16);
    color: #64748b;
  }

  &.pending {
    background: rgba(125, 140, 170, 0.14);
    color: #6b7280;
  }
}
</style>
