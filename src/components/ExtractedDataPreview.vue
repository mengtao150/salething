<template>
  <el-dialog
    v-model="visible"
    title="AI 提取结果预览"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" :size="40">
        <Loading />
      </el-icon>
      <p>正在提取商品信息...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <el-icon :size="40" color="#f56c6c">
        <Close />
      </el-icon>
      <p class="error-message">{{ error }}</p>
      <el-button @click="handleRetry" type="primary">重新识别</el-button>
    </div>

    <el-form v-else ref="formRef" :model="formData" label-width="90px">
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

      <el-form-item label="预计卖价">
        <el-input-number
          v-model="formData.expectedSellPrice"
          :min="0"
          :precision="2"
          :step="0.01"
          style="width: 100%"
          placeholder="可选"
        />
      </el-form-item>

      <el-form-item label="快递费用">
        <el-input-number
          v-model="formData.shippingFee"
          :min="0"
          :precision="2"
          :step="0.01"
          style="width: 100%"
          placeholder="可选"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="handleRetry" v-if="error || !loading">重新识别</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="loading || !!error">
          确认填充
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { Loading, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { extractItemFromVoice } from '@/utils/aiExtractor'
import type { ExtractedItemData } from '@/utils/aiExtractor'
import type { Platform } from '@/types'

const props = defineProps<{
  modelValue: boolean
  voiceText: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [data: ExtractedItemData]
}>()

const visible = ref(false)
const loading = ref(false)
const error = ref('')

const formRef = ref<FormInstance>()
const formData = reactive({
  name: '',
  platform: '淘宝' as Platform,
  buyPrice: 0,
  expectedSellPrice: undefined as number | undefined,
  shippingFee: undefined as number | undefined
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.voiceText) {
    processVoiceText(props.voiceText)
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

async function processVoiceText(text: string) {
  loading.value = true
  error.value = ''

  try {
    const result = await extractItemFromVoice(text)

    // 填充表单
    formData.name = result.name
    formData.platform = result.platform
    formData.buyPrice = result.buyPrice
    formData.expectedSellPrice = result.expectedSellPrice
    formData.shippingFee = result.shippingFee

    ElMessage.success('AI 提取成功')
  } catch (e: any) {
    error.value = e.message || '提取失败，请重试'
  } finally {
    loading.value = false
  }
}

function handleRetry() {
  if (props.voiceText) {
    processVoiceText(props.voiceText)
  }
}

function handleConfirm() {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (valid) {
      emit('confirm', { ...formData })
      handleClose()
    }
  })
}

function handleClose() {
  visible.value = false
  error.value = ''
}
</script>

<style scoped lang="scss">
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;

  .el-icon {
    color: #409eff;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }

  .error-message {
    color: #f56c6c;
    text-align: center;
  }
}

.error-container {
  .el-icon {
    color: #f56c6c;
  }
}
</style>
