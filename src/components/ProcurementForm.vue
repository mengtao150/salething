<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="92px"
    label-position="left"
    class="procurement-form"
  >
    <el-form-item label="商品名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入商品名称" />
    </el-form-item>

    <el-form-item label="商品类别" prop="category">
      <el-segmented v-model="formData.category" :options="categoryOptions" class="category-segment" />
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
      <el-input-number v-model="formData.buyPrice" :min="0" :precision="2" :step="0.01" style="width: 100%" />
    </el-form-item>

    <div class="form-tip">
      邮费、目标卖价和得物入仓时间会在后续“转为得物入仓 / 转为得物售出”时再补充。
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Item, ItemCategory, Platform } from '@/types'

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
const formData = reactive({
  name: '',
  category: '其他' as ItemCategory,
  size: '',
  sku: '',
  platform: '淘宝' as Platform,
  buyPrice: 0,
  buyTime: '',
  expectedSellPrice: undefined as number | undefined,
  shippingFee: undefined as number | undefined
})

const sizeOptions = computed(() => sizeOptionsMap[formData.category] || sizeOptionsMap.其他)

watch(
  () => formData.category,
  nextCategory => {
    if (!formData.size) return
    const options = sizeOptionsMap[nextCategory] || []
    if (options.length && !options.includes(formData.size)) {
      formData.size = ''
    }
  }
)

const rules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择商品类别', trigger: 'change' }],
  platform: [{ required: true, message: '请选择购买平台', trigger: 'change' }],
  buyPrice: [{ required: true, message: '请输入买入价格', trigger: 'blur' }]
}

function syncFormData(item?: Item) {
  formData.name = item?.name || ''
  formData.category = item?.category || '其他'
  formData.size = item?.size || ''
  formData.sku = item?.sku || ''
  formData.platform = item?.platform || '淘宝'
  formData.buyPrice = item?.buyPrice || 0
  formData.buyTime = item?.buyTime || ''
  formData.expectedSellPrice = item?.expectedSellPrice
  formData.shippingFee = item?.shippingFee
}

watch(
  () => props.item,
  item => {
    syncFormData(item)
    formRef.value?.clearValidate()
  },
  { immediate: true }
)

async function submit() {
  if (!formRef.value) return false

  try {
    await formRef.value.validate()

    emit('submit', {
      name: formData.name,
      category: formData.category,
      size: formData.size || undefined,
      sku: formData.sku || undefined,
      platform: formData.platform,
      buyPrice: formData.buyPrice,
      buyTime: formData.buyTime || new Date().toISOString(),
      expectedSellPrice: formData.expectedSellPrice,
      shippingFee: formData.shippingFee,
      recordStage: 'procurement',
      status: 'pending',
      received: false,
      receivedTime: undefined,
      sold: false,
      actualSellPrice: undefined,
      sellTime: undefined
    })

    return true
  } catch {
    return false
  }
}

function reset() {
  syncFormData(props.item)
  formRef.value?.clearValidate()
}

defineExpose({
  submit,
  reset
})
</script>

<style scoped lang="scss">
.procurement-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
  }
}

.category-segment {
  width: 100%;
}

.form-tip {
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: 18px;
  font-size: 13px;
  line-height: 1.6;
  color: #66758f;
  background: rgba(245, 248, 255, 0.92);
}

@media (max-width: 768px) {
  .procurement-form {
    :deep(.el-form-item__label) {
      width: 82px !important;
    }
  }
}
</style>
