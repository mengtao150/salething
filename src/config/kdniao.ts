export const kdniaoConfig = {
  eBusinessId: '1669193',
  apiKey: '91da5868-0716-4f1a-944e-12eb9b49d916',
  apiUrl: 'https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx',
  traceRequestType: '8002'
}

export const isKdniaoConfigured = () => {
  return Boolean(kdniaoConfig.eBusinessId && kdniaoConfig.apiKey)
}
