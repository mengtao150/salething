# Supabase 集成说明

## 配置步骤

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账号
3. 创建新项目

### 2. 获取 API 密钥

1. 进入项目设置 → API
2. 复制以下信息：
   - Project URL
   - anon public key

### 3. 创建数据表

1. 在 Supabase 项目中，打开 SQL Editor
2. 复制并执行 `supabase-setup.sql` 文件中的 SQL 脚本

### 4. 配置环境变量

编辑 `.env.local` 文件，填入你的 Supabase 配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. 重启开发服务器

```bash
npm run dev
```

## 工作模式

应用会自动检测 Supabase 配置：

- **已配置**：数据存储到 Supabase 云端，支持多设备同步
- **未配置**：自动回退到浏览器 localStorage，数据仅本地存储

## 数据迁移

如果想将本地数据迁移到 Supabase：

1. 先配置好 Supabase
2. 刷新页面，应用会自动使用 Supabase
3. 本地数据需要手动重新添加（或可以开发导入功能）

## 注意事项

- 本地存储模式和 Supabase 模式数据不互通
- 切换模式时需要重新输入数据
- Supabase 免费版有流量限制，个人使用足够
