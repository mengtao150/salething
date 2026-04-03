// 科大讯飞 WebSocket 实时语音转写工具
// 文档: https://www.xfyun.cn/doc/spark/asr_llm/rtasr_llm.html

import { ElMessage } from 'element-plus'
import { iflytekConfig } from '@/config/iflytek'
import { buildWebSocketUrl } from './iflytekSignature'

export interface SpeechRecognitionOptions {
  onResult: (text: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

export interface SpeechRecognitionStatus {
  isSupported: boolean
  isRecording: boolean
}

/**
 * 检查是否支持科大讯飞语音识别
 */
export function checkSpeechSupport(): boolean {
  return !!(iflytekConfig.appId && iflytekConfig.apiKey && iflytekConfig.apiSecret)
}

/**
 * 开始科大讯飞语音识别
 */
export async function startSpeechRecognition(options: SpeechRecognitionOptions): Promise<(() => void) | null> {
  if (!checkSpeechSupport()) {
    const errorMsg = '请先配置科大讯飞 API 密钥'
    ElMessage.error(errorMsg)
    options.onError?.(errorMsg)
    return null
  }

  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)

    // 生成 WebSocket URL
    const wsUrl = await buildWebSocketUrl(iflytekConfig)

    // 建立 WebSocket 连接
    const ws = new WebSocket(wsUrl)
    let sessionId = ''
    let finalTranscript = ''
    let isConnected = false

    ws.onopen = () => {
      console.log('WebSocket 连接成功')
    }

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data)
        console.log('收到讯飞响应:', response)

        const { action, code, data, desc, sid } = response

        // 保存会话 ID
        if (sid) sessionId = sid

        if (action === 'started') {
          // 握手成功
          if (code === '0') {
            isConnected = true
            console.log('握手成功，会话 ID:', sid)
          } else {
            const errorMsg = desc || '握手失败'
            options.onError?.(errorMsg)
            ElMessage.error(errorMsg)
          }
        } else if (action === 'result') {
          // 识别结果
          if (code === '0' && data) {
            const resultData = JSON.parse(data)

            // 提取识别文本: data.cn.st.rt.ws[0].cw[0].w
            try {
              const cn = resultData.cn
              if (cn && cn.st && cn.st.rt && cn.st.rt.ws) {
                const ws = cn.st.rt.ws
                let segmentText = ''

                for (const w of ws) {
                  if (w.cw && w.cw.length > 0) {
                    for (const cw of w.cw) {
                      if (cw.w) {
                        segmentText += cw.w
                      }
                    }
                  }
                }

                if (segmentText) {
                  finalTranscript += segmentText

                  // 检查是否为最终结果 (ls = true)
                  const isFinal = cn.st.ls === true

                  if (isFinal) {
                    // 最终结果，触发回调
                    options.onResult(finalTranscript)
                  }
                }
              }
            } catch (parseError) {
              console.error('解析识别文本失败:', parseError)
            }
          } else if (code !== '0') {
            const errorMsg = desc || '识别失败'
            console.error('识别错误:', code, errorMsg)
          }
        } else if (action === 'error') {
          // 错误响应
          const errorMsg = desc || `错误代码: ${code}`
          console.error('讯飞错误:', code, errorMsg)
          options.onError?.(errorMsg)
          ElMessage.error(errorMsg)
        }
      } catch (error) {
        console.error('解析讯飞响应失败:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      const errorMsg = 'WebSocket 连接错误'
      options.onError?.(errorMsg)
      ElMessage.error(errorMsg)
    }

    ws.onclose = () => {
      console.log('WebSocket 连接关闭')
      options.onEnd?.()

      // 清理音频资源
      processor.disconnect()
      source.disconnect()
      audioContext.close()
      stream.getTracks().forEach(track => track.stop())
    }

    // 音频处理：每 40ms 发送 1280 字节
    let audioBuffer = new Uint8Array(0)
    const CHUNK_SIZE = 1280 // 每 40ms 发送 1280 字节 (16kHz * 2 bytes * 0.04s = 1280)
    let lastSendTime = 0
    const SEND_INTERVAL = 40 // 40ms 发送间隔

    processor.onaudioprocess = (e) => {
      if (!isConnected) return

      const inputData = e.inputBuffer.getChannelData(0)
      const now = Date.now()

      // 检查发送速率
      if (now - lastSendTime < SEND_INTERVAL) {
        return
      }

      // 将 Float32Array 转换为 Int16Array (PCM 16-bit)
      const pcmData = new Int16Array(inputData.length)
      for (let i = 0; i < inputData.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputData[i]))
        pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      }

      // 转换为 Uint8Array
      const uint8Data = new Uint8Array(pcmData.buffer)

      // 追加到缓冲区
      const newBuffer = new Uint8Array(audioBuffer.length + uint8Data.length)
      newBuffer.set(audioBuffer)
      newBuffer.set(uint8Data, audioBuffer.length)
      audioBuffer = newBuffer

      // 按 CHUNK_SIZE 发送数据
      while (audioBuffer.length >= CHUNK_SIZE && ws.readyState === WebSocket.OPEN) {
        const chunk = audioBuffer.slice(0, CHUNK_SIZE)
        ws.send(chunk)
        audioBuffer = audioBuffer.slice(CHUNK_SIZE)
        lastSendTime = Date.now()

        // 每次只发送一个 chunk，避免过快
        break
      }
    }

    // 连接音频处理节点
    source.connect(processor)
    processor.connect(audioContext.destination)

    // 返回停止函数
    return () => {
      // 发送结束标识
      if (ws.readyState === WebSocket.OPEN) {
        const endMessage = JSON.stringify({
          end: true,
          sid: sessionId
        })
        ws.send(endMessage)
      }

      // 延迟关闭连接，等待最终结果
      setTimeout(() => {
        ws.close()
      }, 500)
    }
  } catch (error: any) {
    console.error('启动语音识别失败:', error)
    let errorMsg = '启动语音识别失败'

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMsg = '无法访问麦克风，请检查权限设置'
    } else if (error.name === 'NotFoundError') {
      errorMsg = '未找到麦克风设备'
    } else if (error.message) {
      errorMsg = error.message
    }

    ElMessage.error(errorMsg)
    options.onError?.(errorMsg)
    return null
  }
}

/**
 * 获取麦克风权限
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('获取麦克风权限失败:', error)
    return false
  }
}
