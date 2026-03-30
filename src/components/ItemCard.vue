<template>
  <el-card class="item-card" :class="{ sold: item.sold }" shadow="hover">
    <!-- 已卖出标记 -->
    <div v-if="item.sold" class="sold-badge">已卖出</div>

    <template #header>
      <div class="card-header">
        <span class="item-name" :class="{ 'sold-text': item.sold }">{{ item.name }}</span>
        <PlatformBadge :platform="item.platform" />
      </div>
    </template>

    <div class="card-body" :class="{ 'sold-body': item.sold }">
      <div class="info-row">
        <span class="label">买入价：</span>
        <span class="value price" :class="{ 'sold-value': item.sold }">¥{{ item.buyPrice.toFixed(2) }}</span>
      </div>

      <div class="info-row" v-if="item.expectedSellPrice">
        <span class="label">预计卖：</span>
        <span class="value" :class="{ 'sold-value': item.sold }">¥{{ item.expectedSellPrice.toFixed(2) }}</span>
      </div>

      <div class="info-row">
        <span class="label">购入：</span>
        <span class="value" :class="{ 'sold-value': item.sold }">{{ formatDate(item.buyTime) }}</span>
      </div>

      <div class="countdown-row">
        <span class="countdown-label">{{ item.received ? '退货倒计时' : '收货状态' }}:</span>
        <Countdown :received-time="item.receivedTime" />
      </div>

      <div class="profit-row" v-if="profit.actualProfit !== undefined || profit.expectedProfit">
        <span class="label" :class="{ positive: profit.actualProfit! > 0 || profit.expectedProfit > 0, negative: profit.actualProfit! < 0 || profit.expectedProfit < 0 }">
          {{ item.sold ? '实际利润' : '预计利润' }}：
        </span>
        <span class="value" :class="{ positive: profit.actualProfit! > 0 || profit.expectedProfit > 0, negative: profit.actualProfit! < 0 || profit.expectedProfit < 0, 'sold-value': item.sold }">
          {{ profit.actualProfit !== undefined ? (profit.actualProfit >= 0 ? '+' : '') : '' }}¥{{ (profit.actualProfit ?? profit.expectedProfit).toFixed(2) }}
        </span>
      </div>
    </div>

    <template #footer>
      <div class="card-actions">
        <el-button
          v-if="!item.received"
          type="primary"
          size="small"
          @click="handleReceive"
        >
          确认收货
        </el-button>
        <el-button
          v-if="item.received && !item.sold"
          type="success"
          size="small"
          @click="handleSell"
        >
          确认卖出
        </el-button>
        <el-button
          type="info"
          size="small"
          @click="handleEdit"
        >
          编辑
        </el-button>
        <el-popconfirm
          title="确定删除吗？"
          @confirm="handleDelete"
        >
          <template #reference>
            <el-button type="danger" size="small">删除</el-button>
          </template>
        </el-popconfirm>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Item } from '@/types'
import PlatformBadge from './PlatformBadge.vue'
import Countdown from './Countdown.vue'
import { calculateProfit, formatMoney } from '@/utils/profit'

const props = defineProps<{
  item: Item
}>()

const emit = defineEmits<{
  receive: [id: string]
  sell: [id: string]
  edit: [item: Item]
  delete: [id: string]
}>()

const profit = computed(() => calculateProfit(props.item))

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function handleReceive() {
  emit('receive', props.item.id)
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
  margin-bottom: 12px;
  transition: all 0.3s;
  position: relative;
  border: 2px solid transparent;

  // 未卖出的卡片 - 显眼样式
  &:not(.sold) {
    border: 2px solid #e1f3ff;
    background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);

    &:hover {
      border-color: #409eff;
      box-shadow: 0 6px 16px rgba(64, 158, 255, 0.25);
      transform: translateY(-2px);
    }

    :deep(.el-card__header) {
      background: linear-gradient(135deg, #e1f3ff 0%, #ffffff 100%);
      border-bottom: 1px solid #d9ecff;
    }
  }

  // 已卖出的卡片 - 删除线效果
  &.sold {
    opacity: 0.6;
    background: #f5f5f5;
    border: 1px dashed #dcdfe6;
    box-shadow: none;

    :deep(.el-card__header),
    :deep(.el-card__body),
    :deep(.el-card__footer) {
      position: relative;
    }

    // 整个卡片删除线效果
    :deep(.el-card__body)::before,
    :deep(.el-card__header)::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 2px;
      background: repeating-linear-gradient(
        90deg,
        #c0c4cc 0px,
        #c0c4cc 8px,
        transparent 8px,
        transparent 16px
      );
      opacity: 0.5;
      z-index: 1;
      pointer-events: none;
    }
  }

  :deep(.el-card__header) {
    padding: 12px;
  }

  :deep(.el-card__body) {
    padding: 12px;
  }

  :deep(.el-card__footer) {
    padding: 8px 12px;
    border-top: 1px solid #f0f0f0;
  }
}

// 已卖出标记
.sold-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #909399;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  z-index: 2;
  font-weight: 500;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .item-name {
    font-weight: 600;
    font-size: 15px;
    color: #303133;
    flex: 1;
    margin-right: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.sold-text {
      text-decoration: line-through;
      color: #909399;
    }
  }
}

.card-body {
  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;

    .label {
      color: #909399;
    }

    .value {
      color: #303133;
      font-weight: 500;

      &.price {
        color: $primary-color;
        font-weight: 600;
      }

      &.sold-value {
        text-decoration: line-through;
        color: #909399;
      }

      &.positive {
        color: $success-color;
      }

      &.negative {
        color: $danger-color;
      }
    }
  }

  .countdown-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    padding: 6px 8px;
    background-color: #f8f9fa;
    border-radius: 6px;

    .countdown-label {
      font-size: 12px;
      color: #606266;
      font-weight: 500;
    }
  }

  .profit-row {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #e4e7ed;
    font-size: 13px;

    .label {
      color: #909399;

      &.positive {
        color: $success-color;
      }

      &.negative {
        color: $danger-color;
      }
    }

    .value {
      font-weight: 600;

      &.sold-value {
        text-decoration: line-through;
      }

      &.positive {
        color: $success-color;
      }

      &.negative {
        color: $danger-color;
      }
    }
  }

  // 已卖出时整个body区域添加删除效果
  &.sold-body {
    opacity: 0.7;
  }
}

.card-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .el-button {
    flex: 1;
    min-width: 60px;
  }
}
</style>
