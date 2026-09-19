# 项目长期记忆

## 服务人员小程序（mobile/gaia-customer-service-uni）

- 本机 pnpm 不在 PATH：校验需直接调用本地二进制 `./node_modules/.bin/eslint` / `stylelint` / `vue-tsc --noEmit`，单测用 `node --test scripts/pagination.test.mjs scripts/runtime.test.mjs scripts/example.test.mjs`。
- 页面交互契约由 `scripts/runtime.test.mjs` 的正则断言看护（类名、文案、样式片段、结构顺序）：改页面文案或类名时必须同步更新断言，不能只改源码。
- 首页「正在服务」区域是正在服务任务的唯一入口：后端 `ServicePersonnelTaskMapper.xml` 用 `excludeCurrentService` 把这些任务排除在下方分类列表外。任何折叠、精简、聚合都不得移除单据入口。
- 测试禁止的文案：`单需要继续处理`、`其中 … 单已置顶`。

## Gaia 多仓工作区通用

- 本机 shell 无 `pnpm`：仓库 husky `pre-commit` 需用 `PATH="/opt/homebrew/bin:$PATH"` 调用（该目录 node 26.7.0，匹配 `.nvmrc`；pnpm 10.2.1）。不得用 `--no-verify` 绕钩子。
- 工作区常有并发 Codex 代理对多数仓库有写权限，会留下 `.git/index.lock`。先用 `pgrep -fl git` / `lsof` 确认无进程持有，确认是遗留锁再 `rm -f`，并与 `git add` + `git commit` 放同一条命令。
- 提交信息一律 `git commit -F <文件>`；同一功能一个提交，按功能分组，不含 push／发布。
- doc-impact 检查：每个仓库的本地 `docs/**` 即为有效证据；纯 `04-页面原型/**` 文档改动不触发代码仓库影响检查。
