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
    拼多多: 'pinduoduo',
    淘宝: 'taobao',
    抖音: 'douyin',
    京东: 'jingdong',
    唯品会: 'vip',
    快手: 'kuaishou'
  }

  return classMap[props.platform] || ''
})
</script>

<style scoped lang="scss">
.platform-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &.pinduoduo {
    background: linear-gradient(135deg, #ff6557, $platform-pinduoduo);
  }

  &.taobao {
    background: linear-gradient(135deg, #ff844f, $platform-taobao);
  }

  &.douyin {
    background: linear-gradient(135deg, #35353a, $platform-douyin);
  }

  &.jingdong {
    background: linear-gradient(135deg, #ff7566, $platform-jingdong);
  }

  &.vip {
    background: linear-gradient(135deg, #ff72bd, $platform-vip);
  }

  &.kuaishou {
    background: linear-gradient(135deg, #ff9559, $platform-kuaishou);
  }
}
</style>
