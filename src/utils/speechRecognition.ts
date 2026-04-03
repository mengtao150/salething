// 科大讯飞中英识别大模型 WebSocket 实时语音转写工具
// 文档: https://www.xfyun.cn/doc/spark/spark_zh_iat.html

import { ElMessage } from 'element-plus'
import { iflytekConfig } from '@/config/iflytek'
import { buildSparkWebSocketUrl } from './iflytekSignature'

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
    const wsUrl = await buildSparkWebSocketUrl(iflytekConfig)
    console.log('=== 讯飞语音识别调试信息 ===')
    console.log('WebSocket URL:', wsUrl.substring(0, 100) + '...')
    console.log('AppID:', iflytekConfig.appId)
    console.log('APIKey:', iflytekConfig.apiKey?.substring(0, 10) + '...')
    console.log('==========================')

    // 建立 WebSocket 连接
    const ws = new WebSocket(wsUrl)
    let sessionId = ''
    let finalTranscript = ''
    let isConnected = false
    let seq = 0 // 数据序号
    let audioBuffer = new Float32Array(0)
    let recordingStartTime = Date.now()

    ws.onopen = () => {
      console.log('WebSocket 连接成功')
      // 发送第一帧数据（握手 + 参数配置）
      sendFirstFrame()
    }

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data)
        console.log('收到讯飞响应:', response)

        const { header, payload } = response

        // 保存会话 ID
        if (header?.sid) sessionId = header.sid

        // 检查响应码
        if (header?.code !== 0) {
          const errorMsg = header?.message || `错误代码: ${header?.code}`
          console.error('讯飞错误:', header?.code, errorMsg)
          options.onError?.(errorMsg)
          ElMessage.error(errorMsg)
          return
        }

        // 解析识别结果
        if (payload?.result?.text) {
          // text 字段是 base64 编码的 JSON
          const decodedText = atob(payload.result.text)
          const resultData = JSON.parse(decodedText)

          // 提取识别文本: result.ws[i].cw[j].w
          let segmentText = ''
          if (resultData.ws && Array.isArray(resultData.ws)) {
            for (const ws of resultData.ws) {
              if (ws.cw && Array.isArray(ws.cw)) {
                for (const cw of ws.cw) {
                  if (cw.w) {
                    segmentText += cw.w
                  }
                }
              }
            }
          }

          if (segmentText) {
            finalTranscript += segmentText

            // 检查是否为最终结果 (ls = true)
            const isFinal = resultData.ls === true

            if (isFinal) {
              // 最终结果，触发回调
              options.onResult(finalTranscript)
            }
          }
        }

        // 检查是否结束
        if (header?.status === 2) {
          console.log('识别结束')
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

    /**
     * 发送第一帧数据（握手 + 参数配置）
     */
    function sendFirstFrame() {
      const firstFrame = {
        header: {
          app_id: iflytekConfig.appId,
          status: 0 // 0: 第一帧
        },
        parameter: {
          iat: {
            domain: 'slm',
            language: 'zh_cn',
            accent: 'mandarin',
            result: {
              encoding: 'utf8',
              compress: 'raw',
              format: 'json'
            }
          }
        },
        payload: {
          audio: {
            encoding: 'raw',
            sample_rate: 16000,
            channels: 1,
            bit_depth: 16,
            seq: 0,
            status: 0,
            audio: '' // 第一帧音频可以为空
          }
        }
      }

      ws.send(JSON.stringify(firstFrame))
      isConnected = true
      console.log('发送第一帧数据')
    }

    /**
     * 发送中间帧数据（音频数据）
     */
    function sendMiddleFrame(audioBase64: string) {
      const middleFrame = {
        header: {
          app_id: iflytekConfig.appId,
          status: 1, // 1: 中间帧
          sid: sessionId
        },
        parameter: {},
        payload: {
          audio: {
            encoding: 'raw',
            sample_rate: 16000,
            channels: 1,
            bit_depth: 16,
            seq: seq++,
            status: 1,
            audio: audioBase64
          }
        }
      }

      ws.send(JSON.stringify(middleFrame))
    }

    /**
     * 发送最后一帧数据（结束标识）
     */
    function sendLastFrame() {
      const lastFrame = {
        header: {
          app_id: iflytekConfig.appId,
          status: 2, // 2: 最后一帧
          sid: sessionId
        },
        parameter: {},
        payload: {
          audio: {
            encoding: 'raw',
            sample_rate: 16000,
            channels: 1,
            bit_depth: 16,
            seq: seq++,
            status: 2,
            audio: ''
          }
        }
      }

      ws.send(JSON.stringify(lastFrame))
      console.log('发送最后一帧数据')
    }

    // 音频处理：每 40ms 发送一次数据
    const CHUNK_SIZE = 1280 // 每 40ms 发送 1280 字节 (16kHz * 2 bytes * 0.04s = 1280)
    const SEND_INTERVAL = 40 // 40ms 发送间隔
    let lastSendTime = 0

    processor.onaudioprocess = (e) => {
      if (!isConnected) return

      const inputData = e.inputBuffer.getChannelData(0)
      const now = Date.now()

      // 检查发送速率
      if (now - lastSendTime < SEND_INTERVAL) {
        return
      }

      // 检查录制时长（最多 60 秒）
      if (now - recordingStartTime > 60000) {
        console.log('达到最大录制时长 60 秒')
        return
      }

      // 追加到缓冲区
      const newBuffer = new Float32Array(audioBuffer.length + inputData.length)
      newBuffer.set(audioBuffer)
      newBuffer.set(inputData, audioBuffer.length)
      audioBuffer = newBuffer

      // 按 CHUNK_SIZE 发送数据
      while (audioBuffer.length >= CHUNK_SIZE && ws.readyState === WebSocket.OPEN) {
        const chunk = audioBuffer.slice(0, CHUNK_SIZE)

        // 转换为 Int16Array
        const int16Data = new Int16Array(CHUNK_SIZE)
        for (let i = 0; i < CHUNK_SIZE; i++) {
          const sample = Math.max(-1, Math.min(1, chunk[i]))
          int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        }

        // 转换为 Uint8Array
        const uint8Data = new Uint8Array(int16Data.buffer)

        // Base64 编码
        const audioBase64 = btoa(String.fromCharCode(...uint8Data))

        // 发送中间帧
        sendMiddleFrame(audioBase64)

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
      // 发送剩余的音频数据
      if (audioBuffer.length > 0 && isConnected) {
        const int16Data = new Int16Array(audioBuffer.length)
        for (let i = 0; i < audioBuffer.length; i++) {
          const sample = Math.max(-1, Math.min(1, audioBuffer[i]))
          int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        }

        const uint8Data = new Uint8Array(int16Data.buffer)
        const audioBase64 = btoa(String.fromCharCode(...uint8Data))
        sendMiddleFrame(audioBase64)
      }

      // 发送结束标识
      if (ws.readyState === WebSocket.OPEN) {
        sendLastFrame()
      }

      // 延迟关闭连接，等待最终结果
      setTimeout(() => {
        ws.close()
      }, 1000)
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
