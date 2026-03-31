// EmailJS 配置
// 使用说明：
// 1. 访问 https://www.emailjs.com/ 注册账号
// 2. 配置 QQ 邮箱 SMTP（见下方说明）
// 3. 添加 Email Service：选择 "SMTP" 或 "Custom SMTP"
// 4. 获取 Public Key
// 5. 将下面的配置替换为你的实际密钥

export const emailJsConfig = {
  // 从 EmailJS 控制台获取
  publicKey: 'SGE_moe6TirYGNo9Z',

  // Service ID
  serviceId: 'service_t2wjlck',

  // 目标邮箱
  targetEmail: '2640622467@qq.com',

  // SMTP 配置（QQ 邮箱）
  smtpConfig: {
    host: 'smtp.qq.com',
    port: 465,
    username: '2640622467@qq.com', // 你的QQ邮箱
    // 注意：不是QQ密码，需要开启SMTP服务后获取授权码
    password: 'YOUR_QQ_EMAIL_AUTHORIZATION_CODE'
  }
}

// 检查是否已配置
export const isEmailJsConfigured = () => {
  return emailJsConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY' &&
         !!emailJsConfig.serviceId
}
