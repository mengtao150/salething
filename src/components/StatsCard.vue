<template>
  <div class="stats-shell">
    <el-row :gutter="16" class="stats-grid">
      <el-col :xs="12" :sm="12" :md="6" v-for="card in overviewCards" :key="card.label">
        <div class="stat-card" :class="card.tone">
          <span class="stat-card__label">{{ card.label }}</span>
          <strong class="stat-card__value">{{ card.value }}</strong>
          <span class="stat-card__hint">{{ card.hint }}</span>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="stats-grid stats-grid--secondary">
      <el-col :xs="24" :sm="8" v-for="card in financeCards" :key="card.label">
        <div class="stat-card stat-card--wide" :class="card.tone">
          <span class="stat-card__label">{{ card.label }}</span>
          <strong class="stat-card__value">{{ card.value }}</strong>
          <span class="stat-card__hint">{{ card.hint }}</span>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Stats } from '@/types'

const props = defineProps<{
  stats: Stats
}>()

const overviewCards = computed(() => [
  {
    label: '商品总数',
    value: String(props.stats.totalItems),
    hint: '当前所有记录',
    tone: 'tone-blue'
  },
  {
    label: '待收货',
    value: String(props.stats.pendingItems),
    hint: '等待入仓确认',
    tone: 'tone-slate'
  },
  {
    label: '入仓中',
    value: String(props.stats.receivedItems),
    hint: '正在倒计时',
    tone: 'tone-amber'
  },
  {
    label: '已售/成交',
    value: String(props.stats.soldItems),
    hint: '包含售出与交易成功',
    tone: 'tone-green'
  }
])

const financeCards = computed(() => [
  {
    label: '总投入',
    value: `¥${props.stats.totalCost.toFixed(2)}`,
    hint: '含采购与运费',
    tone: 'tone-sky'
  },
  {
    label: '总利润',
    value: `${props.stats.totalProfit >= 0 ? '+' : ''}¥${props.stats.totalProfit.toFixed(2)}`,
    hint: props.stats.totalProfit >= 0 ? '整体表现不错' : '需要关注亏损商品',
    tone: props.stats.totalProfit >= 0 ? 'tone-green' : 'tone-rose'
  },
  {
    label: '利润率',
    value: `${props.stats.profitRate >= 0 ? '+' : ''}${props.stats.profitRate.toFixed(1)}%`,
    hint: '综合收益效率',
    tone: props.stats.profitRate >= 0 ? 'tone-indigo' : 'tone-rose'
  }
])
</script>

<style scoped lang="scss">
.stats-shell {
  display: grid;
  gap: 16px;
}

.stats-grid {
  margin: 0;
}

.stats-grid--secondary {
  margin-top: 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 146px;
  padding: 18px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 249, 255, 0.82)),
    var(--card-glow, transparent);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.stat-card--wide {
  min-height: 152px;
}

.stat-card__label {
  font-size: 13px;
  color: #74819a;
}

.stat-card__value {
  margin-top: 18px;
  font-size: clamp(26px, 4vw, 34px);
  line-height: 1;
  letter-spacing: -0.05em;
  color: #10213d;
}

.stat-card__hint {
  margin-top: 18px;
  font-size: 12px;
  color: #8a95ac;
}

.tone-blue {
  --card-glow: radial-gradient(circle at top right, rgba(91, 125, 239, 0.2), transparent 45%);
}

.tone-slate {
  --card-glow: radial-gradient(circle at top right, rgba(125, 140, 170, 0.2), transparent 45%);
}

.tone-amber {
  --card-glow: radial-gradient(circle at top right, rgba(242, 165, 59, 0.2), transparent 45%);
}

.tone-green {
  --card-glow: radial-gradient(circle at top right, rgba(40, 179, 125, 0.2), transparent 45%);
}

.tone-sky {
  --card-glow: radial-gradient(circle at top right, rgba(102, 189, 255, 0.2), transparent 45%);
}

.tone-indigo {
  --card-glow: radial-gradient(circle at top right, rgba(116, 132, 244, 0.22), transparent 45%);
}

.tone-rose {
  --card-glow: radial-gradient(circle at top right, rgba(228, 93, 111, 0.2), transparent 45%);
}

@media (max-width: 768px) {
  .stat-card {
    min-height: 128px;
    padding: 16px;
    border-radius: 24px;
  }

  .stat-card__value {
    margin-top: 16px;
    font-size: 28px;
  }
}
</style>
