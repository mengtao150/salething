<template>
  <el-card class="item-card" :class="{ 'is-sold': item.sold }" shadow="never">
    <div class="item-card__top">
      <div class="meta">
        <span class="meta-id">#{{ item.id }}</span>
        <span v-if="item.sold" class="sold-pill">已卖出</span>
      </div>
      <PlatformBadge :platform="item.platform" />
    </div>

    <div class="item-card__header">
      <h3 class="item-name" :class="{ 'is-sold': item.sold }">{{ item.name }}</h3>
      <p class="item-price">
        ¥{{ item.buyPrice.toFixed(2) }}
        <span>买入成本</span>
      </p>
    </div>

    <div class="item-card__body">
      <div class="info-grid">
        <div class="info-block">
          <span class="label">预计卖价</span>
          <strong>{{ item.expectedSellPrice ? `¥${item.expectedSellPrice.toFixed(2)}` : '--' }}</strong>
        </div>
        <div class="info-block">
          <span class="label">收货时间</span>
          <strong>{{ item.receivedTime ? formatDate(item.receivedTime) : '待收货' }}</strong>
        </div>
      </div>

      <div class="countdown-block">
        <span class="label">退货倒计时</span>
        <Countdown :received-time="item.receivedTime" />
      </div>

      <div class="profit-row">
        <span class="label">{{ item.sold ? '实际利润' : '预计利润' }}</span>
        <strong :class="profitClass">
          {{ displayProfit >= 0 ? '+' : '' }}¥{{ displayProfit.toFixed(2) }}
        </strong>
      </div>
    </div>

    <div class="item-card__footer">
      <el-button v-if="item.receivedTime && !item.sold" type="success" @click="handleSell">
        确认卖出
      </el-button>
      <el-button type="info" plain @click="handleEdit">编辑</el-button>
      <el-popconfirm title="确定删除这件商品吗？" @confirm="handleDelete">
        <template #reference>
          <el-button type="danger" plain>删除</el-button>
        </template>
      </el-popconfirm>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Item } from '@/types'
import { calculateProfit } from '@/utils/profit'
import Countdown from './Countdown.vue'
import PlatformBadge from './PlatformBadge.vue'

const props = defineProps<{
  item: Item
}>()

const emit = defineEmits<{
  sell: [id: string]
  edit: [item: Item]
  delete: [id: string]
}>()

const profit = computed(() => calculateProfit(props.item))
const displayProfit = computed(() => profit.value.actualProfit ?? profit.value.expectedProfit ?? 0)
const profitClass = computed(() => {
  if (displayProfit.value > 0) return 'is-positive'
  if (displayProfit.value < 0) return 'is-negative'
  return ''
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function handleSell() {
  emit('sell', props.item.id)
}

function handleEdit() {
  emit('edit', props.item)
}

function handleDelete() {
  emit('delete', props.item.id)
}
</script>

<style scoped lang="scss">
.item-card {
  position: relative;
  margin-bottom: 16px;
  border-radius: 28px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 46px rgba(15, 23, 42, 0.12) !important;
  }

  &.is-sold {
    opacity: 0.74;

    .item-name,
    .item-price,
    .info-block strong {
      color: #8b95aa;
    }
  }

  :deep(.el-card__body) {
    display: grid;
    gap: 18px;
    padding: 18px;
  }
}

.item-card__top,
.item-card__header,
.item-card__footer,
.profit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.meta-id {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #5674d7;
  background: rgba(91, 125, 239, 0.1);
}

.sold-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #67768f;
  background: rgba(149, 158, 178, 0.14);
}

.item-card__header {
  align-items: flex-start;
}

.item-name {
  flex: 1;
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  color: #172b4d;
  letter-spacing: -0.03em;

  &.is-sold {
    text-decoration: line-through;
  }
}

.item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #10213d;

  span {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0;
    color: #8190a7;
  }
}

.item-card__body {
  display: grid;
  gap: 14px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-block,
.countdown-block {
  padding: 14px;
  border-radius: 20px;
  background: rgba(245, 248, 255, 0.9);
}

.info-block {
  display: grid;
  gap: 8px;

  strong {
    font-size: 15px;
    color: #1c304f;
  }
}

.label {
  font-size: 12px;
  color: #7d8aa2;
}

.countdown-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.profit-row {
  padding: 4px 2px 0;

  strong {
    font-size: 18px;
    letter-spacing: -0.03em;
    color: #1c304f;
  }
}

.is-positive {
  color: #1f9c68 !important;
}

.is-negative {
  color: #d95763 !important;
}

.item-card__footer {
  flex-wrap: wrap;

  .el-button {
    flex: 1;
    min-width: 90px;
  }
}

@media (max-width: 768px) {
  .item-card {
    margin-bottom: 14px;
    border-radius: 24px;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .item-card__header,
  .countdown-block {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-price {
    align-items: flex-start;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
