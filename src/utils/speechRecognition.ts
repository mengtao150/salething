// Web Speech API 语音识别工具
import { ElMessage } from 'element-plus'

export interface SpeechRecognitionOptions {
  onResult: (text: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

export interface SpeechRecognitionStatus {
  isSupported: boolean
  isRecording: boolean
}

// 检查浏览器是否支持语音识别
export function checkSpeechSupport(): boolean {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  return !!SpeechRecognition
}

// 开始语音识别
export function startSpeechRecognition(options: SpeechRecognitionOptions): (() => void) | null {
  if (!checkSpeechSupport()) {
    const errorMsg = '您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器'
    ElMessage.error(errorMsg)
    options.onError?.(errorMsg)
    return null
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const recognition = new SpeechRecognition()

  // 配置识别参数
  recognition.lang = 'zh-CN' // 中文
  recognition.continuous = false // 连续识别
  recognition.interimResults = false // 是否返回临时结果

  let finalTranscript = ''

  recognition.onresult = (event: any) => {
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript = transcript
      } else {
        interimTranscript += transcript
      }
    }

    // 返回最终结果
    if (finalTranscript) {
      options.onResult(finalTranscript)
    }
  }

  recognition.onerror = (event: any) => {
    let errorMsg = '语音识别出错'

    switch (event.error) {
      case 'no-speech':
        errorMsg = '没有检测到语音，请重试'
        break
      case 'audio-capture':
        errorMsg = '无法访问麦克风，请检查权限设置'
        break
      case 'not-allowed':
        errorMsg = '麦克风权限被拒绝，请在浏览器设置中允许'
        break
      case 'network':
        errorMsg = '网络错误，请检查网络连接'
        break
      default:
        errorMsg = `语音识别错误: ${event.error}`
    }

    ElMessage.error(errorMsg)
    options.onError?.(errorMsg)
  }

  recognition.onend = () => {
    options.onEnd?.()
  }

  // 开始识别
  recognition.start()

  // 返回停止函数
  return () => {
    recognition.stop()
  }
}

// 获取麦克风权限
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    // 尝试获取麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // 立即停止流（只是为了获取权限）
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('获取麦克风权限失败:', error)
    return false
  }
}
