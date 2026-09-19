# 项目长期记忆

## 服务人员小程序（mobile/gaia-customer-service-uni）

- 本机 pnpm 不在 PATH：校验需直接调用本地二进制 `./node_modules/.bin/eslint` / `stylelint` / `vue-tsc --noEmit`，单测用 `node --test scripts/pagination.test.mjs scripts/runtime.test.mjs scripts/example.test.mjs`。
- 页面交互契约由 `scripts/runtime.test.mjs` 的正则断言看护（类名、文案、样式片段、结构顺序）：改页面文案或类名时必须同步更新断言，不能只改源码。
- 首页「正在服务」区域是正在服务任务的唯一入口：后端 `ServicePersonnelTaskMapper.xml` 用 `excludeCurrentService` 把这些任务排除在下方分类列表外。任何折叠、精简、聚合都不得移除单据入口。
- 测试禁止的文案：`单需要继续处理`、`其中 … 单已置顶`。
