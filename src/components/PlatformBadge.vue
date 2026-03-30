<template>
  <span class="platform-badge" :class="platformClass">{{ platform }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Platform } from '@/types'

const props = defineProps<{
  platform: Platform
}>()

const platformClass = computed(() => {
  const classMap: Record<Platform, string> = {
    '拼多多': 'pinduoduo',
    '淘宝': 'taobao',
    '抖音': 'douyin',
    '京东': 'jingdong',
    '唯品会': 'vip',
    '快手': 'kuaishou'
  }
  return classMap[props.platform] || ''
})
</script>

<style scoped lang="scss">
.platform-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;

  &.pinduoduo {
    background-color: $platform-pinduoduo;
  }

  &.taobao {
    background-color: $platform-taobao;
  }

  &.douyin {
    background-color: $platform-douyin;
  }

  &.jingdong {
    background-color: $platform-jingdong;
  }

  &.vip {
    background-color: $platform-vip;
  }

  &.kuaishou {
    background-color: $platform-kuaishou;
  }
}
</style>
