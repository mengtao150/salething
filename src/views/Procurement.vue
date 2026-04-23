<template>
  <div class="procurement-page">
    <section class="hero-section">
      <div class="hero-copy">
        <span class="hero-eyebrow">Procurement Workspace</span>
        <h1>先记录采购，再在入仓或售出时一键转入得物流程</h1>
        <p>
          这里专门管理从淘宝、拼多多等平台买下来的商品。采购阶段只记录基础采购信息，等商品进入得物入仓或确认售出时，再补充邮费、卖价和物流查询等正式流转数据。
        </p>
      </div>

      <div class="hero-panel">
        <div class="hero-chip">
          <span class="hero-chip__label">采购记录</span>
          <strong>{{ procurementItems.length }}</strong>
        </div>
        <div class="hero-chip">
          <span class="hero-chip__label">采购总金额</span>
          <strong>¥{{ totalBuyCost.toFixed(2) }}</strong>
        </div>
        <div class="hero-chip">
          <span class="hero-chip__label">平均买入价</span>
          <strong>¥{{ averageBuyCost.toFixed(2) }}</strong>
        </div>
      </div>
    </section>

    <el-card class="surface-card action-card" shadow="never">
      <div class="section-title">
        <div>
          <span class="section-kicker">采购筛选</span>
          <h2>集中管理待转得物商品</h2>
        </div>
      </div>

      <el-row :gutter="12" class="action-row">
        <el-col :xs="24" :sm="12" :md="12" :lg="8">
          <el-input v-model="searchKeyword" placeholder="搜索商品名称或货号" :prefix-icon="Search" clearable />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="4">
          <el-select v-model="filterCategory" placeholder="全部类别" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option v-for="category in categoryOptions" :key="category" :label="category" :value="category" />
          </el-select>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="4">
          <el-select v-model="filterPlatform" placeholder="全部平台" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="拼多多" value="拼多多" />
            <el-option label="淘宝" value="淘宝" />
            <el-option label="抖音" value="抖音" />
            <el-option label="京东" value="京东" />
            <el-option label="唯品会" value="唯品会" />
            <el-option label="快手" value="快手" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="4">
          <el-button type="primary" :icon="Plus" @click="showAddDialog" class="create-button">新增采购记录</el-button>
        </el-col>
      </el-row>
    </el-card>

    <section class="items-section" v-loading="itemsStore.loading">
      <div class="list-header">
        <div>
          <span class="section-kicker">采购列表</span>
          <h2>采购完成后，从这里一键转为得物入仓或得物售出</h2>
        </div>
        <div class="list-header__meta">
          <span>{{ displayItems.length }} 件待处理</span>
        </div>
      </div>

      <div v-if="displayGroups.length" class="category-groups">
        <section v-for="group in displayGroups" :key="group.category" class="category-section">
          <div class="category-header" :class="`category-${categoryClassMap[group.category]}`">
            <div>
              <h3>{{ group.category }}</h3>
              <p>{{ group.items.length }} 件采购商品</p>
            </div>
            <el-tag round effect="light">采购额 ¥{{ groupTotalBuyCost(group.items).toFixed(2) }}</el-tag>
          </div>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in group.items" :key="item.id">
              <ProcurementCard
                :item="item"
                @edit="handleEdit"
                @delete="handleDelete"
                @inbound="openInboundDialog"
                @sold="openSoldDialog"
              />
            </el-col>
          </el-row>
        </section>
      </div>

      <el-empty v-else class="empty-panel" description="还没有采购记录">
        <el-button type="primary" @click="showAddDialog">添加第一条采购记录</el-button>
      </el-empty>
    </section>

    <el-dialog v-model="addDialogVisible" title="新增采购记录" :width="dialogWidth" :before-close="handleCloseAddDialog">
      <ProcurementForm ref="addFormRef" @submit="handleAddSubmit" />
      <template #footer>
        <el-button @click="handleCloseAddDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑采购记录" :width="dialogWidth" :before-close="handleCloseEditDialog">
      <ProcurementForm ref="editFormRef" :item="editingItem" @submit="handleEditSubmit" />
      <template #footer>
        <el-button @click="handleCloseEditDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmEdit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="inboundDialogVisible" title="转为得物入仓" width="460px">
      <el-form :model="inboundForm" label-width="92px">
        <el-form-item label="商品名称">
          <span>{{ activeProcurementItem?.name }}</span>
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="inboundForm.logisticCode" placeholder="请输入物流单号" clearable />
        </el-form-item>
        <el-form-item label="校验信息">
          <el-input
            v-model="inboundForm.customerName"
            placeholder="顺丰等快递可填收/寄件人手机号后四位"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <div class="trace-actions">
            <div class="trace-actions__buttons">
              <el-button :loading="traceLoading" @click="handleQueryTrace()">查询物流</el-button>
              <el-button v-if="traceResult" :loading="traceLoading" plain @click="handleQueryTrace(true)">刷新物流</el-button>
            </div>
            <span class="trace-tip">已对物流单号和物流结果做本地缓存，30 分钟内会优先走缓存。</span>
          </div>
        </el-form-item>

        <el-alert
          v-if="traceError"
          class="trace-alert"
          type="warning"
          :closable="false"
          :title="traceError"
          show-icon
        />

        <div v-if="traceResult" class="trace-panel">
          <div class="trace-summary">
            <div class="trace-summary__item">
              <span>快递公司</span>
              <strong>{{ traceResult.shipperName }}</strong>
            </div>
            <div class="trace-summary__item">
              <span>当前状态</span>
              <strong>{{ traceResult.stateLabel }}</strong>
            </div>
            <div class="trace-summary__item">
              <span>单号</span>
              <strong>{{ traceResult.logisticCode }}</strong>
            </div>
          </div>

          <div class="trace-cache-meta">
            <el-tag size="small" :type="traceResult.fromCache ? 'info' : 'success'" round>
              {{ traceResult.fromCache ? '缓存结果' : '实时结果' }}
            </el-tag>
            <span v-if="traceResult.cachedAt">{{ formatCacheTime(traceResult.cachedAt) }}</span>
          </div>

          <el-empty v-if="!traceResult.traces.length" description="暂未返回物流轨迹" :image-size="72" />

          <el-timeline v-else class="trace-timeline">
            <el-timeline-item
              v-for="trace in traceResult.traces"
              :key="`${trace.AcceptTime}-${trace.AcceptStation}`"
              :timestamp="trace.AcceptTime"
              placement="top"
            >
              <div class="trace-station">{{ trace.AcceptStation }}</div>
              <div v-if="trace.Location" class="trace-location">{{ trace.Location }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <el-form-item label="入仓时间">
          <el-date-picker
            v-model="inboundForm.receivedTime"
            type="datetime"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            :teleported="false"
            popper-class="mobile-date-popper"
          />
        </el-form-item>
        <el-form-item label="邮费">
          <el-input-number v-model="inboundForm.shippingFee" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="目标卖价">
          <el-input-number
            v-model="inboundForm.expectedSellPrice"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeInboundDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmInbound">确认转入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="soldDialogVisible" title="转为得物售出" width="440px">
      <el-form :model="soldForm" label-width="92px">
        <el-form-item label="商品名称">
          <span>{{ activeProcurementItem?.name }}</span>
        </el-form-item>
        <el-form-item label="入仓时间">
          <el-date-picker
            v-model="soldForm.receivedTime"
            type="datetime"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            :teleported="false"
            popper-class="mobile-date-popper"
          />
        </el-form-item>
        <el-form-item label="邮费">
          <el-input-number v-model="soldForm.shippingFee" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="目标卖价">
          <el-input-number
            v-model="soldForm.expectedSellPrice"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="售出时间">
          <el-date-picker
            v-model="soldForm.sellTime"
            type="datetime"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            :teleported="false"
            popper-class="mobile-date-popper"
          />
        </el-form-item>
        <el-form-item label="实际卖价">
          <el-input-number v-model="soldForm.actualSellPrice" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeSoldDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmSold">确认转入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import ProcurementCard from '@/components/ProcurementCard.vue'
import ProcurementForm from '@/components/ProcurementForm.vue'
import { useItemsStore } from '@/stores/items'
import { queryKdniaoTrace, type KdniaoTraceResult } from '@/utils/kdniao'
import type { Item, ItemCategory, Platform } from '@/types'

const itemsStore = useItemsStore()

const categoryOptions: ItemCategory[] = ['鞋子', '书包', '衣服', '其他']
const categoryClassMap: Record<ItemCategory, string> = {
  鞋子: 'shoes',
  书包: 'bag',
  衣服: 'clothes',
  其他: 'other'
}

const searchKeyword = ref('')
const filterCategory = ref<'' | ItemCategory>('')
const filterPlatform = ref<'' | Platform>('')

const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const inboundDialogVisible = ref(false)
const soldDialogVisible = ref(false)

const addFormRef = ref<InstanceType<typeof ProcurementForm>>()
const editFormRef = ref<InstanceType<typeof ProcurementForm>>()

const editingItem = ref<Item>()
const activeProcurementItem = ref<Item>()
const traceLoading = ref(false)
const traceError = ref('')
const traceResult = ref<KdniaoTraceResult | null>(null)

const inboundForm = ref({
  logisticCode: '',
  customerName: '',
  receivedTime: new Date(),
  shippingFee: 0,
  expectedSellPrice: 0
})

const soldForm = ref({
  receivedTime: new Date(),
  shippingFee: 0,
  expectedSellPrice: 0,
  sellTime: new Date(),
  actualSellPrice: 0
})

const dialogWidth = computed(() => (window.innerWidth < 768 ? '94%' : '560px'))
const procurementItems = computed(() => itemsStore.getItemsByRecordStage('procurement'))

const displayItems = computed(() => {
  let items = [...procurementItems.value]

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    items = items.filter(item => item.name.toLowerCase().includes(keyword) || item.sku?.toLowerCase().includes(keyword))
  }

  if (filterCategory.value) {
    items = items.filter(item => item.category === filterCategory.value)
  }

  if (filterPlatform.value) {
    items = items.filter(item => item.platform === filterPlatform.value)
  }

  return items.sort((a, b) => new Date(b.createdAt || b.buyTime).getTime() - new Date(a.createdAt || a.buyTime).getTime())
})

const displayGroups = computed(() =>
  categoryOptions
    .map(category => ({
      category,
      items: displayItems.value.filter(item => item.category === category)
    }))
    .filter(group => group.items.length > 0)
)

const totalBuyCost = computed(() => procurementItems.value.reduce((sum, item) => sum + item.buyPrice, 0))
const averageBuyCost = computed(() => {
  if (!procurementItems.value.length) return 0
  return totalBuyCost.value / procurementItems.value.length
})

onMounted(async () => {
  if (!itemsStore.allItems.length) {
    await itemsStore.init()
  }
})

function showAddDialog() {
  addDialogVisible.value = true
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
    ElMessage.success('采购记录已添加')
  }
}

async function handleAddSubmit(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
  await itemsStore.addItem(data)
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
    ElMessage.success('采购记录已更新')
  }
}

async function handleEditSubmit(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
  if (editingItem.value) {
    await itemsStore.updateItem(editingItem.value.id, data)
  }
}

async function handleDelete(id: string) {
  await itemsStore.deleteItem(id)
  ElMessage.success('采购记录已删除')
}

function resetTraceState() {
  traceError.value = ''
  traceResult.value = null
  traceLoading.value = false
}

function openInboundDialog(item: Item) {
  activeProcurementItem.value = item
  inboundForm.value.logisticCode = ''
  inboundForm.value.customerName = ''
  inboundForm.value.receivedTime = new Date()
  inboundForm.value.shippingFee = item.shippingFee || 0
  inboundForm.value.expectedSellPrice = item.expectedSellPrice || 0
  resetTraceState()
  inboundDialogVisible.value = true
}

function closeInboundDialog() {
  inboundDialogVisible.value = false
  activeProcurementItem.value = undefined
  resetTraceState()
}

function openSoldDialog(item: Item) {
  activeProcurementItem.value = item
  soldForm.value.receivedTime = new Date()
  soldForm.value.shippingFee = item.shippingFee || 0
  soldForm.value.expectedSellPrice = item.expectedSellPrice || 0
  soldForm.value.sellTime = new Date()
  soldForm.value.actualSellPrice = item.expectedSellPrice || 0
  soldDialogVisible.value = true
}

function closeSoldDialog() {
  soldDialogVisible.value = false
  activeProcurementItem.value = undefined
}

async function handleQueryTrace(forceRefresh = false) {
  if (!inboundForm.value.logisticCode.trim()) {
    traceError.value = '请先输入物流单号'
    return
  }

  traceLoading.value = true
  traceError.value = ''
  traceResult.value = null

  try {
    const result = await queryKdniaoTrace({
      logisticCode: inboundForm.value.logisticCode,
      customerName: inboundForm.value.customerName,
      forceRefresh
    })
    traceResult.value = result
    ElMessage.success(result.fromCache ? '已读取缓存物流信息' : '物流信息查询成功')
  } catch (error) {
    traceError.value = error instanceof Error ? error.message : '物流查询失败，请稍后重试'
  } finally {
    traceLoading.value = false
  }
}

function formatCacheTime(dateText: string) {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return ''
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `缓存时间 ${month}/${day} ${hours}:${minutes}`
}

async function handleConfirmInbound() {
  if (!activeProcurementItem.value) return
  if (!inboundForm.value.expectedSellPrice || inboundForm.value.expectedSellPrice <= 0) {
    ElMessage.warning('请输入目标卖价')
    return
  }

  await itemsStore.moveProcurementToInventory(activeProcurementItem.value.id, 'received', {
    receivedTime: inboundForm.value.receivedTime.toISOString(),
    shippingFee: inboundForm.value.shippingFee,
    expectedSellPrice: inboundForm.value.expectedSellPrice
  })

  closeInboundDialog()
  ElMessage.success('已转为得物入仓商品')
}

async function handleConfirmSold() {
  if (!activeProcurementItem.value) return
  if (!soldForm.value.expectedSellPrice || soldForm.value.expectedSellPrice <= 0) {
    ElMessage.warning('请输入目标卖价')
    return
  }
  if (!soldForm.value.actualSellPrice || soldForm.value.actualSellPrice <= 0) {
    ElMessage.warning('请输入实际卖价')
    return
  }

  await itemsStore.moveProcurementToInventory(activeProcurementItem.value.id, 'sold', {
    receivedTime: soldForm.value.receivedTime.toISOString(),
    shippingFee: soldForm.value.shippingFee,
    expectedSellPrice: soldForm.value.expectedSellPrice,
    sellTime: soldForm.value.sellTime.toISOString(),
    actualSellPrice: soldForm.value.actualSellPrice
  })

  closeSoldDialog()
  ElMessage.success('已转为得物售出商品')
}

function groupTotalBuyCost(items: Item[]) {
  return items.reduce((sum, item) => sum + item.buyPrice, 0)
}
</script>

<style scoped lang="scss">
.procurement-page {
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
    radial-gradient(circle at top left, rgba(40, 179, 125, 0.18), transparent 42%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(246, 255, 250, 0.78));

  h1 {
    max-width: 12em;
    margin: 10px 0 12px;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1.08;
    letter-spacing: -0.04em;
    color: #10213d;
  }

  p {
    max-width: 46rem;
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
  color: #2f8d65;
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
  background: linear-gradient(135deg, rgba(247, 255, 252, 0.96), rgba(236, 248, 242, 0.9));

  strong {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #14294a;
  }
}

.hero-chip__label {
  font-size: 13px;
  color: #70809b;
}

.surface-card {
  margin-bottom: 18px;
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

.action-row {
  align-items: center;
}

.create-button {
  width: 100%;
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

.list-header__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #6c7892;
}

.category-groups {
  display: grid;
  gap: 24px;
}

.category-section {
  display: grid;
  gap: 14px;
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

.trace-actions {
  display: grid;
  gap: 8px;
  width: 100%;
}

.trace-actions__buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.trace-tip {
  font-size: 12px;
  line-height: 1.5;
  color: #7d8aa2;
}

.trace-alert {
  margin-bottom: 14px;
}

.trace-panel {
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(245, 248, 255, 0.9);
}

.trace-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.trace-summary__item {
  display: grid;
  gap: 6px;

  span {
    font-size: 12px;
    color: #7d8aa2;
  }

  strong {
    color: #1c304f;
    word-break: break-all;
  }
}

.trace-cache-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #70809b;
}

.trace-timeline {
  padding-top: 6px;
}

.trace-station {
  font-weight: 600;
  color: #172b4d;
}

.trace-location {
  margin-top: 4px;
  font-size: 12px;
  color: #70809b;
}

.empty-panel {
  margin-top: 24px;
  padding: 24px 0;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.72);
}

@media (max-width: 992px) {
  .hero-section {
    grid-template-columns: 1fr;
  }

  .trace-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .procurement-page {
    padding: 14px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
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
  }

  .hero-panel {
    padding: 14px;
  }

  .hero-chip {
    padding: 14px 16px;
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

  .create-button {
    height: 46px;
  }
}
</style>
