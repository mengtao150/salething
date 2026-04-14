<template>
  <el-dialog
    v-model="visible"
    title="AI 提取结果预览"
    width="560px"
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
      <el-button type="primary" @click="handleRetry">重新识别</el-button>
    </div>

    <template v-else>
      <div class="voice-text-panel">
        <div class="panel-header">
          <span>讯飞转写内容</span>
          <el-tag size="small" type="info">已同步输出到控制台</el-tag>
        </div>
        <div class="voice-text-content">{{ props.voiceText || '暂无转写内容' }}</div>
      </div>

      <div v-if="missingFields.length" class="missing-fields">
        <div class="panel-header">
          <span>暂未识别到的字段</span>
        </div>
        <div class="missing-tags">
          <el-tag v-for="field in missingFields" :key="field" type="warning" effect="light">
            {{ field }}
          </el-tag>
        </div>
        <p class="missing-tip">可以先确认已识别内容，缺失字段后续继续语音补充或手动填写。</p>
      </div>

      <el-form ref="formRef" :model="formData" label-width="90px">
        <el-form-item label="商品名称">
          <el-input v-model="formData.name" placeholder="可继续补充商品名称" />
        </el-form-item>

        <el-form-item label="商品类别">
          <el-segmented v-model="formData.category" :options="categoryOptions" class="category-segment" />
        </el-form-item>

        <el-form-item label="尺码">
          <el-select
            v-model="formData.size"
            placeholder="可继续选择或填写尺码"
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
          <el-input v-model="formData.sku" placeholder="可继续补充货号" />
        </el-form-item>

        <el-form-item label="购买平台">
          <el-select v-model="formData.platform" placeholder="可继续选择平台" clearable style="width: 100%">
            <el-option label="拼多多" value="拼多多" />
            <el-option label="淘宝" value="淘宝" />
            <el-option label="抖音" value="抖音" />
            <el-option label="京东" value="京东" />
            <el-option label="唯品会" value="唯品会" />
            <el-option label="快手" value="快手" />
          </el-select>
        </el-form-item>

        <el-form-item label="买入价格">
          <el-input-number
            v-model="formData.buyPrice"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            placeholder="可继续补充买入价格"
          />
        </el-form-item>

        <el-form-item label="收货时间">
          <el-date-picker
            v-model="formData.receivedTime"
            type="datetime"
            placeholder="可继续补充收货时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
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
      </el-form>
    </template>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button v-if="!loading" @click="handleRetry">重新识别</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="loading || !!error">
          确认填充
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { Close, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { extractItemFromVoice } from '@/utils/aiExtractor'
import type { ExtractedItemData } from '@/utils/aiExtractor'
import type { ItemCategory, Platform } from '@/types'

const categoryOptions: ItemCategory[] = ['鞋子', '书包', '衣服', '其他']
const sizeOptionsMap: Record<ItemCategory, string[]> = {
  鞋子: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  书包: ['小号', '中号', '大号', '均码'],
  衣服: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '均码'],
  其他: ['小号', '中号', '大号', '均码']
}

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
const missingFields = ref<string[]>([])

const formRef = ref<FormInstance>()
const formData = reactive({
  name: '',
  category: '其他' as ItemCategory,
  size: '',
  sku: '',
  platform: undefined as Platform | undefined,
  buyPrice: undefined as number | undefined,
  receivedTime: undefined as string | undefined,
  expectedSellPrice: undefined as number | undefined,
  shippingFee: undefined as number | undefined
})

const sizeOptions = computed(() => sizeOptionsMap[formData.category] || sizeOptionsMap.其他)

watch(
  () => props.modelValue,
  value => {
    visible.value = value
    if (value && props.voiceText) {
      processVoiceText(props.voiceText)
    }
  }
)

watch(visible, value => {
  emit('update:modelValue', value)
})

async function processVoiceText(text: string) {
  loading.value = true
  error.value = ''
  missingFields.value = []

  try {
    const result = await extractItemFromVoice(text)

    formData.name = result.name ?? ''
    formData.category = result.category ?? '其他'
    formData.size = result.size ?? ''
    formData.sku = result.sku ?? ''
    formData.platform = result.platform
    formData.buyPrice = result.buyPrice
    formData.receivedTime = result.receivedTime
    formData.expectedSellPrice = result.expectedSellPrice
    formData.shippingFee = result.shippingFee
    missingFields.value = result.missingFields

    ElMessage.success(result.missingFields.length ? '已提取部分信息，请确认后补充缺失字段' : 'AI 提取成功')
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

  emit('confirm', {
    name: formData.name || undefined,
    category: formData.category,
    size: formData.size || undefined,
    sku: formData.sku || undefined,
    platform: formData.platform,
    buyPrice: formData.buyPrice,
    receivedTime: formData.receivedTime,
    expectedSellPrice: formData.expectedSellPrice,
    shippingFee: formData.shippingFee,
    missingFields: missingFields.value
  })
  handleClose()
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

  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}

.error-message {
  color: #f56c6c;
  text-align: center;
}

.voice-text-panel,
.missing-fields {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(245, 248, 255, 0.9);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #42516c;
}

.voice-text-content {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 13px;
  color: #5d6b82;
}

.missing-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.missing-tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: #7d8aa2;
}

.category-segment {
  width: 100%;
}
</style>
