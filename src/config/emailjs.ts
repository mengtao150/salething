// EmailJS 配置
// 使用说明：
// 1. 访问 https://www.emailjs.com/ 注册账号
// 2. 添加 Email Service：选择 QQ 邮箱 SMTP
// 3. 创建 Email Template（重要！）
//    - 访问 https://dashboard.emailjs.com/admin/templates
//    - 点击 "Create New Template"
//    - 模板内容使用以下变量：
//      {{to_email}} - 收件人邮箱
//      {{to_name}} - 收件人名称
//      {{subject}} - 邮件主题
//      {{message}} - 邮件内容（HTML格式）
//    - 保存后复制 Template ID
// 4. 获取 Public Key
// 5. 将下面的配置替换为你的实际密钥

export const emailJsConfig = {
  // 从 EmailJS 控制台获取
  publicKey: 'SGE_moe6TirYGNo9Z',

  // Service ID
  serviceId: 'service_t2wjlck',

  // Template ID - 需要在 EmailJS 控制台创建模板
  // 访问: https://dashboard.emailjs.com/admin/templates
  templateId: 'YOUR_EMAILJS_TEMPLATE_ID',

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
         !!emailJsConfig.serviceId &&
         emailJsConfig.templateId !== 'YOUR_EMAILJS_TEMPLATE_ID'
}
