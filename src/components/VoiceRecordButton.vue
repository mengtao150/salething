<template>
  <div class="voice-record-button-container">
    <el-tooltip :content="tooltipContent" placement="top">
      <el-button
        :class="['voice-record-button', recordingStateClass]"
        :disabled="disabled || !isSupported"
        @click="handleClick"
        circle
        size="large"
      >
        <el-icon v-if="state === 'idle'" :size="24">
          <Microphone />
        </el-icon>
        <el-icon v-else-if="state === 'recording'" :size="24" class="recording-icon">
          <Microphone />
        </el-icon>
        <el-icon v-else-if="state === 'processing'" :size="24">
          <Loading />
        </el-icon>
        <el-icon v-else-if="state === 'success'" :size="24">
          <Check />
        </el-icon>
        <el-icon v-else-if="state === 'error'" :size="24">
          <Close />
        </el-icon>
      </el-button>
    </el-tooltip>

    <!-- 录音波形动画 -->
    <div v-if="state === 'recording'" class="recording-wave">
      <span class="wave"></span>
      <span class="wave"></span>
      <span class="wave"></span>
    </div>

    <!-- 状态文本 -->
    <div v-if="statusText" class="status-text">{{ statusText }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Microphone, Loading, Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { startSpeechRecognition, checkSpeechSupport, requestMicrophonePermission } from '@/utils/speechRecognition'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  recordingComplete: [text: string]
}>()

type RecordingState = 'idle' | 'recording' | 'processing' | 'success' | 'error'

const state = ref<RecordingState>('idle')
const isSupported = ref(false)
const stopRecording = ref<(() => void) | null>(null)

// 检查浏览器支持
onMounted(() => {
  isSupported.value = checkSpeechSupport()
  if (!isSupported.value) {
    state.value = 'error'
  }
})

const recordingStateClass = computed(() => {
  return `state-${state.value}`
})

const tooltipContent = computed(() => {
  if (!isSupported.value) return '您的浏览器不支持语音识别'
  if (props.disabled) return '请先配置 API'
  switch (state.value) {
    case 'idle': return '点击开始录音'
    case 'recording': return '点击停止录音'
    case 'processing': return '正在识别...'
    case 'success': return '识别成功'
    case 'error': return '识别失败，点击重试'
  }
})

const statusText = computed(() => {
  switch (state.value) {
    case 'idle': return ''
    case 'recording': return '正在录音...'
    case 'processing': return '正在识别...'
    case 'success': return '识别完成'
    case 'error': return '识别失败'
  }
})

async function handleClick() {
  if (state.value === 'recording') {
    // 停止录音
    stopRecordingFn()
  } else if (state.value === 'idle' || state.value === 'error') {
    // 开始录音
    await startRecordingFn()
  }
}

async function startRecordingFn() {
  // 请求麦克风权限
  const hasPermission = await requestMicrophonePermission()
  if (!hasPermission) {
    ElMessage.error('无法访问麦克风，请检查权限设置')
    return
  }

  state.value = 'recording'

  // 开始语音识别
  const stopFn = startSpeechRecognition({
    onResult: (text) => {
      state.value = 'processing'
      emit('recordingComplete', text)

      // 延迟显示成功状态
      setTimeout(() => {
        state.value = 'success'
        // 2秒后重置状态
        setTimeout(() => {
          state.value = 'idle'
        }, 2000)
      }, 500)
    },
    onError: (error) => {
      state.value = 'error'
      // 3秒后重置状态
      setTimeout(() => {
        state.value = 'idle'
      }, 3000)
    },
    onEnd: () => {
      // 录音结束，如果还在 recording 状态说明没有获取到结果
      if (state.value === 'recording') {
        state.value = 'error'
        setTimeout(() => {
          state.value = 'idle'
        }, 2000)
      }
    }
  })

  if (stopFn) {
    stopRecording.value = stopFn
  }
}

function stopRecordingFn() {
  if (stopRecording.value) {
    stopRecording.value()
    stopRecording.value = null
  }
}
</script>

<style scoped lang="scss">
.voice-record-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
}

.voice-record-button {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
  }

  &:disabled {
    background: #c0c4cc;
    cursor: not-allowed;
    box-shadow: none;
  }

  &.state-recording {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    animation: pulse 1.5s ease-in-out infinite;

    .recording-icon {
      animation: bounce 0.6s ease-in-out infinite;
    }
  }

  &.state-processing {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    cursor: wait;
  }

  &.state-success {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  &.state-error {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
  }
  50% {
    box-shadow: 0 4px 24px rgba(245, 87, 108, 0.8);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.recording-wave {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 20px;

  .wave {
    width: 3px;
    height: 100%;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border-radius: 3px;
    animation: wave 1s ease-in-out infinite;

    &:nth-child(1) {
      animation-delay: 0s;
    }

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes wave {
  0%, 100% {
    height: 8px;
  }
  50% {
    height: 20px;
  }
}

.status-text {
  font-size: 12px;
  color: #606266;
  min-height: 16px;
}
</style>
