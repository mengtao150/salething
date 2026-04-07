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
          <div class="summary-item buy-summary">
            <div class="summary-icon">💰</div>
            <div class="summary-content">
              <span class="label">买入成本</span>
              <span class="value">¥{{ totalBuyPrice.toFixed(2) }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="summary-item sell-summary">
            <div class="summary-icon">💵</div>
            <div class="summary-content">
              <span class="label">卖出收入</span>
              <span class="value">¥{{ totalSellPrice.toFixed(2) }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="summary-item" :class="totalProfit >= 0 ? 'profit-summary-positive' : 'profit-summary-negative'">
            <div class="summary-icon">{{ totalProfit >= 0 ? '📈' : '📉' }}</div>
            <div class="summary-content">
              <span class="label">利润</span>
              <span class="value">{{ totalProfit >= 0 ? '+' : '' }}¥{{ totalProfit.toFixed(2) }}</span>
            </div>
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
        fontWeight: 600,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        let result = `<div style="padding: 8px;"><b>${params[0].name}</b><br/>`
        let total = 0
        params.forEach((param: any) => {
          const color = param.color.color || param.color
          total += param.value
          result += `<div style="margin: 4px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>
            ${param.seriesName}: <b>¥${param.value.toFixed(2)}</b>
          </div>`
        })
        result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
          <b>总计: ¥${total.toFixed(2)}</b>
        </div>`
        result += '</div>'
        return result
      }
    },
    legend: {
      data: ['利润', '卖出收入', '买入成本'],
      top: 30,
      textStyle: {
        fontSize: 13
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['价格统计'],
      axisLabel: {
        fontSize: 13,
        color: '#606266'
      },
      axisLine: {
        lineStyle: {
          color: '#dcdfe6'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '金额 (¥)',
      nameTextStyle: {
        color: '#909399',
        fontSize: 12
      },
      axisLabel: {
        formatter: '¥{value}',
        fontSize: 12,
        color: '#909399'
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '买入成本',
        type: 'bar',
        stack: 'price',
        data: [data.buyPrice],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#66b1ff' },
            { offset: 1, color: '#409eff' }
          ])
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            if (params.value === 0) return ''
            return `¥${params.value.toFixed(0)}`
          },
          fontSize: 12,
          color: '#fff',
          fontWeight: 'bold'
        }
      },
      {
        name: '卖出收入',
        type: 'bar',
        stack: 'price',
        data: [data.sellPrice],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#85ce61' },
            { offset: 1, color: '#67c23a' }
          ])
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            if (params.value === 0) return ''
            return `¥${params.value.toFixed(0)}`
          },
          fontSize: 12,
          color: '#fff',
          fontWeight: 'bold'
        }
      },
      {
        name: '利润',
        type: 'bar',
        stack: 'price',
        data: [data.profit],
        itemStyle: {
          color: data.profit >= 0
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#ebb563' },
                { offset: 1, color: '#e6a23c' }
              ])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#f78989' },
                { offset: 1, color: '#f56c6c' }
              ])
        },
        label: {
          show: true,
          position: 'insideTop',
          formatter: (params: any) => {
            if (params.value === 0) return ''
            const prefix = params.value >= 0 ? '+' : ''
            return `${prefix}¥${params.value.toFixed(0)}`
          },
          fontSize: 13,
          color: '#fff',
          fontWeight: 'bold'
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
    align-items: center;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .summary-icon {
      font-size: 24px;
      margin-right: 12px;
    }

    .summary-content {
      display: flex;
      flex-direction: column;

      .label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .value {
        font-size: 18px;
        font-weight: 600;
      }
    }

    &.buy-summary {
      background: linear-gradient(135deg, #e6f3ff 0%, #f0f9ff 100%);
      border-left: 4px solid #409eff;

      .value {
        color: #409eff;
      }
    }

    &.sell-summary {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
      border-left: 4px solid #67c23a;

      .value {
        color: #67c23a;
      }
    }

    &.profit-summary-positive {
      background: linear-gradient(135deg, #fef6e7 0%, #fff9f0 100%);
      border-left: 4px solid #e6a23c;

      .value {
        color: #e6a23c;
      }
    }

    &.profit-summary-negative {
      background: linear-gradient(135deg, #fef0f0 0%, #fef5f5 100%);
      border-left: 4px solid #f56c6c;

      .value {
        color: #f56c6c;
      }
    }
  }
}
</style>
