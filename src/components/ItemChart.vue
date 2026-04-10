<template>
  <el-card class="chart-card" shadow="never">
    <div class="chart-header">
      <div>
        <span class="chart-kicker">数据概览</span>
        <h3 class="chart-title">价格与利润走势</h3>
      </div>

      <div class="chart-controls">
        <el-segmented v-model="viewMode" :options="viewOptions" class="mode-switch" />

        <el-select
          v-if="viewMode === 'item'"
          v-model="selectedItemId"
          placeholder="查看单件商品"
          clearable
          class="chart-select"
          @change="handleChartChange"
        >
          <el-option
            v-for="item in items"
            :key="item.id"
            :label="`${item.id}. ${item.name}`"
            :value="item.id"
          />
        </el-select>

        <el-date-picker
          v-if="viewMode === 'week'"
          v-model="selectedWeek"
          type="week"
          format="[第] ww [周]"
          value-format="YYYY-MM-DD"
          placeholder="选择某一周"
          class="chart-select"
          @change="handleChartChange"
        />

        <div v-if="viewMode === 'week'" class="week-actions">
          <el-button plain @click="shiftWeek(-1)">上一周</el-button>
          <el-button plain @click="resetToCurrentWeek">本周</el-button>
          <el-button plain @click="shiftWeek(1)">下一周</el-button>
        </div>
      </div>
    </div>

    <div ref="chartRef" class="chart-container" v-loading="loading"></div>

    <div class="chart-summary">
      <div class="summary-card summary-card--buy">
        <span class="summary-card__label">{{ summaryLabels.buy }}</span>
        <strong class="summary-card__value">¥{{ totalBuyPrice.toFixed(2) }}</strong>
      </div>
      <div class="summary-card summary-card--sell">
        <span class="summary-card__label">{{ summaryLabels.sell }}</span>
        <strong class="summary-card__value">¥{{ totalSellPrice.toFixed(2) }}</strong>
      </div>
      <div class="summary-card" :class="totalProfit >= 0 ? 'summary-card--profit' : 'summary-card--loss'">
        <span class="summary-card__label">{{ summaryLabels.profit }}</span>
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

type ViewMode = 'all' | 'item' | 'week'

interface ChartDataset {
  title: string
  categories: string[]
  buySeries: number[]
  sellSeries: number[]
  profitSeries: number[]
  summary: {
    buy: number
    sell: number
    profit: number
  }
}

const props = defineProps<{
  items: Item[]
}>()

const chartRef = ref<HTMLElement>()
const chartInstance = ref<ECharts | null>(null)
const loading = ref(false)
const viewMode = ref<ViewMode>('all')
const selectedItemId = ref('')
const selectedWeek = ref(getCurrentWeekValue())

const viewOptions = [
  { label: '全部商品', value: 'all' },
  { label: '单件商品', value: 'item' },
  { label: '周利润', value: 'week' }
]

const chartData = computed<ChartDataset | null>(() => {
  if (viewMode.value === 'item') {
    const item = props.items.find(entry => entry.id === selectedItemId.value)
    if (!item) {
      return buildEmptyDataset('单件商品详情')
    }

    const profit = calculateProfit(item)
    return {
      title: `${item.id}. ${item.name}`,
      categories: ['金额对比'],
      buySeries: [profit.totalCost],
      sellSeries: [item.actualSellPrice || item.expectedSellPrice || 0],
      profitSeries: [profit.actualProfit ?? profit.expectedProfit ?? 0],
      summary: {
        buy: profit.totalCost,
        sell: item.actualSellPrice || item.expectedSellPrice || 0,
        profit: profit.actualProfit ?? profit.expectedProfit ?? 0
      }
    }
  }

  if (viewMode.value === 'week') {
    return buildWeeklyDataset(props.items, selectedWeek.value)
  }

  return props.items.reduce<ChartDataset>(
    (acc, item) => {
      const profit = calculateProfit(item)
      acc.summary.buy += profit.totalCost
      acc.summary.sell += item.actualSellPrice || item.expectedSellPrice || 0
      acc.summary.profit += profit.actualProfit ?? profit.expectedProfit ?? 0
      acc.buySeries[0] = acc.summary.buy
      acc.sellSeries[0] = acc.summary.sell
      acc.profitSeries[0] = acc.summary.profit
      return acc
    },
    {
      title: '全部商品汇总',
      categories: ['金额对比'],
      buySeries: [0],
      sellSeries: [0],
      profitSeries: [0],
      summary: {
        buy: 0,
        sell: 0,
        profit: 0
      }
    }
  )
})

const totalBuyPrice = computed(() => chartData.value?.summary.buy ?? 0)
const totalSellPrice = computed(() => chartData.value?.summary.sell ?? 0)
const totalProfit = computed(() => chartData.value?.summary.profit ?? 0)

const summaryLabels = computed(() => {
  if (viewMode.value === 'week') {
    return {
      buy: '本周成本',
      sell: '本周收入',
      profit: '本周利润'
    }
  }

  return {
    buy: '买入成本',
    sell: '卖出收入',
    profit: '利润表现'
  }
})

function initChart() {
  if (!chartRef.value) return
  chartInstance.value = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance.value || !chartData.value) return

  const data = chartData.value
  const isWeekly = viewMode.value === 'week'

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
        type: isWeekly ? 'line' : 'shadow'
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
      data: data.categories,
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
        type: isWeekly ? 'line' : 'bar',
        smooth: isWeekly,
        barMaxWidth: 42,
        data: data.buySeries,
        itemStyle: {
          borderRadius: [14, 14, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#7aa2ff' },
            { offset: 1, color: '#5b7def' }
          ])
        },
        lineStyle: {
          width: 3,
          color: '#5b7def'
        },
        areaStyle: isWeekly
          ? {
              color: 'rgba(91, 125, 239, 0.12)'
            }
          : undefined
      },
      {
        name: '卖出收入',
        type: isWeekly ? 'line' : 'bar',
        smooth: isWeekly,
        barMaxWidth: 42,
        data: data.sellSeries,
        itemStyle: {
          borderRadius: [14, 14, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#52d5aa' },
            { offset: 1, color: '#28b37d' }
          ])
        },
        lineStyle: {
          width: 3,
          color: '#28b37d'
        },
        areaStyle: isWeekly
          ? {
              color: 'rgba(40, 179, 125, 0.12)'
            }
          : undefined
      },
      {
        name: '利润',
        type: isWeekly ? 'line' : 'bar',
        smooth: isWeekly,
        barMaxWidth: 42,
        data: data.profitSeries,
        itemStyle: {
          borderRadius: [14, 14, 0, 0],
          color:
            totalProfit.value >= 0
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#ffc86a' },
                  { offset: 1, color: '#f2a53b' }
                ])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#f58b98' },
                  { offset: 1, color: '#e45d6f' }
                ])
        },
        lineStyle: {
          width: 3,
          color: totalProfit.value >= 0 ? '#f2a53b' : '#e45d6f'
        },
        areaStyle: isWeekly
          ? {
              color: totalProfit.value >= 0 ? 'rgba(242, 165, 59, 0.12)' : 'rgba(228, 93, 111, 0.12)'
            }
          : undefined
      }
    ]
  }

  chartInstance.value.setOption(option)
}

function handleChartChange() {
  nextTick(updateChart)
}

function shiftWeek(offset: number) {
  const base = selectedWeek.value ? new Date(selectedWeek.value) : getWeekStart(new Date())
  const nextWeek = addDays(getWeekStart(base), offset * 7)
  selectedWeek.value = toDateValue(nextWeek)
  nextTick(updateChart)
}

function resetToCurrentWeek() {
  selectedWeek.value = getCurrentWeekValue()
  nextTick(updateChart)
}

watch(viewMode, () => {
  if (viewMode.value !== 'item') {
    selectedItemId.value = ''
  }
  if (viewMode.value === 'week' && !selectedWeek.value) {
    selectedWeek.value = getCurrentWeekValue()
  }
  nextTick(updateChart)
})

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

function buildWeeklyDataset(items: Item[], weekValue?: string): ChartDataset {
  const start = getWeekStart(weekValue ? new Date(weekValue) : new Date())
  const categories: string[] = []
  const buySeries = new Array<number>(7).fill(0)
  const sellSeries = new Array<number>(7).fill(0)
  const profitSeries = new Array<number>(7).fill(0)

  for (let day = 0; day < 7; day += 1) {
    const current = new Date(start)
    current.setDate(start.getDate() + day)
    categories.push(formatWeekday(current))
  }

  items.forEach(item => {
    if (!item.sellTime) return

    const sellDate = new Date(item.sellTime)
    if (Number.isNaN(sellDate.getTime())) return

    const dayIndex = getDiffDays(start, sellDate)
    if (dayIndex < 0 || dayIndex > 6) return

    const profit = calculateProfit(item)
    buySeries[dayIndex] += profit.totalCost
    sellSeries[dayIndex] += item.actualSellPrice || 0
    profitSeries[dayIndex] += profit.actualProfit ?? 0
  })

  return {
    title: `${formatDateLabel(start)} - ${formatDateLabel(addDays(start, 6))} 周利润`,
    categories,
    buySeries,
    sellSeries,
    profitSeries,
    summary: {
      buy: buySeries.reduce((sum, value) => sum + value, 0),
      sell: sellSeries.reduce((sum, value) => sum + value, 0),
      profit: profitSeries.reduce((sum, value) => sum + value, 0)
    }
  }
}

function buildEmptyDataset(title: string): ChartDataset {
  return {
    title,
    categories: ['金额对比'],
    buySeries: [0],
    sellSeries: [0],
    profitSeries: [0],
    summary: {
      buy: 0,
      sell: 0,
      profit: 0
    }
  }
}

function getCurrentWeekValue() {
  const start = getWeekStart(new Date())
  return toDateValue(start)
}

function getWeekStart(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() + diff)
  return copy
}

function getDiffDays(start: Date, target: Date) {
  const normalizedTarget = new Date(target)
  normalizedTarget.setHours(0, 0, 0, 0)
  return Math.floor((normalizedTarget.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function formatWeekday(date: Date) {
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const day = date.getDay()
  return weekdays[day === 0 ? 6 : day - 1]
}

function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
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

.chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
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

.mode-switch {
  min-width: 228px;
}

.chart-select {
  width: min(260px, 100%);
}

.week-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

  .chart-header,
  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .chart-title {
    font-size: 22px;
  }

  .mode-switch,
  .chart-select,
  .week-actions {
    width: 100%;
  }

  .week-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .chart-container {
    height: 300px;
  }

  .chart-summary {
    grid-template-columns: 1fr;
  }
}
</style>
