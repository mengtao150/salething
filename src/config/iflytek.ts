// 科大讯飞实时语音转写 API 配置
// 文档: https://www.xfyun.cn/doc/spark/asr_llm/rtasr_llm.html

export const iflytekConfig = {
  appId: '602059d2',
  apiKey: '0c762e23268f771df76fbcc611d21fe3',  // 用于签名
  apiSecret: 'ZDdlZTlkMjM1NjYwZjdmOTRjZDFkMDk0',  // 备用
  wsUrl: 'wss://rtasr.xfyun.cn/v1/ws'
}

/**
 * 检查是否已配置科大讯飞 API
 */
export const isIflytekConfigured = (): boolean => {
  return !!(
    iflytekConfig.appId &&
    iflytekConfig.apiKey &&
    iflytekConfig.apiSecret
  )
}
