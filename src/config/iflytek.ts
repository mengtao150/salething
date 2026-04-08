export const iflytekConfig = {
  appId: '602059d2',
  apiSecret: 'ZDdlZTlkMjM1NjYwZjdmOTRjZDFkMDk0',
  apiKey: '0c762e23268f771df76fbcc611d21fe3',
  wsUrl: 'wss://iat-api.xfyun.cn/v2/iat'
}

export const isIflytekConfigured = () => {
  return Boolean(iflytekConfig.appId && iflytekConfig.apiKey && iflytekConfig.apiSecret)
}
