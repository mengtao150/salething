<template>
  <div class="home-container">
    <section class="hero-section">
      <div class="hero-copy">
        <span class="hero-eyebrow">SaleThing Dashboard</span>
        <h1>让每一件商品的状态都更清晰</h1>
        <p>首页默认只展示正在倒计时的在库商品，你也可以继续按分类、平台和状态快速筛选。</p>
      </div>

      <div class="hero-panel">
        <div class="hero-chip">
          <span class="hero-chip__label">在库商品</span>
          <strong>{{ activeItemCount }}</strong>
        </div>
        <div class="hero-chip">
          <span class="hero-chip__label">已售商品</span>
          <strong>{{ itemsStore.stats.soldItems }}</strong>
        </div>
        <div class="hero-chip">
          <span class="hero-chip__label">当前利润率</span>
          <strong>{{ itemsStore.stats.profitRate.toFixed(1) }}%</strong>
        </div>
      </div>
    </section>

    <section class="stats-shell">
      <StatsCard :stats="itemsStore.stats" />
    </section>

    <section class="toolbar-grid">
      <el-card class="surface-card reminder-card" shadow="never">
        <div class="section-title">
          <div>
            <span class="section-kicker">提醒中心</span>
            <h2>退货倒计时提醒</h2>
          </div>
          <span class="section-aside">{{ urgentItemCount }} 件需要关注</span>
        </div>

        <div class="button-stack">
          <el-button type="warning" :icon="Bell" @click="manualCheckReminders">检查倒计时提醒</el-button>
          <el-button type="info" plain @click="testEmailReminder">测试邮件提醒</el-button>
        </div>
      </el-card>

      <el-card class="surface-card action-card" shadow="never">
        <div class="section-title">
          <div>
            <span class="section-kicker">快捷操作</span>
            <h2>筛选、录入与导入</h2>
          </div>
        </div>

        <el-row :gutter="12" class="action-row">
          <el-col :xs="24" :sm="12" :md="12" :lg="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索商品名称"
              :prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="4">
            <el-select
              v-model="filterCategory"
              placeholder="全部类别"
              clearable
              style="width: 100%"
              @change="handleFilter"
            >
              <el-option label="全部" value="" />
              <el-option v-for="category in categoryOptions" :key="category" :label="category" :value="category" />
            </el-select>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="4">
            <el-select
              v-model="filterPlatform"
              placeholder="全部平台"
              clearable
              style="width: 100%"
              @change="handleFilter"
            >
              <el-option label="全部" value="" />
              <el-option label="拼多多" value="拼多多" />
              <el-option label="淘宝" value="淘宝" />
              <el-option label="抖音" value="抖音" />
              <el-option label="京东" value="京东" />
              <el-option label="唯品会" value="唯品会" />
              <el-option label="快手" value="快手" />
            </el-select>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="4">
            <el-select
              v-model="filterStatus"
              placeholder="商品状态"
              clearable
              style="width: 100%"
              @change="handleFilter"
            >
              <el-option label="全部" value="" />
              <el-option label="待收货" value="pending" />
              <el-option label="入仓" value="received" />
              <el-option label="售出" value="sold" />
              <el-option label="交易成功" value="completed" />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12" :lg="4">
            <el-button type="info" plain :icon="Upload" @click="openExcelImport" class="create-button" :loading="importingExcel">
              Excel 导入
            </el-button>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12" :lg="4">
            <el-button type="primary" :icon="Plus" @click="showAddDialog" class="create-button">添加商品</el-button>
          </el-col>
        </el-row>

        <input ref="excelInputRef" type="file" accept=".xlsx,.xls" class="excel-input" @change="handleExcelFileChange" />
      </el-card>
    </section>

    <ItemChart :items="inventoryItems" />

    <section class="items-section" v-loading="itemsStore.loading">
      <div class="list-header">
        <div>
          <span class="section-kicker">商品列表</span>
          <h2>默认展示倒计时中的商品</h2>
        </div>
        <div class="list-header__meta">
          <span>{{ displayItems.length }} 件</span>
          <span>{{ soldItemCount }} 件已售出或成交</span>
        </div>
      </div>

      <div v-if="displayGroups.length" class="category-groups">
        <section v-for="group in displayGroups" :key="group.category" class="category-section">
          <div class="category-header" :class="`category-${categoryClassMap[group.category]}`">
            <div>
              <h3>{{ group.category }}</h3>
              <p>{{ group.items.length }} 件商品</p>
            </div>
            <el-tag round effect="light">{{ group.items.filter(item => isCountdownItem(item)).length }} 件在仓</el-tag>
          </div>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in group.items" :key="item.id">
              <ItemCard :item="item" @sell="handleSell" @edit="handleEdit" @delete="handleDelete" />
            </el-col>
          </el-row>
        </section>
      </div>

      <el-empty v-else class="empty-panel" description="没有符合当前筛选条件的商品">
        <el-button type="primary" @click="showAddDialog">添加第一件商品</el-button>
      </el-empty>
    </section>

    <el-dialog
      v-model="addDialogVisible"
      title="添加商品"
      :width="dialogWidth"
      :before-close="handleCloseAddDialog"
    >
      <ItemForm ref="addFormRef" @submit="handleAddSubmit" />
      <template #footer>
        <el-button @click="handleCloseAddDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑商品"
      :width="dialogWidth"
      :before-close="handleCloseEditDialog"
    >
      <ItemForm ref="editFormRef" :key="editingItem?.id || 'edit-form'" :item="editingItem" @submit="handleEditSubmit" />

      <div v-if="editingItem" class="profit-estimate">
        <el-divider />
        <div class="profit-title">利润预估</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="profit-item">
              <span class="label">总成本</span>
              <span class="value">¥{{ editProfit.totalCost.toFixed(2) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="profit-item">
              <span class="label">预计利润</span>
              <span class="value" :class="editProfit.expectedProfit >= 0 ? 'positive' : 'negative'">
                ¥{{ editProfit.expectedProfit.toFixed(2) }}
              </span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="profit-row">
          <el-col :span="12">
            <div class="profit-item">
              <span class="label">利润率</span>
              <span class="value" :class="(editProfit.profitRate || 0) >= 0 ? 'positive' : 'negative'">
                {{ editProfit.profitRate ? editProfit.profitRate.toFixed(1) : '0.0' }}%
              </span>
            </div>
          </el-col>
          <el-col :span="12" v-if="editingItemSold && editProfit.actualProfit !== undefined">
            <div class="profit-item">
              <span class="label">实际利润</span>
              <span class="value" :class="editProfit.actualProfit >= 0 ? 'positive' : 'negative'">
                ¥{{ editProfit.actualProfit.toFixed(2) }}
              </span>
            </div>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <el-button @click="handleCloseEditDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmEdit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="sellDialogVisible" title="确认售出" width="400px">
      <el-form :model="sellForm" label-width="80px">
        <el-form-item label="商品名称">
          <span>{{ sellingItem?.name }}</span>
        </el-form-item>
        <el-form-item label="实际售价">
          <el-input-number
            v-model="sellForm.sellPrice"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sellDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmSell">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bell, Plus, Search, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ItemCard from '@/components/ItemCard.vue'
import ItemChart from '@/components/ItemChart.vue'
import ItemForm from '@/components/ItemForm.vue'
import StatsCard from '@/components/StatsCard.vue'
import { emailJsConfig } from '@/config/emailjs'
import { useItemsStore } from '@/stores/items'
import type { Item, ItemCategory, ItemStatus, Platform } from '@/types'
import { getCountdown } from '@/utils/countdown'
import { parseExcelFile } from '@/utils/excelImport'
import { getItemStatus, isCountdownItem, isItemSold } from '@/utils/itemStatus'
import { calculateProfit } from '@/utils/profit'
import { getExpiredItems, getReminderMessage, getUrgentItems, sendEmailReminder } from '@/utils/reminder'

const categoryOptions: ItemCategory[] = ['鞋子', '书包', '衣服', '其他']
const categoryClassMap: Record<ItemCategory, string> = {
  鞋子: 'shoes',
  书包: 'bag',
  衣服: 'clothes',
  其他: 'other'
}

const statusSortOrder: Record<ItemStatus, number> = {
  received: 0,
  pending: 1,
  sold: 2,
  completed: 3
}

const itemsStore = useItemsStore()

const searchKeyword = ref('')
const filterCategory = ref<'' | ItemCategory>('')
const filterPlatform = ref<'' | Platform>('')
const filterStatus = ref<'' | ItemStatus>('received')

const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const sellDialogVisible = ref(false)
const importingExcel = ref(false)

const addFormRef = ref()
const editFormRef = ref()
const excelInputRef = ref<HTMLInputElement>()

const editingItem = ref<Item>()
const sellingItem = ref<Item>()

const sellForm = ref({
  sellPrice: 0
})

const dialogWidth = computed(() => (window.innerWidth < 768 ? '94%' : '560px'))

const editProfit = computed(() => {
  if (!editingItem.value) {
    return { totalCost: 0, expectedProfit: 0, profitRate: 0 }
  }

  return calculateProfit(editingItem.value)
})

const editingItemSold = computed(() => (editingItem.value ? isItemSold(editingItem.value) : false))
const inventoryItems = computed(() => itemsStore.getItemsByRecordStage('inventory'))

const displayItems = computed(() => {
  let items = [...inventoryItems.value]

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    items = items.filter(item => item.name.toLowerCase().includes(keyword))
  }

  if (filterCategory.value) {
    items = items.filter(item => item.category === filterCategory.value)
  }

  if (filterPlatform.value) {
    items = items.filter(item => item.platform === filterPlatform.value)
  }

  if (filterStatus.value) {
    items = items.filter(item => getItemStatus(item) === filterStatus.value)
  }

  return items.sort((a, b) => {
    const aStatus = getItemStatus(a)
    const bStatus = getItemStatus(b)

    if (statusSortOrder[aStatus] !== statusSortOrder[bStatus]) {
      return statusSortOrder[aStatus] - statusSortOrder[bStatus]
    }

    if (aStatus === 'received' && bStatus === 'received') {
      const countdownOrder = getCountdownSortValue(a) - getCountdownSortValue(b)
      if (countdownOrder !== 0) {
        return countdownOrder
      }
    }

    if (isItemSold(a) && isItemSold(b)) {
      const aTime = a.sellTime ? new Date(a.sellTime).getTime() : 0
      const bTime = b.sellTime ? new Date(b.sellTime).getTime() : 0
      return bTime - aTime
    }

    const aUpdated = new Date(a.updatedAt).getTime()
    const bUpdated = new Date(b.updatedAt).getTime()
    return bUpdated - aUpdated
  })
})

const displayGroups = computed(() =>
  categoryOptions
    .map(category => ({
      category,
      items: displayItems.value.filter(item => item.category === category)
    }))
    .filter(group => group.items.length > 0)
    .sort((a, b) => {
      const aPriority = Math.min(...a.items.map(getCountdownSortValue))
      const bPriority = Math.min(...b.items.map(getCountdownSortValue))
      return aPriority - bPriority
    })
)

const activeItemCount = computed(() => inventoryItems.value.filter(item => isCountdownItem(item)).length)
const soldItemCount = computed(() => inventoryItems.value.filter(item => isItemSold(item)).length)
const urgentItemCount = computed(() => getUrgentItems(inventoryItems.value).length + getExpiredItems(inventoryItems.value).length)

onMounted(async () => {
  await itemsStore.init()
  await checkReminders()
})

async function checkReminders() {
  const urgentItems = getUrgentItems(inventoryItems.value)
  const expiredItems = getExpiredItems(inventoryItems.value)

  if (urgentItems.length === 0 && expiredItems.length === 0) {
    cleanupReminderCache([])
    return
  }

  const reminderCache = getReminderCache()
  const currentReminderEntries = [
    ...urgentItems.map(item => ({ id: item.id, status: 'urgent' as const })),
    ...expiredItems.map(item => ({ id: item.id, status: 'expired' as const }))
  ]

  cleanupReminderCache(currentReminderEntries.map(entry => `${entry.id}:${entry.status}`))

  const unsentUrgentItems = urgentItems.filter(item => reminderCache[`${item.id}:urgent`] !== true)
  const unsentExpiredItems = expiredItems.filter(item => reminderCache[`${item.id}:expired`] !== true)

  if (unsentUrgentItems.length === 0 && unsentExpiredItems.length === 0) {
    return
  }

  const email = localStorage.getItem('user_email') || emailJsConfig.targetEmail || '2640622467@qq.com'
  const success = await sendEmailReminder(unsentUrgentItems, unsentExpiredItems, email)

  if (success) {
    unsentUrgentItems.forEach(item => {
      reminderCache[`${item.id}:urgent`] = true
    })
    unsentExpiredItems.forEach(item => {
      reminderCache[`${item.id}:expired`] = true
    })
    saveReminderCache(reminderCache)

    ElMessage.success(`邮件提醒已发送到 ${email}，本次新增 ${unsentUrgentItems.length + unsentExpiredItems.length} 件商品提醒`)
  }

  const message = getReminderMessage(unsentUrgentItems, unsentExpiredItems)
  ElMessageBox.alert(`${message}\n\n邮件提醒已发送到：${email}`, '退货倒计时提醒', {
    confirmButtonText: '我知道了',
    type: unsentUrgentItems.length > 0 ? 'warning' : 'info',
    customClass: 'reminder-message-box'
  }).catch(() => {})
}

function manualCheckReminders() {
  const urgentItems = getUrgentItems(inventoryItems.value)
  const expiredItems = getExpiredItems(inventoryItems.value)

  if (urgentItems.length === 0 && expiredItems.length === 0) {
    ElMessage.success('目前没有需要紧急处理的商品')
    return
  }

  const message = getReminderMessage(urgentItems, expiredItems)
  ElMessageBox.alert(message, '当前提醒商品', {
    confirmButtonText: '知道了',
    type: urgentItems.length > 0 ? 'warning' : 'info',
    customClass: 'reminder-message-box'
  }).catch(() => {})
}

function testEmailReminder() {
  const testItem: Item = {
    id: 'test-123',
    name: '测试商品-请尽快处理',
    category: '其他',
    platform: '淘宝',
    buyPrice: 100,
    buyTime: new Date().toISOString(),
    expectedSellPrice: 150,
    shippingFee: 5,
    recordStage: 'inventory',
    status: 'received',
    received: true,
    receivedTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    sold: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const testEmail = emailJsConfig.targetEmail || '2640622467@qq.com'
  localStorage.setItem('user_email', testEmail)

  ElMessageBox.confirm(
    `即将发送测试邮件到：${testEmail}\n\n测试内容：一件即将超期的商品提醒`,
    '测试邮件提醒',
    {
      confirmButtonText: '发送测试邮件',
      cancelButtonText: '取消',
      type: 'info'
    }
  )
    .then(async () => {
      ElMessage.info('正在发送测试邮件...')
      const success = await sendEmailReminder([testItem], [], testEmail)
      if (success) {
        ElMessage.success(`测试邮件已发送，请查收 ${testEmail}`)
      }
    })
    .catch(() => {})
}

function handleSearch() {}

function handleFilter() {}

function showAddDialog() {
  addDialogVisible.value = true
}

function openExcelImport() {
  excelInputRef.value?.click()
}

async function handleExcelFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  importingExcel.value = true
  try {
    const result = await parseExcelFile(file)
    await itemsStore.addItems(result.items)
    await checkReminders()

    ElMessage.success(`Excel 导入成功，共导入 ${result.items.length} 件商品`)

    if (result.warnings.length) {
      ElMessageBox.alert(formatWarningsMessage(result.warnings), '导入提示', {
        confirmButtonText: '知道了',
        type: 'warning',
        customClass: 'reminder-message-box'
      }).catch(() => {})
    }
  } catch (error: any) {
    ElMessage.error(error?.message || 'Excel 导入失败')
  } finally {
    importingExcel.value = false
    input.value = ''
  }
}

function handleCloseAddDialog() {
  addFormRef.value?.reset()
  addDialogVisible.value = false
}

async function handleConfirmAdd() {
  const success = await addFormRef.value?.submit()
  if (success) {
    addDialogVisible.value = false
    addFormRef.value?.reset()
    ElMessage.success('添加成功')
  }
}

async function handleAddSubmit(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
  await itemsStore.addItem(data)
}

function handleSell(id: string) {
  sellingItem.value = inventoryItems.value.find(item => item.id === id)
  if (sellingItem.value) {
    sellForm.value.sellPrice = sellingItem.value.expectedSellPrice || 0
    sellDialogVisible.value = true
  }
}

async function handleConfirmSell() {
  if (sellForm.value.sellPrice <= 0) {
    ElMessage.warning('请输入售出价格')
    return
  }

  if (sellingItem.value) {
    await itemsStore.confirmSell(sellingItem.value.id, sellForm.value.sellPrice)
    sellDialogVisible.value = false
    sellingItem.value = undefined
    ElMessage.success('已确认售出')
  }
}

function handleEdit(item: Item) {
  editingItem.value = item
  editDialogVisible.value = true
}

function handleCloseEditDialog() {
  editFormRef.value?.reset()
  editDialogVisible.value = false
  editingItem.value = undefined
}

async function handleConfirmEdit() {
  const success = await editFormRef.value?.submit()
  if (success && editingItem.value) {
    editDialogVisible.value = false
    editFormRef.value?.reset()
    editingItem.value = undefined
    ElMessage.success('更新成功')
  }
}

async function handleEditSubmit(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
  if (editingItem.value) {
    await itemsStore.updateItem(editingItem.value.id, data)
  }
}

async function handleDelete(id: string) {
  await itemsStore.deleteItem(id)
  ElMessage.success('已删除')
}

function getCountdownSortValue(item: Item) {
  if (isItemSold(item)) {
    return Number.POSITIVE_INFINITY
  }

  if (getItemStatus(item) === 'pending') {
    return Number.MAX_SAFE_INTEGER - 1
  }

  const countdown = item.receivedTime ? getCountdown(item.receivedTime) : null
  if (!countdown) {
    return Number.MAX_SAFE_INTEGER
  }

  if (countdown.isExpired) {
    return -1
  }

  return countdown.days * 24 * 60 + countdown.hours * 60 + countdown.minutes
}

function formatWarningsMessage(warnings: string[]) {
  const preview = warnings.slice(0, 8).join('\n')
  const hiddenCount = warnings.length - 8
  if (hiddenCount > 0) {
    return `${preview}\n\n另有 ${hiddenCount} 条提示未展开显示。`
  }
  return preview
}

type ReminderCache = Record<string, boolean>

function getReminderCache(): ReminderCache {
  try {
    return JSON.parse(localStorage.getItem('sent_return_reminders') || '{}')
  } catch {
    return {}
  }
}

function saveReminderCache(cache: ReminderCache) {
  localStorage.setItem('sent_return_reminders', JSON.stringify(cache))
}

function cleanupReminderCache(validKeys: string[]) {
  const cache = getReminderCache()
  const nextCache = Object.fromEntries(Object.entries(cache).filter(([key]) => validKeys.includes(key)))
  saveReminderCache(nextCache)
}
</script>

<style scoped lang="scss">
.home-container {
  position: relative;
  min-height: 100vh;
  padding: 24px;
  padding-bottom: calc(36px + env(safe-area-inset-bottom));
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  gap: 18px;
  align-items: stretch;
  margin-bottom: 18px;
}

.hero-copy,
.hero-panel,
.surface-card,
.list-header,
.category-header {
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.hero-copy {
  padding: 28px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top left, rgba(91, 141, 239, 0.18), transparent 42%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(246, 249, 255, 0.76));

  h1 {
    max-width: 10em;
    margin: 10px 0 12px;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1.08;
    letter-spacing: -0.04em;
    color: #10213d;
  }

  p {
    max-width: 42rem;
    font-size: 14px;
    line-height: 1.8;
    color: #5b6780;
  }
}

.hero-eyebrow,
.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #5f7fd7;
}

.hero-panel {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 30px;
}

.hero-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(247, 250, 255, 0.95), rgba(236, 243, 255, 0.9));

  strong {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #14294a;
  }
}

.hero-chip__label {
  font-size: 13px;
  color: #70809b;
}

.stats-shell {
  margin-bottom: 18px;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.surface-card {
  border-radius: 28px;

  :deep(.el-card__body) {
    padding: 22px;
  }
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    margin: 8px 0 0;
    font-size: 22px;
    line-height: 1.15;
    letter-spacing: -0.03em;
    color: #172b4d;
  }
}

.section-aside,
.list-header__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #6c7892;
}

.button-stack {
  display: grid;
  gap: 12px;

  .el-button {
    width: 100%;
    height: 48px;
  }
}

.action-row {
  align-items: center;
}

.create-button {
  width: 100%;
}

.excel-input {
  display: none;
}

.items-section {
  margin-top: 18px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 16px;
  padding: 22px 24px;
  border-radius: 28px;

  h2 {
    margin: 8px 0 0;
    font-size: 22px;
    color: #172b4d;
    letter-spacing: -0.03em;
  }
}

.category-groups {
  display: grid;
  gap: 24px;
}

.category-section {
  display: grid;
  gap: 14px;

  :deep(.el-col) {
    display: flex;
  }
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 24px;

  h3 {
    margin: 0;
    font-size: 20px;
    color: #172b4d;
  }

  p {
    margin: 6px 0 0;
    font-size: 13px;
    color: #7d8aa2;
  }

  &.category-shoes {
    background: linear-gradient(135deg, rgba(91, 125, 239, 0.18), rgba(255, 255, 255, 0.72));
  }

  &.category-bag {
    background: linear-gradient(135deg, rgba(40, 179, 125, 0.16), rgba(255, 255, 255, 0.72));
  }

  &.category-clothes {
    background: linear-gradient(135deg, rgba(242, 165, 59, 0.16), rgba(255, 255, 255, 0.72));
  }

  &.category-other {
    background: linear-gradient(135deg, rgba(139, 149, 170, 0.16), rgba(255, 255, 255, 0.72));
  }
}

.empty-panel {
  margin-top: 24px;
  padding: 24px 0;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.72);
}

.profit-estimate {
  .profit-title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 700;
    color: #172b4d;
  }

  .profit-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-radius: 18px;
    background: #f7f9fc;

    .label {
      font-size: 13px;
      color: #66748d;
    }

    .value {
      font-size: 14px;
      font-weight: 700;
      color: #1b2b46;

      &.positive {
        color: #1f9c68;
      }

      &.negative {
        color: #d95763;
      }
    }
  }
}

.profit-row {
  margin-top: 8px;
}

:deep(.reminder-message-box) {
  .el-message-box__message {
    white-space: pre-line;
    line-height: 1.8;
    font-size: 14px;
  }

  .el-message-box__content {
    padding: 20px;
  }
}

@media (max-width: 992px) {
  .hero-section,
  .toolbar-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .home-container {
    padding: calc(14px + env(safe-area-inset-top)) 14px calc(24px + env(safe-area-inset-bottom));
  }

  .hero-copy,
  .hero-panel,
  .surface-card,
  .list-header,
  .empty-panel,
  .category-header {
    border-radius: 24px;
  }

  .hero-copy {
    padding: 22px 18px;

    h1 {
      max-width: none;
      font-size: 30px;
    }

    p {
      font-size: 13px;
      line-height: 1.7;
    }
  }

  .hero-panel {
    grid-template-columns: 1fr;
    padding: 14px;
  }

  .hero-chip {
    padding: 14px 16px;

    strong {
      font-size: 24px;
    }
  }

  .section-title,
  .list-header,
  .category-header {
    flex-direction: column;
    align-items: stretch;
  }

  .list-header {
    padding: 18px;
  }

  .button-stack .el-button,
  .create-button {
    height: 46px;
  }
}
</style>
