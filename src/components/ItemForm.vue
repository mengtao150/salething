<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="80px"
    label-position="left"
    class="item-form"
  >
    <!-- 语音输入区域 (仅添加模式显示) -->
    <el-form-item v-if="!editMode" class="voice-input-section">
      <div class="voice-input-container">
        <VoiceRecordButton @recording-complete="handleVoiceInput" />
        <el-text size="small" style="margin-left: 12px">
          点击麦克风开始录音，描述商品信息（如："我在淘宝买了iPhone 15 Pro，花了2999元"）
        </el-text>
      </div>
    </el-form-item>

    <el-form-item label="物品名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入物品名称" />
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

    <el-form-item label="收货时间" prop="receivedTime">
      <el-date-picker
        v-model="formData.receivedTime"
        type="datetime"
        placeholder="选择收货时间"
        style="width: 100%"
        format="YYYY-MM-DD HH:mm"
      />
    </el-form-item>

    <el-form-item label="预计卖价" prop="expectedSellPrice">
      <el-input-number
        v-model="formData.expectedSellPrice"
        :min="0"
        :precision="2"
        :step="0.01"
        style="width: 100%"
        placeholder="可选"
      />
    </el-form-item>

    <el-form-item label="快递费用" prop="shippingFee">
      <el-input-number
        v-model="formData.shippingFee"
        :min="0"
        :precision="2"
        :step="0.01"
        style="width: 100%"
        placeholder="可选"
      />
    </el-form-item>

    <!-- 编辑模式额外字段 -->
    <template v-if="editMode">
      <el-divider>卖出信息</el-divider>

      <el-form-item label="已卖出">
        <el-switch v-model="formData.sold" />
      </el-form-item>

      <el-form-item v-if="formData.sold" label="实际卖价" prop="actualSellPrice">
        <el-input-number
          v-model="formData.actualSellPrice"
          :min="0"
          :precision="2"
          :step="0.01"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item v-if="formData.sold" label="卖出时间">
        <el-date-picker
          v-model="formData.sellTime"
          type="datetime"
          placeholder="卖出时间"
          style="width: 100%"
          format="YYYY-MM-DD HH:mm"
        />
      </el-form-item>
    </template>
  </el-form>

  <!-- AI 提取结果预览对话框 -->
  <ExtractedDataPreview
    v-model="showPreviewDialog"
    :voice-text="currentVoiceText"
    @confirm="handleExtractedDataConfirm"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Item, Platform } from '@/types'
import VoiceRecordButton from '@/components/VoiceRecordButton.vue'
import ExtractedDataPreview from '@/components/ExtractedDataPreview.vue'
import type { ExtractedItemData } from '@/utils/aiExtractor'

const props = defineProps<{
  item?: Item
}>()

const emit = defineEmits<{
  submit: [data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>]
}>()

const formRef = ref<FormInstance>()
const editMode = computed(() => !!props.item)

// 语音输入相关状态
const showPreviewDialog = ref(false)
const currentVoiceText = ref('')

const formData = reactive({
  name: props.item?.name || '',
  platform: (props.item?.platform || '淘宝') as Platform,
  buyPrice: props.item?.buyPrice || 0,
  buyTime: props.item?.buyTime || new Date().toISOString(),
  expectedSellPrice: props.item?.expectedSellPrice,
  shippingFee: props.item?.shippingFee,
  received: props.item?.receivedTime ? true : false,
  receivedTime: props.item?.receivedTime ? new Date(props.item.receivedTime) : undefined,
  sold: props.item?.sold || false,
  actualSellPrice: props.item?.actualSellPrice,
  sellTime: props.item?.sellTime ? new Date(props.item.sellTime) : undefined
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入物品名称', trigger: 'blur' }
  ],
  platform: [
    { required: true, message: '请选择购买平台', trigger: 'change' }
  ],
  buyPrice: [
    { required: true, message: '请输入买入价格', trigger: 'blur' }
  ],
  receivedTime: [
    { required: true, message: '请选择收货时间', trigger: 'change' }
  ]
}

// 处理语音输入完成
function handleVoiceInput(text: string) {
  currentVoiceText.value = text
  showPreviewDialog.value = true
}

// 处理 AI 提取数据确认
function handleExtractedDataConfirm(data: ExtractedItemData) {
  // 填充表单数据
  formData.name = data.name
  formData.platform = data.platform
  formData.buyPrice = data.buyPrice
  formData.expectedSellPrice = data.expectedSellPrice
  formData.shippingFee = data.shippingFee
}

async function submit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const submitData = {
      name: formData.name,
      platform: formData.platform,
      buyPrice: formData.buyPrice,
      buyTime: new Date().toISOString(),
      expectedSellPrice: formData.expectedSellPrice,
      shippingFee: formData.shippingFee,
      received: !!formData.receivedTime,
      receivedTime: formData.receivedTime ? new Date(formData.receivedTime as Date).toISOString() : undefined,
      sold: formData.sold,
      actualSellPrice: formData.actualSellPrice,
      sellTime: formData.sellTime ? new Date(formData.sellTime as Date).toISOString() : undefined
    }

    emit('submit', submitData)
    return true
  } catch {
    return false
  }
}

function reset() {
  formRef.value?.resetFields()
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
  border-radius: 8px;
  border: 1px solid #d9d9d9;
}

@media (max-width: 768px) {
  .item-form {
    :deep(.el-form-item__label) {
      width: 70px !important;
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
