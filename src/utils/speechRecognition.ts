import { ElMessage } from 'element-plus'
import { iflytekConfig } from '@/config/iflytek'
import { buildWebSocketUrl } from './iflytekSignature'

export interface SpeechRecognitionOptions {
  onResult: (text: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

interface IatResponse {
  code: number
  message: string
  sid?: string
  data?: {
    status: number
    result?: {
      ws?: Array<{
        cw?: Array<{
          w?: string
        }>
      }>
      pgs?: 'apd' | 'rpl'
      rg?: [number, number]
    }
  }
}

const FRAME_INTERVAL = 40
const TARGET_SAMPLE_RATE = 16000
const STATUS_FIRST_FRAME = 0
const STATUS_CONTINUE_FRAME = 1
const STATUS_LAST_FRAME = 2

export function checkSpeechSupport(): boolean {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Boolean(navigator.mediaDevices?.getUserMedia && AudioContextClass && iflytekConfig.appId && iflytekConfig.apiKey && iflytekConfig.apiSecret)
}

export async function startSpeechRecognition(options: SpeechRecognitionOptions): Promise<(() => void) | null> {
  if (!checkSpeechSupport()) {
    const errorMsg = '请先正确配置讯飞语音听写 WebSocket 参数'
    ElMessage.error(errorMsg)
    options.onError?.(errorMsg)
    return null
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) {
      throw new Error('当前浏览器不支持录音')
    }

    const audioContext = new AudioContextClass()
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    const wsUrl = await buildWebSocketUrl()
    const websocket = new WebSocket(wsUrl)

    let sendStatus = STATUS_FIRST_FRAME
    let isStopped = false
    let isClosed = false
    let sendTimer: number | null = null
    let pendingPcm = new Int16Array(0)
    let transcriptSegments: string[] = []

    const cleanup = async () => {
      if (isClosed) return
      isClosed = true

      if (sendTimer !== null) {
        clearInterval(sendTimer)
        sendTimer = null
      }

      processor.disconnect()
      source.disconnect()
      stream.getTracks().forEach(track => track.stop())
      await audioContext.close()
      options.onEnd?.()
    }

    processor.onaudioprocess = event => {
      if (isStopped) return

      const input = event.inputBuffer.getChannelData(0)
      const downsampled = downsampleBuffer(input, audioContext.sampleRate, TARGET_SAMPLE_RATE)
      const pcmChunk = floatTo16BitPCM(downsampled)
      pendingPcm = concatInt16Arrays(pendingPcm, pcmChunk)
    }

    source.connect(processor)
    processor.connect(audioContext.destination)

    websocket.onopen = () => {
      sendTimer = window.setInterval(() => {
        if (websocket.readyState !== WebSocket.OPEN) {
          return
        }

        const frame = takeFrameFromBuffer()
        if (!frame && !isStopped) {
          return
        }

        if (sendStatus === STATUS_FIRST_FRAME) {
          websocket.send(
            JSON.stringify({
              common: {
                app_id: iflytekConfig.appId
              },
              business: {
                language: 'zh_cn',
                domain: 'iat',
                accent: 'mandarin',
                vad_eos: 10000,
                dwa: 'wpgs'
              },
              data: {
                status: STATUS_FIRST_FRAME,
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: arrayBufferToBase64(frame ?? new Int16Array(0))
              }
            })
          )
          sendStatus = STATUS_CONTINUE_FRAME
          return
        }

        if (frame && frame.length > 0) {
          websocket.send(
            JSON.stringify({
              data: {
                status: STATUS_CONTINUE_FRAME,
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: arrayBufferToBase64(frame)
              }
            })
          )
          return
        }

        if (isStopped) {
          websocket.send(
            JSON.stringify({
              data: {
                status: STATUS_LAST_FRAME,
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: ''
              }
            })
          )

          if (sendTimer !== null) {
            clearInterval(sendTimer)
            sendTimer = null
          }
        }
      }, FRAME_INTERVAL)
    }

    websocket.onmessage = event => {
      try {
        const response = JSON.parse(event.data) as IatResponse

        if (response.code !== 0) {
          throw new Error(response.message || `讯飞识别失败: ${response.code}`)
        }

        const result = response.data?.result
        if (result?.ws?.length) {
          const text = result.ws
            .flatMap(item => item.cw ?? [])
            .map(item => item.w ?? '')
            .join('')

          if (text) {
            if (result.pgs === 'rpl' && result.rg) {
              const [start, end] = result.rg
              transcriptSegments.splice(start - 1, end - start + 1, text)
            } else {
              transcriptSegments.push(text)
            }
          }
        }

        if (response.data?.status === STATUS_LAST_FRAME) {
          const finalText = transcriptSegments.join('').trim()
          console.log('[讯飞语音转文字]', finalText)
          options.onResult(finalText)
          websocket.close()
        }
      } catch (error) {
        const message = getErrorMessage(error)
        options.onError?.(message)
        ElMessage.error(message)
        websocket.close()
      }
    }

    websocket.onerror = () => {
      const errorMsg = '讯飞 WebSocket 连接失败'
      options.onError?.(errorMsg)
      ElMessage.error(errorMsg)
    }

    websocket.onclose = () => {
      void cleanup()
    }

    return () => {
      isStopped = true
    }

    function takeFrameFromBuffer() {
      const frameSize = Math.max(1, Math.floor((TARGET_SAMPLE_RATE * FRAME_INTERVAL) / 1000))
      if (pendingPcm.length < frameSize) {
        return null
      }

      const frame = pendingPcm.slice(0, frameSize)
      pendingPcm = pendingPcm.slice(frameSize)
      return frame
    }
  } catch (error) {
    const message = getErrorMessage(error)
    ElMessage.error(message)
    options.onError?.(message)
    return null
  }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Microphone permission denied:', error)
    return false
  }
}

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) {
  if (outputSampleRate >= inputSampleRate) {
    return buffer
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate
  const newLength = Math.round(buffer.length / sampleRateRatio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0

  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    let accum = 0
    let count = 0

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i]
      count += 1
    }

    result[offsetResult] = count > 0 ? accum / count : 0
    offsetResult += 1
    offsetBuffer = nextOffsetBuffer
  }

  return result
}

function floatTo16BitPCM(buffer: Float32Array) {
  const output = new Int16Array(buffer.length)

  for (let i = 0; i < buffer.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, buffer[i]))
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }

  return output
}

function concatInt16Arrays(first: Int16Array, second: Int16Array) {
  const merged = new Int16Array(first.length + second.length)
  merged.set(first, 0)
  merged.set(second, first.length)
  return merged
}

function arrayBufferToBase64(data: Int16Array) {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  let binary = ''

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return '无法访问麦克风，请检查浏览器权限设置'
    }

    return error.message
  }

  return '语音识别失败，请稍后重试'
}
