<template>
  <el-card class="procurement-card" :class="`category-${categoryClass}`" shadow="never">
    <div class="procurement-card__top">
      <div class="meta">
        <span class="meta-id">#{{ item.id }}</span>
        <span class="category-pill">{{ item.category }}</span>
        <span class="detail-pill">{{ item.size || '未填尺码' }}</span>
      </div>
      <span class="stage-pill">采购记录</span>
    </div>

    <div class="procurement-card__header">
      <h3 class="item-name">{{ item.name }}</h3>
      <p class="item-price">
        ¥{{ item.buyPrice.toFixed(2) }}
        <span>采购成本</span>
      </p>
    </div>

    <div class="procurement-card__body">
      <div class="info-grid">
        <div class="info-block">
          <span class="label">购买平台</span>
          <strong>{{ item.platform }}</strong>
        </div>
        <div class="info-block">
          <span class="label">货号</span>
          <strong>{{ item.sku || '--' }}</strong>
        </div>
        <div class="info-block">
          <span class="label">记录时间</span>
          <strong>{{ formatDateTime(item.createdAt || item.buyTime) }}</strong>
        </div>
        <div class="info-block">
          <span class="label">当前状态</span>
          <strong>待转得物</strong>
        </div>
      </div>
    </div>

    <div class="procurement-card__footer">
      <el-button type="success" @click="$emit('inbound', item)">转为得物入仓</el-button>
      <el-button type="warning" @click="$emit('sold', item)">转为得物售出</el-button>
      <el-button type="info" plain @click="$emit('edit', item)">编辑</el-button>
      <el-popconfirm title="确定删除这条采购记录吗？" @confirm="$emit('delete', item.id)">
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

defineEmits<{
  inbound: [item: Item]
  sold: [item: Item]
  edit: [item: Item]
  delete: [id: string]
}>()

const props = defineProps<{
  item: Item
}>()

const categoryClass = computed(() => {
  const map = {
    鞋子: 'shoes',
    书包: 'bag',
    衣服: 'clothes',
    其他: 'other'
  }

  return map[props.item.category] || 'other'
})

function formatDateTime(dateStr?: string) {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '--'

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}
</script>

<style scoped lang="scss">
.procurement-card {
  border-radius: 28px;
  border-top: 4px solid transparent !important;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

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

  :deep(.el-card__body) {
    display: grid;
    gap: 18px;
    padding: 18px;
  }
}

.procurement-card__top,
.procurement-card__header,
.procurement-card__footer {
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
.stage-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
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

.stage-pill {
  color: #6f5514;
  background: rgba(242, 165, 59, 0.16);
}

.procurement-card__header {
  align-items: flex-start;
}

.item-name {
  flex: 1;
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  color: #172b4d;
}

.item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #10213d;

  span {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #8190a7;
  }
}

.procurement-card__body {
  display: grid;
  gap: 14px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-block {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(245, 248, 255, 0.9);

  strong {
    font-size: 15px;
    color: #1c304f;
  }
}

.label {
  font-size: 12px;
  color: #7d8aa2;
}

.procurement-card__footer {
  flex-wrap: wrap;

  .el-button {
    flex: 1;
    min-width: 110px;
  }
}

@media (max-width: 768px) {
  .procurement-card {
    border-radius: 24px;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .procurement-card__header {
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
