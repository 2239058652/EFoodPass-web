EFoodPass-web AI patch（本次对齐后端最新 Spring AI 代码）

这次补齐的重点：
1. AI 聊天页继续对齐最新主分支：
   - 标准回复
   - 流式回复（/ai/chat/stream）
   - 会话列表 / 历史恢复 / 分页加载更早消息
   - 重命名 / 删除会话
   - usage / retrieval / 结构化 card 展示
2. 新增系统知识库索引管理：
   - GET /ai/knowledge/system/status
   - POST /ai/knowledge/system/rebuild
   - 新增管理端页面：/admin/ai/knowledge

需要覆盖到你本地项目中的文件：
- src/types/ai.ts
- src/api/ai.ts
- src/router/index.ts
- src/layout/AppLayout.vue
- src/layout/AppUserLayout.vue
- src/views/dashboard/index.vue
- src/views/ai/chat/index.vue
- src/views/ai/knowledge/index.vue

使用步骤：
1. 先备份你本地 EFoodPass-web
2. 解压本 zip
3. 按目录覆盖到你的本地前端项目
4. 执行 pnpm install 或 npm install
5. 启动项目，登录后检查：
   - /admin/ai/chat
   - /admin/ai/knowledge
   - /app/ai/chat

说明：
- 当前后端知识库控制器没有单独声明权限注解；全局安全链路下它仍需要登录。
- 前端把知识库入口放在管理端工作台中，避免普通用户区域出现运维类入口。
