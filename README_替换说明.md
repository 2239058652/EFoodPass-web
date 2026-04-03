# EFoodPass-web 购物车补丁说明

这次补丁是基于你当前前端主分支结构补的“前端本地购物车”。

## 为什么是前端本地购物车
当前后端没有专门的购物车接口，所以这次实现方式是：

1. 在“选菜下单”页读取菜品
2. 加入本地购物车（localStorage）
3. 在“购物车”页统一调整数量、填写备注
4. 最终提交到现有 `POST /app/order`

这样你不需要改后端就能直接跑起来。

## 本次新增/修改文件

- `src/stores/cart.ts` 新增购物车 store
- `src/views/app/cart/index.vue` 新增购物车页
- `src/views/app/order/create.vue` 改为选菜 + 加入购物车
- `src/layout/AppUserLayout.vue` 增加购物车菜单
- `src/router/index.ts` 增加 `/app/cart` 路由

## 使用方式

1. 先备份你本地 `EFoodPass-web`
2. 解压补丁 zip
3. 按目录覆盖到你的项目里
4. 运行依赖安装
   - `pnpm install`
   - 或 `npm install`
5. 启动项目

## 入口

- 用户端选菜页：`/app/order/create`
- 购物车页：`/app/cart`

## 注意

如果普通用户不能访问 `/food/item/list`，那“选菜下单”页依然会拿不到菜品。
这个问题不是购物车逻辑本身的问题，而是后端是否开放了用户端菜品列表能力。
