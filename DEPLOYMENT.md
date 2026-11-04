# Peace 公开部署

当前项目适合使用以下结构：

- Render：运行 Python 应用、静态页面和 API。
- Neon：保存家长账户、家庭档案、问卷和咨询记录。
- Cloudflare：管理域名、HTTPS、DNS 和代理。

Cloudflare Pages 不能直接运行当前基于 `psycopg` 的 Python 服务。若要完全迁移到 Cloudflare Workers，需要将后端重写为 JavaScript/TypeScript。本方案保留现有功能，改动更少。

## 上线前

1. 轮换曾经在聊天中出现过的 Neon 数据库密码和 Ark API Key。
2. 确认 `.env` 没有提交到 Git；线上密钥只填写到 Render Environment。
3. 生成一个随机 `APP_SECRET`，至少 32 字节；Render Blueprint 默认会自动生成。
4. 设置一个独立且足够长的 `CONSULTANT_PASSWORD`。

## 部署到 Render

1. 将项目推送到私有 GitHub 仓库。
2. 在 Render 选择 **New > Blueprint**，连接仓库并选择根目录的 `render.yaml`。
3. 填写以下 Secret：

   - `DATABASE_URL`：Neon 池化连接地址，供应用请求使用。
   - `DATABASE_URL_UNPOOLED`：Neon 非池化连接地址，供启动时迁移使用。
   - `ARK_API_KEY`：火山方舟 API Key。
   - `CONSULTANT_PASSWORD`：咨询师端登录密码。

4. 创建服务。启动命令会先运行幂等数据库迁移，再启动 Web 服务。
5. 打开 Render 提供的 `https://...onrender.com` 地址，确认 `/api/health` 返回 `Neon Postgres`。

## 接入 Cloudflare 域名

1. 先在 Render 服务的 **Settings > Custom Domains** 添加域名，例如 `app.example.com`。
2. 按 Render 给出的目标地址，在 Cloudflare DNS 新建 `CNAME`：

   - Name：`app`
   - Target：Render 提供的主机名
   - Proxy status：Proxied

3. Cloudflare SSL/TLS 模式设置为 **Full (strict)**。
4. 等待 Render 签发自定义域名证书，然后访问正式域名。

## 发布后检查

- 游客无法直接读取 `/api/family-archive` 或 `/api/consultation-records`。
- 家长注册、登录后只能读取自己的家庭档案和咨询记录。
- `consultant.html` 需要咨询师密码，AI 接口仅接受咨询师令牌。
- `/.env`、`/.git/`、`/database/` 等路径返回 404。
- 上传分析、咨询流程保存、问卷保存均能写入 Neon。

Render 免费实例闲置后会休眠，首次访问可能需要等待几十秒。正式服务建议升级到持续运行实例，并在 Neon 中为生产环境建立独立分支和备份策略。

## 单独部署家长教育信念问卷到 Vercel

仓库根目录的 `vercel.json` 将只发布问卷填写页、统计页和两个对应的 Python API；其他项目页面和本地文件通过 `.vercelignore` 排除。Neon 连接字符串只供服务端函数使用，不会暴露给浏览器。

1. 先将当前 Neon 数据库迁移到最新版本。在本地 `.env` 配置 `DATABASE_URL_UNPOOLED` 后运行：

   ```bash
   .venv/bin/python database/migrate.py
   ```

   迁移命令使用非池化连接；应用请求使用池化连接。
2. 将这些改动提交并推送到 GitHub。
3. 在 Vercel 选择 **Add New > Project**，导入该仓库，Framework Preset 选择 **Other**，Root Directory 保持项目根目录。
4. 在项目 **Settings > Environment Variables** 添加 `DATABASE_URL`，值使用 Neon 控制台提供的池化连接字符串（通常主机名含 `-pooler`），勾选 Production。若还需预览部署，也为 Preview 环境添加对应连接字符串。
5. 部署后检查 `/` 是否显示问卷页，`/statistics` 是否显示统计页；完成一份测试问卷，再刷新统计页确认数据已更新。

页面地址：

- `/` 或 `/parent-questionnaire.html`：填写问卷
- `/statistics` 或 `/parent-questionnaire-statistics.html`：匿名统计

提交接口为 `/api/questionnaire-submissions`，统计接口为 `/api/questionnaire-statistics`。部署 Vercel 时无需设置 `APP_SECRET`、`ARK_API_KEY` 或本地 Python Web 服务端口。
