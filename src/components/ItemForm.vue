<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="88px"
    label-position="left"
    class="item-form"
  >
    <el-form-item v-if="!editMode" class="voice-input-section">
      <div class="voice-input-container">
        <VoiceRecordButton @recording-complete="handleVoiceInput" />
        <el-text size="small" style="margin-left: 12px">
          点击麦克风开始录音，描述商品信息，例如：我在淘宝买了一双运动鞋，42 码，货号 NK-001，花了 499 元，昨天收货，预计卖 699 元，快递费 8 元。
        </el-text>
      </div>

      <div v-if="currentVoiceText" class="voice-result-panel">
        <div class="voice-result-header">
          <span>语音转写结果</span>
          <el-tag size="small" type="success">已识别</el-tag>
        </div>
        <div class="voice-result-content">{{ currentVoiceText }}</div>
      </div>
    </el-form-item>

    <el-form-item label="商品名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入商品名称" />
    </el-form-item>

    <el-form-item label="商品类别" prop="category">
      <el-segmented v-model="formData.category" :options="categoryOptions" class="category-segment" />
    </el-form-item>

    <el-form-item label="商品状态" prop="status">
      <el-select v-model="formData.status" placeholder="请选择商品状态" style="width: 100%">
        <el-option v-for="option in statusOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </el-form-item>

    <el-form-item label="尺码">
      <el-select
        v-model="formData.size"
        placeholder="请选择尺码"
        clearable
        filterable
        allow-create
        default-first-option
        style="width: 100%"
      >
        <el-option v-for="size in sizeOptions" :key="size" :label="size" :value="size" />
      </el-select>
    </el-form-item>

    <el-form-item label="货号">
      <el-input v-model="formData.sku" placeholder="请输入货号" />
    </el-form-item>

    <el-form-item label="购买平台" prop="platform">
      <el-select v-model="formData.platform" placeholder="请选择平台" style="width: 100%">
        <el-option label="拼多多" value="拼多多" />
        <el-option label="淘宝" value="淘宝" />
        <el-option label="抖音" value="抖音" />
        <el-option label="京东" value="京东" />
        <el-option label="唯品会" value="唯品会" />
        <el-option label="快手" value="快手" />
      </el-select>
    </el-form-item>

    <el-form-item label="买入价格" prop="buyPrice">
      <el-input-number
        v-model="formData.buyPrice"
        :min="0"
        :precision="2"
        :step="0.01"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="入仓时间" prop="receivedTime">
      <el-date-picker
        v-model="formData.receivedTime"
        type="datetime"
        placeholder="选择入仓时间"
        style="width: 100%"
        format="YYYY-MM-DD HH:mm"
        :teleported="false"
        popper-class="mobile-date-popper"
      />
    </el-form-item>

    <el-form-item label="预计售价" prop="expectedSellPrice">
      <el-input-number
        v-model="formData.expectedSellPrice"
        :min="0"
        :precision="2"
        :step="0.01"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="快递费用">
      <el-input-number
        v-model="formData.shippingFee"
        :min="0"
        :precision="2"
        :step="0.01"
        style="width: 100%"
      />
    </el-form-item>

    <template v-if="showSaleFields">
      <el-divider>成交信息</el-divider>

      <el-form-item label="实际售价" prop="actualSellPrice">
        <el-input-number
          v-model="formData.actualSellPrice"
          :min="0"
          :precision="2"
          :step="0.01"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="formData.status === 'completed' ? '成功时间' : '售出时间'" prop="sellTime">
        <el-date-picker
          v-model="formData.sellTime"
          type="datetime"
          :placeholder="formData.status === 'completed' ? '选择交易成功时间' : '选择售出时间'"
          style="width: 100%"
          format="YYYY-MM-DD HH:mm"
          :teleported="false"
          popper-class="mobile-date-popper"
        />
      </el-form-item>
    </template>
  </el-form>

  <ExtractedDataPreview
    v-model="showPreviewDialog"
    :voice-text="currentVoiceText"
    @confirm="handleExtractedDataConfirm"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Item, ItemCategory, ItemStatus, Platform } from '@/types'
import ExtractedDataPreview from '@/components/ExtractedDataPreview.vue'
import VoiceRecordButton from '@/components/VoiceRecordButton.vue'
import type { ExtractedItemData } from '@/utils/aiExtractor'
import { deriveLegacyFlags, ITEM_STATUS_OPTIONS, normalizeItemStatus, shouldShowSaleFields } from '@/utils/itemStatus'

const categoryOptions: ItemCategory[] = ['鞋子', '书包', '衣服', '其他']
const sizeOptionsMap: Record<ItemCategory, string[]> = {
  鞋子: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  书包: ['小号', '中号', '大号', '均码'],
  衣服: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '均码'],
  其他: ['小号', '中号', '大号', '均码']
}

const props = defineProps<{
  item?: Item
}>()

const emit = defineEmits<{
  submit: [data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>]
}>()

const formRef = ref<FormInstance>()
const editMode = computed(() => !!props.item)
const showPreviewDialog = ref(false)
const currentVoiceText = ref('')
const statusOptions = ITEM_STATUS_OPTIONS

const formData = reactive({
  name: '',
  category: '其他' as ItemCategory,
  size: '',
  sku: '',
  platform: '淘宝' as Platform,
  buyPrice: 0,
  buyTime: new Date().toISOString(),
  expectedSellPrice: undefined as number | undefined,
  shippingFee: undefined as number | undefined,
  status: 'received' as ItemStatus,
  receivedTime: undefined as Date | undefined,
  actualSellPrice: undefined as number | undefined,
  sellTime: undefined as Date | undefined
})

const sizeOptions = computed(() => sizeOptionsMap[formData.category] || sizeOptionsMap.其他)
const showSaleFields = computed(() => shouldShowSaleFields(formData.status))

watch(
  () => formData.category,
  nextCategory => {
    if (!formData.size) {
      return
    }

    const options = sizeOptionsMap[nextCategory] || []
    if (options.length && !options.includes(formData.size)) {
      formData.size = ''
    }
  }
)

watch(
  () => formData.status,
  status => {
    if (!showSaleFields.value) {
      formData.actualSellPrice = undefined
      formData.sellTime = undefined
    }

    if (status === 'pending') {
      formData.receivedTime = undefined
    }
  }
)

const rules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择商品类别', trigger: 'change' }],
  status: [{ required: true, message: '请选择商品状态', trigger: 'change' }],
  platform: [{ required: true, message: '请选择购买平台', trigger: 'change' }],
  buyPrice: [{ required: true, message: '请输入买入价格', trigger: 'blur' }],
  receivedTime: [
    {
      validator: (_rule, value, callback) => {
        if (formData.status !== 'pending' && !value) {
          callback(new Error('请选择入仓时间'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  actualSellPrice: [
    {
      validator: (_rule, value, callback) => {
        if (showSaleFields.value && (value === undefined || value === null || value <= 0)) {
          callback(new Error('请输入实际售价'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  sellTime: [
    {
      validator: (_rule, value, callback) => {
        if (showSaleFields.value && !value) {
          callback(new Error('请选择成交时间'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

function syncFormData(item?: Item) {
  const status = normalizeItemStatus(item?.status, item?.received, item?.sold)

  formData.name = item?.name || ''
  formData.category = (item?.category || '其他') as ItemCategory
  formData.size = item?.size || ''
  formData.sku = item?.sku || ''
  formData.platform = (item?.platform || '淘宝') as Platform
  formData.buyPrice = item?.buyPrice || 0
  formData.buyTime = item?.buyTime || new Date().toISOString()
  formData.expectedSellPrice = item?.expectedSellPrice
  formData.shippingFee = item?.shippingFee
  formData.status = item ? status : 'received'
  formData.receivedTime = item?.receivedTime ? new Date(item.receivedTime) : undefined
  formData.actualSellPrice = item?.actualSellPrice
  formData.sellTime = item?.sellTime ? new Date(item.sellTime) : undefined
}

watch(
  () => props.item,
  item => {
    syncFormData(item)
    currentVoiceText.value = ''
    showPreviewDialog.value = false
    formRef.value?.clearValidate()
  },
  { immediate: true }
)

function handleVoiceInput(text: string) {
  currentVoiceText.value = text
  showPreviewDialog.value = true
}

function handleExtractedDataConfirm(data: ExtractedItemData) {
  if (data.name) {
    formData.name = data.name
  }

  if (data.category) {
    formData.category = data.category
  }

  if (data.size) {
    formData.size = data.size
  }

  if (data.sku) {
    formData.sku = data.sku
  }

  if (data.platform) {
    formData.platform = data.platform
  }

  if (data.buyPrice !== undefined) {
    formData.buyPrice = data.buyPrice
  }

  if (data.receivedTime) {
    formData.receivedTime = new Date(data.receivedTime)
    if (formData.status === 'pending') {
      formData.status = 'received'
    }
  }

  if (data.expectedSellPrice !== undefined) {
    formData.expectedSellPrice = data.expectedSellPrice
  }

  if (data.shippingFee !== undefined) {
    formData.shippingFee = data.shippingFee
  }
}

async function submit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const status = normalizeItemStatus(formData.status)
    const legacyFlags = deriveLegacyFlags(status)

    emit('submit', {
      name: formData.name,
      category: formData.category,
      size: formData.size || undefined,
      sku: formData.sku || undefined,
      platform: formData.platform,
      buyPrice: formData.buyPrice,
      buyTime: formData.buyTime,
      expectedSellPrice: formData.expectedSellPrice,
      shippingFee: formData.shippingFee,
      status,
      received: legacyFlags.received,
      receivedTime: legacyFlags.received && formData.receivedTime ? new Date(formData.receivedTime).toISOString() : undefined,
      sold: legacyFlags.sold,
      actualSellPrice: showSaleFields.value ? formData.actualSellPrice : undefined,
      sellTime: showSaleFields.value && formData.sellTime ? new Date(formData.sellTime).toISOString() : undefined
    })

    return true
  } catch {
    return false
  }
}

function reset() {
  syncFormData(props.item)
  currentVoiceText.value = ''
  showPreviewDialog.value = false
  formRef.value?.clearValidate()
}

defineExpose({
  submit,
  reset
})
</script>

<style scoped lang="scss">
.item-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
  }
}

.category-segment {
  width: 100%;
}

.voice-input-section {
  :deep(.el-form-item__content) {
    display: block;
  }
}

.voice-input-container {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf3 100%);
  border-radius: 16px;
  border: 1px solid #d9d9d9;
}

.voice-result-panel {
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(245, 248, 255, 0.9);
}

.voice-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #42516c;
}

.voice-result-content {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 13px;
  color: #5d6b82;
}

@media (max-width: 768px) {
  .item-form {
    :deep(.el-form-item__label) {
      width: 76px !important;
    }
  }

  .voice-input-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    .el-text {
      margin-left: 0 !important;
    }
  }
}
</style>
