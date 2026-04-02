# EFoodPass-web AI 前端补丁（按后端 main 最新 AI 模块生成）

## 这次补齐的内容
- 新增 AI 会话页面（聊天、会话列表、会话切换）
- 对接真实后端 AI 接口：
  - `POST /ai/chat`
  - `POST /ai/chat/stream`
  - `GET /ai/chat/sessions`
  - `GET /ai/chat/session/{sessionId}`
  - `PUT /ai/chat/session/{sessionId}/title`
  - `DELETE /ai/chat/session/{sessionId}`
- 支持：
  - 继续指定 `sessionId` 多轮对话
  - 标准回复模式
  - 流式回复模式（SSE）
  - 查看历史会话列表
  - 打开某个历史会话详情
  - 分页加载更早消息
  - 重命名会话
  - 删除会话
  - 展示后端返回的 `toolStatus / usage / retrieval / card / conversation` 元信息

## 覆盖到你本地项目的方法
1. 先备份你本地 `EFoodPass-web`
2. 解压本压缩包
3. 按目录把文件覆盖到你的前端项目
4. 执行依赖安装
   - `pnpm install`
   - 或 `npm install`
5. 启动项目

## 这次包含的文件
- `src/api/ai.ts`
- `src/views/ai/chat/index.vue`
- `src/router/index.ts`
- `src/layout/AppLayout.vue`
- `src/layout/AppUserLayout.vue`
- `src/views/dashboard/index.vue`
- `src/types/index.ts`

## 使用说明
- 登录后进入：
  - 管理端：`/admin/ai/chat`
  - 用户端：`/app/ai/chat`
- 新对话时不传 `sessionId`
- 后端返回 `sessionId` 后，后续继续提问会自动带上
- 打开历史会话时默认拿最新一页消息
- 点击“加载更早消息”会继续请求更早的历史分页
- 标准模式会显示结构化元信息
- 流式模式实时输出正文，但不返回结构化诊断字段

## 说明
- 这次没有直接改你的 GitHub 仓库
- 这是本地替换补丁包
- 若你本地前端代理仍指向旧后端地址，请自行把代理或 `VITE_BASE_API` 调整到当前 Spring Boot 服务地址
