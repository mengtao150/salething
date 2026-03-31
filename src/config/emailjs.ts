// EmailJS 配置
// 使用说明：
// 1. 访问 https://www.emailjs.com/ 注册账号
// 2. 添加邮件服务（推荐使用 Gmail 或其他支持的服务）
// 3. 获取 Public Key 和 Service ID
// 4. 将下面的配置替换为你的实际密钥

export const emailJsConfig = {
  // 从 EmailJS 控制台获取
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',

  // 邮件服务配置
  serviceId: 'YOUR_SERVICE_ID',

  // 模板 ID（可选，也可以直接发送）
  templateId: 'YOUR_TEMPLATE_ID'
}

// 检查是否已配置
export const isEmailJsConfigured = () => {
  return emailJsConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY'
}
