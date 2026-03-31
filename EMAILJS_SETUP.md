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

### 2. 添加邮件服务

在 EmailJS 控制台添加邮件服务：

**推荐使用 Gmail（免费）：**

1. 在 EmailJS 控制台，点击 **Email Services**
2. 点击 **Add New Service**
3. 选择 **Gmail**
4. 点击 **Connect Account** 连接你的 Gmail 账号
5. 授权 EmailJS 访问你的 Gmail

**如果不想用 Gmail，可以使用其他服务：**
- Yahoo Mail
- Outlook
- 或其他 EmailJS 支持的服务

### 3. 获取密钥

1. 在 EmailJS 控制台，找到 **Account** → **General**
2. 复制 **Public Key**
3. 在控制台首页，复制 **Service ID**

### 4. 更新项目配置

编辑 `src/config/emailjs.ts` 文件：

```typescript
export const emailJsConfig = {
  publicKey: '你的_Public_Key',        // 从步骤3获取
  serviceId: '你的_Service_ID',        // 从步骤3获取
  templateId: ''  // 可选
}
```

### 5. 测试邮件功能

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

**问题：邮件发送失败**
- 检查网络连接
- 确认 EmailJS 配置正确
- 查看浏览器控制台错误信息

**问题：收不到邮件**
- 检查垃圾邮件文件夹
- 确认邮件服务已正确连接
- 尝试发送测试邮件（EmailJS 控制台有测试功能）

**问题：超出免费额度**
- 等到下个月额度重置
- 或升级到付费版本
