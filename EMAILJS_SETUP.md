# EmailJS 邮件服务配置指南

## 为什么使用 EmailJS？

EmailJS 是一个免费的前端邮件服务，可以：
- ✅ 自动发送邮件到 QQ 邮箱
- ✅ 无需后端服务器
- ✅ 免费额度：每月 200 封邮件

## 配置步骤

### 1. 注册 EmailJS 账号

1. 访问：https://www.emailjs.com/
2. 点击 **Sign Up** 注册账号
3. 注册后登录邮箱验证

### 2. 添加邮件服务（QQ 邮箱）

1. 在 EmailJS 控制台，点击 **Email Services**
2. 点击 **Add New Service**
3. 选择 **Custom SMTP**（使用 QQ 邮箱）
4. 填写以下信息：
   ```
   SMTP Host: smtp.qq.com
   Port: 465 或 587
   Username: 你的QQ邮箱（如 2640622467@qq.com）
   Password: QQ邮箱授权码（不是QQ密码！）
   From Name: 得物倒卖
   ```
5. 点击 **Save**

**如何获取 QQ 邮箱授权码：**
- 登录 QQ 邮箱 → 设置 → 账户
- 开启 SMTP 服务
- 生成授权码（通过手机验证）

### 3. 创建邮件模板（重要！）

1. 在 EmailJS 控制台，点击 **Email Templates**
2. 点击 **Create New Template**
3. 填写模板信息：
   - **Template Name**: 得物倒卖提醒
   - **Subject**: `{{subject}}`
   - **To Email**: `{{to_email}}`
   - **Content** (HTML 格式):
     ```html
     <!DOCTYPE html>
     <html>
     <head>
       <meta charset="UTF-8">
     </head>
     <body>
       {{{message}}}
     </body>
     </html>
     ```
4. 点击 **Save**
5. 复制生成的 **Template ID**

### 4. 获取密钥

1. 在 EmailJS 控制台，找到 **Account** → **General**
2. 复制 **Public Key**
3. 在控制台首页，复制 **Service ID**

### 5. 更新项目配置

编辑 `src/config/emailjs.ts` 文件：

```typescript
export const emailJsConfig = {
  publicKey: '你的_Public_Key',        // 从步骤4获取
  serviceId: '你的_Service_ID',        // 从步骤4获取
  templateId: '你的_Template_ID',      // 从步骤3获取（重要！）
  targetEmail: '2640622467@qq.com'
}
```

### 6. 测试邮件功能

1. 刷新页面
2. 点击 **📧 测试邮件提醒** 按钮
3. 邮件将自动发送到 `2640622467@qq.com`

## 免费额度说明

- EmailJS 免费版：每月 200 封邮件
- 对于个人使用完全足够
- 超额后可以升级付费版或下个月继续使用

## 安全说明

- 配置文件会暴露在代码中，这是正常的
- 只使用了 Public Key，没有私钥泄露风险
- 邮件服务由 EmailJS 提供，安全可靠

## 故障排除

**错误：The template ID not found**
- 这是配置错误，需要创建邮件模板
- 按照步骤3操作创建模板
- 将 Template ID 填入配置文件

**问题：邮件发送失败**
- 检查网络连接
- 确认 EmailJS 配置正确
- 查看浏览器控制台错误信息
- 确认已创建邮件模板

**问题：收不到邮件**
- 检查垃圾邮件文件夹
- 确认邮件服务已正确连接
- 尝试发送测试邮件（EmailJS 控制台有测试功能）

**问题：超出免费额度**
- 等到下个月额度重置
- 或升级到付费版本
