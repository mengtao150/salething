<template>
  <div class="home-container">
    <!-- 顶部统计 -->
    <div class="stats-section">
      <StatsCard :stats="itemsStore.stats" />
    </div>

    <!-- 提醒按钮 -->
    <el-card class="reminder-card" shadow="never">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-button type="warning" :icon="Bell" @click="manualCheckReminders" style="width: 100%">
            🔔 检查倒计时提醒
          </el-button>
        </el-col>
        <el-col :span="12">
          <el-button type="info" @click="testEmailReminder" style="width: 100%">
            📧 测试邮件提醒
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="8" :md="6">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索物品"
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <el-select v-model="filterPlatform" placeholder="全部平台" clearable @change="handleFilter" style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="拼多多" value="拼多多" />
            <el-option label="淘宝" value="淘宝" />
            <el-option label="抖音" value="抖音" />
            <el-option label="京东" value="京东" />
            <el-option label="唯品会" value="唯品会" />
            <el-option label="快手" value="快手" />
          </el-select>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <el-select v-model="filterStatus" placeholder="全部状态" clearable @change="handleFilter" style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="待收货" value="pending" />
            <el-option label="倒计时中" value="received" />
            <el-option label="已卖出" value="sold" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="6">
          <el-button type="primary" :icon="Plus" @click="showAddDialog" style="width: 100%">
            添加物品
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 物品列表 -->
    <div class="items-list" v-loading="itemsStore.loading">
      <div class="list-header">
        <h3>物品列表</h3>
        <span class="count">共 {{ displayItems.length }} 件</span>
      </div>
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in displayItems" :key="item.id">
          <ItemCard
            :item="item"
            @receive="handleReceive"
            @sell="handleSell"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </el-col>
      </el-row>

      <el-empty v-if="displayItems.length === 0" description="暂无物品，点击上方按钮添加">
        <el-button type="primary" @click="showAddDialog">添加第一个物品</el-button>
      </el-empty>
    </div>

    <!-- 添加物品弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加物品"
      :width="dialogWidth"
      :before-close="handleCloseAddDialog"
    >
      <ItemForm ref="addFormRef" @submit="handleAddSubmit" />
      <template #footer>
        <el-button @click="handleCloseAddDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑物品弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑物品"
      :width="dialogWidth"
      :before-close="handleCloseEditDialog"
    >
      <ItemForm ref="editFormRef" :item="editingItem" @submit="handleEditSubmit" />

      <!-- 利润预估 -->
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
        <el-row :gutter="16" style="margin-top: 8px">
          <el-col :span="12">
            <div class="profit-item">
              <span class="label">利润率</span>
              <span class="value" :class="(editProfit.profitRate || 0) >= 0 ? 'positive' : 'negative'">
                {{ editProfit.profitRate ? editProfit.profitRate.toFixed(1) : '0.0' }}%
              </span>
            </div>
          </el-col>
          <el-col :span="12" v-if="editingItem.sold && editProfit.actualProfit !== undefined">
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

    <!-- 卖出确认弹窗 -->
    <el-dialog v-model="sellDialogVisible" title="确认卖出" width="400px">
      <el-form :model="sellForm" label-width="80px">
        <el-form-item label="物品名称">
          <span>{{ sellingItem?.name }}</span>
        </el-form-item>
        <el-form-item label="实际卖价">
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
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Bell } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useItemsStore } from '@/stores/items'
import StatsCard from '@/components/StatsCard.vue'
import ItemCard from '@/components/ItemCard.vue'
import ItemForm from '@/components/ItemForm.vue'
import { calculateProfit } from '@/utils/profit'
import { getUrgentItems, getExpiredItems, getReminderMessage, sendEmailReminder } from '@/utils/reminder'
import { emailJsConfig } from '@/config/emailjs'
import type { Item } from '@/types'

const itemsStore = useItemsStore()

const userEmail = ref('') // 用户邮箱
const searchKeyword = ref('')
const filterPlatform = ref<'' | '拼多多' | '淘宝' | '抖音' | '京东' | '唯品会' | '快手'>('')
const filterStatus = ref<'' | 'pending' | 'received' | 'sold'>('')

const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const sellDialogVisible = ref(false)

const addFormRef = ref()
const editFormRef = ref()

const editingItem = ref<Item>()
const sellingItem = ref<Item>()

const sellForm = ref({
  sellPrice: 0
})

// 对话框宽度（响应式）
const dialogWidth = computed(() => {
  return window.innerWidth < 768 ? '95%' : '500px'
})

// 编辑商品的利润预估
const editProfit = computed(() => {
  if (!editingItem.value) {
    return { totalCost: 0, expectedProfit: 0, profitRate: 0 }
  }
  return calculateProfit(editingItem.value)
})

// 显示的物品列表
const displayItems = computed(() => {
  let items = itemsStore.allItems

  // 搜索
  if (searchKeyword.value) {
    items = itemsStore.searchItems(searchKeyword.value)
  }

  // 平台筛选
  if (filterPlatform.value) {
    items = items.filter(item => item.platform === filterPlatform.value)
  }

  // 状态筛选
  if (filterStatus.value) {
    items = itemsStore.getItemsByStatus(filterStatus.value)
  }

  // 按更新时间倒序
  return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

onMounted(async () => {
  await itemsStore.init()
  console.log('加载的物品数量:', itemsStore.allItems.length)
  console.log('所有物品:', itemsStore.allItems)

  // 检查提醒
  checkReminders()
})

// 检查倒计时提醒（自动发送邮件）
async function checkReminders() {
  const allItems = itemsStore.allItems
  const urgentItems = getUrgentItems(allItems)
  const expiredItems = getExpiredItems(allItems)

  if (urgentItems.length > 0 || expiredItems.length > 0) {
    // 使用配置的目标邮箱或已保存的邮箱
    const savedEmail = localStorage.getItem('user_email')
    const email = savedEmail || emailJsConfig.targetEmail || '2640622467@qq.com'

    // 自动发送邮件提醒
    const success = await sendEmailReminder(urgentItems, expiredItems, email)

    if (success) {
      // 显示通知告知用户已发送邮件
      const itemCount = urgentItems.length + expiredItems.length
      ElMessage.success(
        `✅ 已自动发送邮件提醒到 ${email}\n` +
        `${urgentItems.length}件即将超期，${expiredItems.length}件已超期`
      )
    }

    // 同时显示简短的通知
    const message = getReminderMessage(urgentItems, expiredItems)
    ElMessageBox.alert(
      message + '\n\n邮件提醒已自动发送到：' + email,
      '⏰ 退货倒计时提醒',
      {
        confirmButtonText: '我知道了',
        type: urgentItems.length > 0 ? 'warning' : 'info',
        customClass: 'reminder-message-box'
      }
    ).catch(() => {})
  }
}

// 发送邮件提醒
function handleSendEmailReminder(urgentItems: Item[], expiredItems: Item[]) {
  // 从 localStorage 获取用户邮箱
  const savedEmail = localStorage.getItem('user_email')
  const email = savedEmail || userEmail.value

  if (!email) {
    ElMessageBox.prompt('请输入您的邮箱地址', '邮件提醒', {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputPattern: /[^@]+@[^@]+\.[^@]+/,
      inputErrorMessage: '请输入正确的邮箱地址'
    }).then(({ value }) => {
      userEmail.value = value
      localStorage.setItem('user_email', value)
      sendEmailReminder(urgentItems, expiredItems, value)
      ElMessage.success('已打开邮件客户端')
    }).catch(() => {
      // 用户取消
    })
  } else {
    sendEmailReminder(urgentItems, expiredItems, email)
    ElMessage.success('已打开邮件客户端')
  }
}

// 手动检查提醒
function manualCheckReminders() {
  const allItems = itemsStore.allItems
  const urgentItems = getUrgentItems(allItems)
  const expiredItems = getExpiredItems(allItems)

  if (urgentItems.length === 0 && expiredItems.length === 0) {
    ElMessage.success('✅ 目前没有需要紧急处理的商品')
    return
  }

  checkReminders()
}

// 测试邮件提醒功能（强制触发）
function testEmailReminder() {
  // 创建一个模拟的紧急商品用于测试
  const testItem: Item = {
    id: 'test-123',
    name: '测试商品-立即处理',
    platform: '淘宝',
    buyPrice: 100,
    buyTime: new Date().toISOString(),
    expectedSellPrice: 150,
    shippingFee: 5,
    received: true,
    receivedTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6天前收货
    sold: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // 使用配置的目标邮箱
  const testEmail = emailJsConfig.targetEmail || '2640622467@qq.com'
  localStorage.setItem('user_email', testEmail) // 保存邮箱

  ElMessageBox.confirm(
    `即将发送测试邮件到：${testEmail}\n\n测试内容：一个即将超期的商品`,
    '📧 测试邮件提醒',
    {
      confirmButtonText: '发送测试邮件',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    ElMessage.info('正在发送测试邮件...')
    const success = await sendEmailReminder([testItem], [], testEmail)
    if (success) {
      ElMessage.success('✅ 测试邮件已发送，请查收 ' + testEmail)
    }
  }).catch(() => {
    // 用户取消
  })
}

// 搜索
function handleSearch() {
  // 由 computed 自动处理
}

// 筛选
function handleFilter() {
  // 由 computed 自动处理
}

// 显示添加弹窗
function showAddDialog() {
  addDialogVisible.value = true
}

// 关闭添加弹窗
function handleCloseAddDialog() {
  addFormRef.value?.reset()
  addDialogVisible.value = false
}

// 确认添加
async function handleConfirmAdd() {
  const success = await addFormRef.value?.submit()
  if (success) {
    addDialogVisible.value = false
    addFormRef.value?.reset()
    ElMessage.success('添加成功')
  }
}

// 添加提交
async function handleAddSubmit(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
  await itemsStore.addItem(data)
}

// 确认收货
async function handleReceive(id: string) {
  await itemsStore.confirmReceive(id)
  ElMessage.success('已确认收货，倒计时开始')
}

// 确认卖出
function handleSell(id: string) {
  sellingItem.value = itemsStore.allItems.find(item => item.id === id)
  if (sellingItem.value) {
    sellForm.value.sellPrice = sellingItem.value.expectedSellPrice || 0
    sellDialogVisible.value = true
  }
}

// 确认卖出操作
async function handleConfirmSell() {
  if (sellForm.value.sellPrice <= 0) {
    ElMessage.warning('请输入卖出价格')
    return
  }

  if (sellingItem.value) {
    await itemsStore.confirmSell(sellingItem.value.id, sellForm.value.sellPrice)
    sellDialogVisible.value = false
    ElMessage.success('已确认卖出')
  }
}

// 编辑
function handleEdit(item: Item) {
  editingItem.value = item
  editDialogVisible.value = true
}

// 关闭编辑弹窗
function handleCloseEditDialog() {
  editFormRef.value?.reset()
  editDialogVisible.value = false
  editingItem.value = undefined
}

// 确认编辑
async function handleConfirmEdit() {
  const success = await editFormRef.value?.submit()
  if (success && editingItem.value) {
    editDialogVisible.value = false
    editFormRef.value?.reset()
    editingItem.value = undefined
    ElMessage.success('更新成功')
  }
}

// 编辑提交
async function handleEditSubmit(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
  if (editingItem.value) {
    await itemsStore.updateItem(editingItem.value.id, data)
  }
}

// 删除
async function handleDelete(id: string) {
  await itemsStore.deleteItem(id)
  ElMessage.success('已删除')
}
</script>

<style scoped lang="scss">
.home-container {
  min-height: 100vh;
  padding: 12px;
  padding-bottom: 40px;
  background-color: #f5f5f5;
}

.stats-section {
  margin-bottom: 12px;
}

.action-card {
  margin-bottom: 12px;

  :deep(.el-card__body) {
    padding: 12px;
  }
}

.reminder-card {
  margin-bottom: 12px;

  :deep(.el-card__body) {
    padding: 8px 12px;
  }
}

.items-list {
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: white;
    border-radius: 8px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .count {
      font-size: 14px;
      color: #909399;
    }
  }

  .el-col {
    margin-bottom: 12px;
  }
}

.profit-estimate {
  .profit-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  .profit-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-radius: 6px;

    .label {
      font-size: 13px;
      color: #606266;
    }

    .value {
      font-size: 14px;
      font-weight: 600;
      color: #303133;

      &.positive {
        color: #67c23a;
      }

      &.negative {
        color: #f56c6c;
      }
    }
  }
}

// 提醒弹窗样式
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
</style>
