<template>
  <el-card class="chart-card" shadow="hover">
    <template #header>
      <div class="chart-header">
        <span class="chart-title">📊 价格统计图表</span>
        <el-select
          v-model="selectedItemId"
          placeholder="选择物品"
          clearable
          @change="handleItemChange"
          style="width: 200px"
        >
          <el-option
            v-for="item in items"
            :key="item.id"
            :label="`${item.id}. ${item.name}`"
            :value="item.id"
          />
        </el-select>
      </div>
    </template>

    <div ref="chartRef" class="chart-container" v-loading="loading"></div>

    <!-- 统计摘要 -->
    <div class="chart-summary">
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="summary-item">
            <span class="label">总买入</span>
            <span class="value buy-value">¥{{ totalBuyPrice.toFixed(2) }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="summary-item">
            <span class="label">总卖出</span>
            <span class="value sell-value">¥{{ totalSellPrice.toFixed(2) }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="summary-item">
            <span class="label">总利润</span>
            <span class="value" :class="totalProfit >= 0 ? 'profit-positive' : 'profit-negative'">
              ¥{{ totalProfit.toFixed(2) }}
            </span>
          </div>
        </el-col>
      </el-row>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { Item } from '@/types'
import { calculateProfit } from '@/utils/profit'

const props = defineProps<{
  items: Item[]
}>()

const chartRef = ref<HTMLElement>()
const chartInstance = ref<echarts.ECharts | null>(null)
const selectedItemId = ref<string>('')
const loading = ref(false)

// 计算统计数据
const chartData = computed(() => {
  if (selectedItemId.value) {
    // 单个物品数据
    const item = props.items.find(i => i.id === selectedItemId.value)
    if (!item) return null

    const profit = calculateProfit(item)
    return {
      title: `${item.id}. ${item.name}`,
      buyPrice: item.buyPrice,
      sellPrice: item.actualSellPrice || item.expectedSellPrice || 0,
      profit: profit.actualProfit ?? profit.expectedProfit ?? 0,
      shipping: item.shippingFee || 0
    }
  } else {
    // 所有物品汇总数据
    let totalBuy = 0
    let totalSell = 0
    let totalProfit = 0

    props.items.forEach(item => {
      const profit = calculateProfit(item)
      totalBuy += item.buyPrice + (item.shippingFee || 0)
      if (item.actualSellPrice) {
        totalSell += item.actualSellPrice
      } else if (item.expectedSellPrice) {
        totalSell += item.expectedSellPrice
      }
      if (profit.actualProfit !== undefined) {
        totalProfit += profit.actualProfit
      } else if (profit.expectedProfit) {
        totalProfit += profit.expectedProfit
      }
    })

    return {
      title: '全部物品汇总',
      buyPrice: totalBuy,
      sellPrice: totalSell,
      profit: totalProfit,
      shipping: 0
    }
  }
})

// 统计摘要数据
const totalBuyPrice = computed(() => chartData.value?.buyPrice ?? 0)
const totalSellPrice = computed(() => chartData.value?.sellPrice ?? 0)
const totalProfit = computed(() => chartData.value?.profit ?? 0)

// 初始化图表
function initChart() {
  if (!chartRef.value) return

  chartInstance.value = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表
function updateChart() {
  if (!chartInstance.value || !chartData.value) return

  const data = chartData.value

  const option: echarts.EChartOption = {
    title: {
      text: data.title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        let result = `<b>${params[0].name}</b><br/>`
        params.forEach((param: any) => {
          result += `${param.marker} ${param.seriesName}: ¥${param.value.toFixed(2)}<br/>`
        })
        return result
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['买入成本', '卖出收入', '利润'],
      axisLabel: {
        fontSize: 13
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
        fontSize: 12
      }
    },
    series: [
      {
        name: '金额',
        type: 'bar',
        data: [
          {
            value: data.buyPrice,
            itemStyle: { color: '#409eff' }
          },
          {
            value: data.sellPrice,
            itemStyle: { color: '#67c23a' }
          },
          {
            value: data.profit,
            itemStyle: { color: data.profit >= 0 ? '#e6a23c' : '#f56c6c' }
          }
        ],
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            return `¥${params.value.toFixed(2)}`
          },
          fontSize: 12
        }
      }
    ]
  }

  chartInstance.value.setOption(option)
}

// 物品选择变化
function handleItemChange() {
  nextTick(() => {
    updateChart()
  })
}

// 监听 items 变化
watch(() => props.items, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

// 窗口大小变化时重新渲染
function handleResize() {
  chartInstance.value?.resize()
}

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  chartInstance.value?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.chart-card {
  margin-bottom: 20px;

  :deep(.el-card__header) {
    padding: 12px 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
    border-bottom: 1px solid #e4e7ed;
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .chart-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    background: #f9f9f9;
    border-radius: 6px;

    .label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    .value {
      font-size: 16px;
      font-weight: 600;

      &.buy-value {
        color: #409eff;
      }

      &.sell-value {
        color: #67c23a;
      }

      &.profit-positive {
        color: #e6a23c;
      }

      &.profit-negative {
        color: #f56c6c;
      }
    }
  }
}
</style>
