<template>
  <el-card class="chart-card" shadow="never">
    <div class="chart-header">
      <div>
        <span class="chart-kicker">数据概览</span>
        <h3 class="chart-title">价格与利润走势</h3>
      </div>

      <el-select
        v-model="selectedItemId"
        placeholder="查看单件商品"
        clearable
        class="chart-select"
        @change="handleItemChange"
      >
        <el-option
          v-for="item in items"
          :key="item.id"
          :label="`${item.id}. ${item.name}`"
          :value="item.id"
        />
      </el-select>
    </div>

    <div ref="chartRef" class="chart-container" v-loading="loading"></div>

    <div class="chart-summary">
      <div class="summary-card summary-card--buy">
        <span class="summary-card__label">买入成本</span>
        <strong class="summary-card__value">¥{{ totalBuyPrice.toFixed(2) }}</strong>
      </div>
      <div class="summary-card summary-card--sell">
        <span class="summary-card__label">卖出收入</span>
        <strong class="summary-card__value">¥{{ totalSellPrice.toFixed(2) }}</strong>
      </div>
      <div class="summary-card" :class="totalProfit >= 0 ? 'summary-card--profit' : 'summary-card--loss'">
        <span class="summary-card__label">利润表现</span>
        <strong class="summary-card__value">{{ totalProfit >= 0 ? '+' : '' }}¥{{ totalProfit.toFixed(2) }}</strong>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import type { Item } from '@/types'
import { calculateProfit } from '@/utils/profit'

const props = defineProps<{
  items: Item[]
}>()

const chartRef = ref<HTMLElement>()
const chartInstance = ref<ECharts | null>(null)
const selectedItemId = ref('')
const loading = ref(false)

const chartData = computed(() => {
  if (selectedItemId.value) {
    const item = props.items.find(entry => entry.id === selectedItemId.value)
    if (!item) return null

    const profit = calculateProfit(item)
    return {
      title: `${item.id}. ${item.name}`,
      buyPrice: item.buyPrice + (item.shippingFee || 0),
      sellPrice: item.actualSellPrice || item.expectedSellPrice || 0,
      profit: profit.actualProfit ?? profit.expectedProfit ?? 0
    }
  }

  return props.items.reduce(
    (acc, item) => {
      const profit = calculateProfit(item)
      acc.buyPrice += item.buyPrice + (item.shippingFee || 0)
      acc.sellPrice += item.actualSellPrice || item.expectedSellPrice || 0
      acc.profit += profit.actualProfit ?? profit.expectedProfit ?? 0
      return acc
    },
    {
      title: '全部商品汇总',
      buyPrice: 0,
      sellPrice: 0,
      profit: 0
    }
  )
})

const totalBuyPrice = computed(() => chartData.value?.buyPrice ?? 0)
const totalSellPrice = computed(() => chartData.value?.sellPrice ?? 0)
const totalProfit = computed(() => chartData.value?.profit ?? 0)

function initChart() {
  if (!chartRef.value) return

  chartInstance.value = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance.value || !chartData.value) return

  const data = chartData.value
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    animationDuration: 600,
    title: {
      text: data.title,
      left: 'center',
      top: 10,
      textStyle: {
        color: '#172b4d',
        fontSize: 16,
        fontWeight: 700
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(201, 212, 236, 0.8)',
      textStyle: {
        color: '#24344f'
      },
      formatter: params => {
        const list = Array.isArray(params) ? params : [params]
        return list
          .map(param => `${param.marker}${param.seriesName}: ¥${Number(param.value).toFixed(2)}`)
          .join('<br/>')
      }
    },
    legend: {
      top: 42,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: '#607089',
        fontSize: 12
      },
      data: ['买入成本', '卖出收入', '利润']
    },
    grid: {
      left: 18,
      right: 18,
      top: 90,
      bottom: 18,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['金额对比'],
      axisTick: { show: false },
      axisLine: {
        lineStyle: {
          color: '#d8e0f0'
        }
      },
      axisLabel: {
        color: '#71809a'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#7d8aa2',
        formatter: value => `¥${value}`
      },
      splitLine: {
        lineStyle: {
          color: '#e8edf7',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '买入成本',
        type: 'bar',
        barMaxWidth: 42,
        data: [data.buyPrice],
        itemStyle: {
          borderRadius: [14, 14, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#7aa2ff' },
            { offset: 1, color: '#5b7def' }
          ])
        }
      },
      {
        name: '卖出收入',
        type: 'bar',
        barMaxWidth: 42,
        data: [data.sellPrice],
        itemStyle: {
          borderRadius: [14, 14, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#52d5aa' },
            { offset: 1, color: '#28b37d' }
          ])
        }
      },
      {
        name: '利润',
        type: 'bar',
        barMaxWidth: 42,
        data: [data.profit],
        itemStyle: {
          borderRadius: [14, 14, 0, 0],
          color:
            data.profit >= 0
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#ffc86a' },
                  { offset: 1, color: '#f2a53b' }
                ])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#f58b98' },
                  { offset: 1, color: '#e45d6f' }
                ])
        }
      }
    ]
  }

  chartInstance.value.setOption(option)
}

function handleItemChange() {
  nextTick(updateChart)
}

watch(
  () => props.items,
  () => nextTick(updateChart),
  { deep: true }
)

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
  margin-bottom: 18px;
  border-radius: 30px;

  :deep(.el-card__body) {
    padding: 22px;
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.chart-kicker {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #5f7fd7;
}

.chart-title {
  margin: 8px 0 0;
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: #172b4d;
}

.chart-select {
  width: min(260px, 100%);
}

.chart-container {
  width: 100%;
  height: 340px;
  margin-top: 12px;
}

.chart-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.summary-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 22px;
  background: rgba(245, 248, 255, 0.9);
}

.summary-card__label {
  font-size: 12px;
  color: #7d8aa2;
}

.summary-card__value {
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: #172b4d;
}

.summary-card--buy {
  background: linear-gradient(135deg, rgba(91, 125, 239, 0.12), rgba(122, 162, 255, 0.08));
}

.summary-card--sell {
  background: linear-gradient(135deg, rgba(40, 179, 125, 0.12), rgba(82, 213, 170, 0.08));
}

.summary-card--profit {
  background: linear-gradient(135deg, rgba(242, 165, 59, 0.12), rgba(255, 200, 106, 0.08));
}

.summary-card--loss {
  background: linear-gradient(135deg, rgba(228, 93, 111, 0.12), rgba(245, 139, 152, 0.08));
}

@media (max-width: 768px) {
  .chart-card {
    border-radius: 24px;

    :deep(.el-card__body) {
      padding: 18px;
    }
  }

  .chart-header {
    flex-direction: column;
  }

  .chart-title {
    font-size: 22px;
  }

  .chart-select {
    width: 100%;
  }

  .chart-container {
    height: 300px;
  }

  .chart-summary {
    grid-template-columns: 1fr;
  }
}
</style>
