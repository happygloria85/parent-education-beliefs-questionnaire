# 家长教育信念问卷部署

本仓库只包含问卷填写页、匿名统计页，以及对应的 Vercel Python API。问卷答案保存在 Neon Postgres。

## 1. 准备 Neon 数据库

在 Neon SQL Editor 中运行 [`database/setup_questionnaire_submissions.sql`](database/setup_questionnaire_submissions.sql)。该脚本可重复运行；若数据库已有问卷提交表，不会改动已有记录。

## 2. 部署到 Vercel

1. 在 Vercel 选择 **Add New > Project**，导入本仓库。Framework Preset 选择 **Other**，Root Directory 使用仓库根目录。
2. 在项目 **Settings > Environment Variables** 添加 `DATABASE_URL`，值使用 Neon 的池化连接字符串（主机名通常包含 `-pooler`），并勾选 Production。需要 Preview 部署时，也为 Preview 环境设置连接字符串。
3. 部署项目。

## 3. 访问页面

- `/` 或 `/parent-questionnaire.html`：填写问卷
- `/statistics` 或 `/parent-questionnaire-statistics.html`：匿名统计

API 路径：

- `POST /api/questionnaire-submissions`：保存问卷
- `GET /api/questionnaire-statistics`：读取匿名选项汇总

Neon 连接字符串仅在 Vercel 服务端函数中使用，不会传给浏览器。不要将 `.env`、数据库密码或密钥提交到仓库。
