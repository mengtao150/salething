# QQ 邮箱邮件发送配置指南

## 方案一：使用 QQ 邮箱 SMTP（推荐）

### 1. 开启 QQ 邮箱 SMTP 服务

1. 登录 QQ 邮箱网页版：https://mail.qq.com
2. 点击顶部的 **设置**
3. 选择 **账户** → **POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务**
4. 开启 **SMTP 服务**
5. 点击 **生成授权码**（这是关键！不是QQ密码）
6. 通过手机验证获取 **授权码**，保存好这个授权码

### 2. 注册 EmailJS

访问：https://www.emailjs.com/
- 注册账号
- 验证邮箱

### 3. 配置 Email Service

在 EmailJS 控制台：

#### 方法 A：添加 SMTP 服务
1. 点击 **Email Services** → **Add New Service**
2. 选择 **Custom SMTP**
3. 填写以下信息：
   ```
   SMTP Host: smtp.qq.com
   Port: 465
   Username: 2640622467@qq.com
   Password: [刚才生成的授权码]
   From: 2640622467@qq.com
   Reply To: 2640622467@qq.com
   ```
4. 点击 **Save**

#### 方法 B：直接配置（推荐）
1. 在 **Account** → **General** 记录你的 Public Key
2. 在 **Email Services** 中创建一个 service，名称自定义

### 4. 更新项目配置

编辑 `src/config/emailjs.ts`，填入你的信息：

```typescript
export const emailJsConfig = {
  publicKey: '你的_EmailJS_Public_Key',

  // QQ 邮箱配置
  smtp: {
    host: 'smtp.qq.com',
    port: 465,
    username: '2640622467@qq.com',
    password: '你的QQ邮箱授权码' // 注意：是授权码，不是QQ密码！
  }
}
```

### 5. 测试发送

1. 刷新页面
2. 点击 **📧 测试邮件提醒** 按钮
3. 邮件将自动发送到 `2640622467@qq.com`

---

## 方案二：使用其他邮箱服务

如果 QQ 邮箱配置有问题，可以使用其他邮箱：

### Gmail
- 优点：配置简单，EmailJS 原生支持
- 缺点：需要科学上网访问

### 163/126 邮箱
- 开启 SMTP 服务
- 获取授权码

### 企业邮箱
- 支持自定义 SMTP

---

## 常见问题

### QQ 邮箱授权码相关问题

**如何获取授权码？**
1. QQ邮箱 → 设置 → 账户
2. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
3. 开启"SMTP服务"
4. 点击"生成授权码"
5. 通过手机短信验证获取

**授权码与QQ密码的区别？**
- 授权码：专门用于第三方应用发送邮件
- QQ密码：用于登录QQ，不能用于邮件发送

**授权码忘记了怎么办？**
- 删除旧的授权码
- 重新生成新的授权码

### 发送失败

**检查项目：**
1. Public Key 是否正确
2. 授权码是否正确
3. 网络连接是否正常

**查看错误信息：**
- 打开浏览器控制台（F12）
- 查看 Console 标签的错误信息

---

## 安全建议

1. **不要将授权码泄露给他人**
2. **定期更换授权码**
3. **授权码不要提交到公开仓库**

当前项目中配置文件会在本地使用，部署到 GitHub Pages 时请确保配置文件不被公开。
