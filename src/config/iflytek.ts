// 科大讯飞中英识别大模型 API 配置
// 文档: https://www.xfyun.cn/doc/spark/spark_zh_iat.html

export const iflytekConfig = {
  appId: '602059d2',
  apiKey: '0c762e23268f771df76fbcc611d21fe3',
  apiSecret: 'ZDdlZTlkMjM1NjYwZjdmOTRjZDFkMDk0',
  host: 'iat.xf-yun.com',
  wsUrl: 'wss://iat.xf-yun.com/v1'
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
