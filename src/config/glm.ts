// 智谱 GLM-5 配置
export const glmConfig = {
  apiKey: 'f7febae9388a4711976a13107486d594.svHqIZhiE5HYI1Ff',
  baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4', // OpenAI 兼容接口
  model: 'glm-5'
}

// 检查是否已配置
export const isGlmConfigured = (): boolean => {
  return !!glmConfig.apiKey
}
