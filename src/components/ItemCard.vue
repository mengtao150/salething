<template>
  <el-card
    class="item-card"
    :class="[`category-${categoryClass}`, `status-${itemStatus}`, { 'is-completed': completedState }]"
    shadow="never"
  >
    <div class="item-card__top">
      <div class="meta">
        <span class="meta-id">#{{ item.id }}</span>
        <span class="category-pill">{{ item.category }}</span>
        <span class="detail-pill">{{ item.size || '未填尺码' }}</span>
        <span class="status-pill">{{ statusLabel }}</span>
      </div>
      <PlatformBadge :platform="item.platform" />
    </div>

    <div class="item-card__header">
      <h3 class="item-name" :class="{ 'is-completed': completedState }">{{ item.name }}</h3>
      <p class="item-price">
        ¥{{ item.buyPrice.toFixed(2) }}
        <span>买入成本</span>
      </p>
    </div>

    <div class="item-card__body">
      <div class="info-grid">
        <div class="info-block">
          <span class="label">预计售价</span>
          <strong>{{ item.expectedSellPrice ? `¥${item.expectedSellPrice.toFixed(2)}` : '--' }}</strong>
        </div>
        <div class="info-block">
          <span class="label">入仓时间</span>
          <strong>{{ item.receivedTime ? formatDate(item.receivedTime) : '--' }}</strong>
        </div>
        <div class="info-block">
          <span class="label">货号</span>
          <strong>{{ item.sku || '--' }}</strong>
        </div>
        <div class="info-block">
          <span class="label">尺码</span>
          <strong>{{ item.size || '--' }}</strong>
        </div>
      </div>

      <div class="status-block">
        <span class="label">{{ itemStatus === 'received' ? '退货倒计时' : '当前状态' }}</span>
        <Countdown v-if="itemStatus === 'received'" :received-time="item.receivedTime" />
        <div v-else class="status-summary">
          <strong>{{ statusLabel }}</strong>
          <span v-if="item.sellTime">{{ formatDate(item.sellTime) }}</span>
          <span v-else-if="itemStatus === 'pending'">等待入仓</span>
        </div>
      </div>

      <div class="profit-row">
        <span class="label">{{ soldState ? '实际利润' : '预计利润' }}</span>
        <strong :class="profitClass">
          {{ displayProfit >= 0 ? '+' : '' }}¥{{ displayProfit.toFixed(2) }}
        </strong>
      </div>
    </div>

    <div class="item-card__footer">
      <el-button v-if="itemStatus === 'received'" type="success" @click="handleSell">确认售出</el-button>
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
import { getItemStatus, getStatusLabel, isItemCompleted, isItemSold } from '@/utils/itemStatus'
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

const itemStatus = computed(() => getItemStatus(props.item))
const completedState = computed(() => isItemCompleted(props.item))
const soldState = computed(() => isItemSold(props.item))
const statusLabel = computed(() => getStatusLabel(itemStatus.value))
const profit = computed(() => calculateProfit(props.item))
const displayProfit = computed(() => profit.value.actualProfit ?? profit.value.expectedProfit ?? 0)
const profitClass = computed(() => {
  if (displayProfit.value > 0) return 'is-positive'
  if (displayProfit.value < 0) return 'is-negative'
  return ''
})

const categoryClass = computed(() => {
  const map = {
    鞋子: 'shoes',
    书包: 'bag',
    衣服: 'clothes',
    其他: 'other'
  }

  return map[props.item.category] || 'other'
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}/${day}`
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
  width: 100%;
  height: 100%;
  border-radius: 28px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;
  border-top: 4px solid transparent !important;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 46px rgba(15, 23, 42, 0.12) !important;
  }

  &.category-shoes {
    border-top-color: #5b7def !important;
  }

  &.category-bag {
    border-top-color: #28b37d !important;
  }

  &.category-clothes {
    border-top-color: #f2a53b !important;
  }

  &.category-other {
    border-top-color: #8b95aa !important;
  }

  &.is-completed {
    opacity: 0.82;

    .item-name,
    .item-price,
    .info-block strong {
      color: #8b95aa;
    }
  }

  :deep(.el-card__body) {
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    gap: 18px;
    height: 100%;
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
  flex-wrap: wrap;
}

.meta-id,
.category-pill,
.detail-pill,
.status-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.meta-id {
  color: #5674d7;
  background: rgba(91, 125, 239, 0.1);
}

.category-pill {
  color: #42516c;
  background: rgba(125, 140, 170, 0.14);
}

.detail-pill {
  color: #1c304f;
  background: rgba(91, 125, 239, 0.1);
}

.status-pill {
  color: #3f5f31;
  background: rgba(109, 186, 114, 0.16);
}

.status-sold .status-pill {
  color: #8b5c11;
  background: rgba(242, 165, 59, 0.16);
}

.status-completed .status-pill {
  color: #1f7a56;
  background: rgba(40, 179, 125, 0.16);
}

.status-pending .status-pill {
  color: #66748d;
  background: rgba(125, 140, 170, 0.16);
}

.item-card__header {
  align-items: flex-start;
}

.item-name {
  flex: 1;
  margin: 0;
  min-height: calc(18px * 1.3 * 2);
  font-size: 18px;
  line-height: 1.3;
  color: #172b4d;
  letter-spacing: -0.03em;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;

  &.is-completed {
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
  white-space: nowrap;

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
  align-content: start;
  gap: 14px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-block,
.status-block {
  padding: 14px;
  border-radius: 20px;
  background: rgba(245, 248, 255, 0.9);
}

.info-block {
  display: grid;
  gap: 8px;
  min-height: 78px;

  strong {
    font-size: 15px;
    color: #1c304f;
    word-break: break-word;
  }
}

.status-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 62px;
}

.status-summary {
  display: grid;
  justify-items: end;
  gap: 4px;

  strong {
    font-size: 15px;
    color: #1c304f;
  }

  span {
    font-size: 12px;
    color: #7d8aa2;
  }
}

.label {
  font-size: 12px;
  color: #7d8aa2;
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
    border-radius: 24px;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .item-card__header,
  .status-block {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-price,
  .status-summary {
    align-items: flex-start;
    justify-items: start;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
