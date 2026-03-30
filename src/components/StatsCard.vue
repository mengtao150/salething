<template>
  <el-row :gutter="12" class="stats-container">
    <el-col :xs="12" :sm="6" :md="6" :lg="6">
      <div class="stat-card total">
        <div class="value">{{ stats.totalItems }}</div>
        <div class="label">总物品</div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="6" :md="6" :lg="6">
      <div class="stat-card pending">
        <div class="value">{{ stats.pendingItems }}</div>
        <div class="label">待收货</div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="6" :md="6" :lg="6">
      <div class="stat-card countdown">
        <div class="value">{{ stats.receivedItems }}</div>
        <div class="label">倒计时中</div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="6" :md="6" :lg="6">
      <div class="stat-card sold">
        <div class="value">{{ stats.soldItems }}</div>
        <div class="label">已卖出</div>
      </div>
    </el-col>
  </el-row>

  <el-row :gutter="12" class="stats-container mt-3">
    <el-col :xs="24" :sm="8" :md="8" :lg="8">
      <div class="stat-card profit">
        <div class="value">¥{{ stats.totalCost.toFixed(2) }}</div>
        <div class="label">总投入</div>
      </div>
    </el-col>
    <el-col :xs="24" :sm="8" :md="8" :lg="8">
      <div class="stat-card" :class="stats.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'">
        <div class="value">{{ stats.totalProfit >= 0 ? '+' : '' }}¥{{ stats.totalProfit.toFixed(2) }}</div>
        <div class="label">总利润</div>
      </div>
    </el-col>
    <el-col :xs="24" :sm="8" :md="8" :lg="8">
      <div class="stat-card" :class="stats.profitRate >= 0 ? 'profit-positive' : 'profit-negative'">
        <div class="value">{{ stats.profitRate >= 0 ? '+' : '' }}{{ stats.profitRate.toFixed(1) }}%</div>
        <div class="label">利润率</div>
      </div>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import type { Stats } from '@/types'

defineProps<{
  stats: Stats
}>()
</script>

<style scoped lang="scss">
.stats-container {
  margin-bottom: 8px;
}

.stat-card {
  padding: 12px;
  border-radius: $ios-card-radius;
  text-align: center;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .value {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .label {
    font-size: 12px;
    color: #909399;
  }

  &.total .value { color: $primary-color; }
  &.pending .value { color: $info-color; }
  &.countdown .value { color: $warning-color; }
  &.sold .value { color: $success-color; }
  &.profit .value { color: $primary-color; }

  &.profit-positive .value { color: $success-color; }
  &.profit-negative .value { color: $danger-color; }
}

.mt-3 {
  margin-top: 12px;
}
</style>
