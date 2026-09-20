# 项目长期记忆

## 服务人员小程序（mobile/gaia-customer-service-uni）

- 本机 pnpm 不在 PATH：校验需直接调用本地二进制 `./node_modules/.bin/eslint` / `stylelint` / `vue-tsc --noEmit`，单测用 `node --test scripts/pagination.test.mjs scripts/runtime.test.mjs scripts/example.test.mjs`。
- 页面交互契约由 `scripts/runtime.test.mjs` 的正则断言看护（类名、文案、样式片段、结构顺序）：改页面文案或类名时必须同步更新断言，不能只改源码。
- 首页「正在服务」区域是正在服务任务的唯一入口：后端 `ServicePersonnelTaskMapper.xml` 用 `excludeCurrentService` 把这些任务排除在下方分类列表外。任何折叠、精简、聚合都不得移除单据入口。
- 测试禁止的文案：`单需要继续处理`、`其中 … 单已置顶`。
- 任务首页（`src/pages/task/index.vue`、`src/components/task/TaskCard.vue`）改动范围由用户单独控制：做"与原型对齐"类任务时默认不动该页，需用户明确要求才改。**2026-09-19 第五轮已按用户明确指令把首页任务卡纳入原型对齐**（含 `TaskCard.vue` 与首页 `.task-results` 两行样式），此后该默认约束不再自动适用。
- 首页任务列表间距与卡面描边由卡片自身承担（原型 `.w-ticket { margin: 0 0 13px; border: 1px solid #e2e8f1 }`）：`.task-results` **不得**再加 `gap`，也不得用 `:deep(.task-card){ border: 0 }` 抹掉描边；任务卡在 `.worker-phone` 画布下**无阴影**（`.worker-phone .w-ticket { box-shadow: none }`）。
- 工作区改动可能被并发代理提交（例：`ccdcb26 feat(miniapp): 收口服务人员任务页交互与共同底座`）。判断改动是否已入库要查 `git log --oneline` 与 `git diff HEAD --stat`，不要假设工作区差异都未提交。
- 设计令牌只认 `src/theme.json` / `build/theme.ts` 生成的名字：`--app-text-main`、`--app-text-secondary`、`--app-text-on-primary`、`--app-primary(-active)`、`--app-accent-light`、`--app-bg-color`、`--app-surface-color`、`--app-border-color`、`--app-border-light`、`--app-success/-warning/-danger/-info(-surface)`。`--app-page-color`、`--app-text-color` **不存在**，写了会静默失效。
- 另有三个令牌**不在** `build/theme.ts`：`--app-primary` / `--app-primary-active`（`#205D8B`）来自 `build/tenant/profiles/toto.ts` → `vite.config.ts` 注入 scss 变量 → `src/static/styles/tdesign-theme.scss`；`--app-radius-control: 12rpx`、`--app-radius-card: 24rpx`、`--app-radius-overlay: 32rpx` 在 `src/static/styles/common.scss`。原型圆角若与这些值不符（如 `.w-ticket` 14px = 28rpx）就写字面值。
- **按钮文字在 uni-app 里默认偏上**：微信 `uni-button` 默认 `line-height: 2.5555`，小 `min-height` 按钮会把单行文字顶到偏上。所有按钮必须显式 `display: flex; align-items: center; justify-content: center` **并**声明 `line-height`（1.2～1.45）；只加 `align-items` 不写 `line-height` 仍会偏。主／次按钮圆角按原型 `.primary`/`.secondary` 14px = **28rpx**，不要套令牌 `--app-radius-control`（12rpx）。
- **`.app-page__content` 自带 `gap: 16rpx`（`--app-list-gap`），是 flex 列容器**，而原型是块级流、外边距可折叠。照抄原型外边距会整体偏大；正确做法是把原型折叠后的目标间距**先换算成 rpx**（1px = 2rpx），**扣掉固定 16rpx 的 gap**，余量再拆给相邻两个元素的外边距。已折算的三处（配件首页 · 目前只有这一页用 `.app-page__content`）：① 概览卡→搜索框 原型 16px＝32rpx，扣 gap 剩 16rpx，全给搜索框上边距 ⇒ 概览卡 `margin-bottom: 0`、`.part-search { margin: 16rpx 0 }`；② 搜索框→列表标题 16px＝32rpx，扣 gap 剩 16rpx，由搜索框下边距承担 ⇒ 同上；③ 标题→首行 12px＝24rpx，扣 gap 剩 8rpx ⇒ `.part-heading { margin: 0 0 8rpx }`。补偿处必须写注释说明依据，否则后人会当错值改回。**`partFlow/*` 子页用的是 `.app-page--padded`（块级容器、无 gap），其边距按原型字面值直写即可，不要照搬首页的折算。**
- **提取原型 CSS 必须用子串匹配选择器**，不要「按逗号分段后完全相等」比对：后者会漏掉 `.worker-phone .primary`、`.worker-phone .w-stock-summary` 这类带前缀的覆盖规则（`.primary` 基础圆角 11px 实际被覆盖成 14px）。同名选择器的**全部**声明块一起看。
- 原型搜索区里的查询按钮是**蓝色文字按钮、无底色**，不是实心主按钮；`.w-search` 100rpx 高／22rpx 圆角。步进按钮 `.w-quantity button` 80rpx × 80rpx／16rpx 圆角／`line-height: 1`／底 `#f2f6fb`。
- 本机 `agent-browser` 未安装，Google Chrome 无头会 SIGTERM/exit 137。截原型用 `~/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell --no-sandbox --disable-gpu-sandbox --disable-software-rasterizer --user-data-dir=/tmp/hs-prof-N`；像素测量用 `/Users/snow/.workbuddy/binaries/python/envs/default/bin/python`（PIL 12.3.0）。
- 原型一致性任务先读 `../../docs/toto/04-页面原型/小程序/worker.js`（`seedTasks`/`reviewOverview`/`nextStep`/`tone`/`queueName`/`canArrange`/各 screen 渲染函数）与 `worker.css`（390px 画布，1px = 2rpx）；`worker.css` 是超长单行文件，shell `grep` 在此机对中文/长行不可靠，用 Grep 工具或 Python 拆规则。落地结论写进仓库根的 `design-qa.md`（按轮次追加）。
- `worker.css` 取值必须连「后来声明的同优先级规则」和 `.worker-phone`/`[data-screen]` 覆盖一起看，否则会取到失效值：例 `.w-tag` 蓝色实际生效 `#eaf3f8/#2b74aa`（被文件后段的 `var(--w-blue-soft)/var(--w-blue)` 覆盖），而非它自己写的 `#e9f1ff/#1c61b7`；`.w-ticket` 在 `.worker-phone` 下 `box-shadow: none`；任务屏有 `[data-screen="w-tasks"]` 专属内距。
- 断言里的样式检查不要用 `[\s\S]*` 拼接：eslint `regexp/no-super-linear-backtracking` 会报错，且同一选择器可能出现在共享规则里。用 `matchAll` 取同名选择器全部声明块再 `includes`。
- **断言不要匹配整段表达式的字面写法**（如 `showSchedule` 的完整条件式）：本工作区存在并行写入方，表达式会被别人改写导致断言无故变红。改为按声明块切片做语义断言：`const block = card.slice(card.indexOf('const showSchedule'), card.indexOf('const productName', start))` 再对关键条件逐个 `includes`。
- **开工时先 `git status` + 收尾再 `git status`**：确认过 `src/pages/task/index.vue` 不在变更列表、收尾却出现（含本轮没写过的类名），说明有并行写入方改了同一文件。发现后先 `git diff` 与 `mtime` 定位范围，**不回退他人改动**，只把断言调成语义级。

## Gaia 多仓工作区通用

- 本机 shell 无 `pnpm`：仓库 husky `pre-commit` 需用 `PATH="/opt/homebrew/bin:$PATH"` 调用（该目录 node 26.7.0，匹配 `.nvmrc`；pnpm 10.2.1）。不得用 `--no-verify` 绕钩子。
- 工作区常有并发 Codex 代理对多数仓库有写权限，会留下 `.git/index.lock`。先用 `pgrep -fl git` / `lsof` 确认无进程持有，确认是遗留锁再 `rm -f`，并与 `git add` + `git commit` 放同一条命令。
- 提交信息一律 `git commit -F <文件>`；同一功能一个提交，按功能分组，不含 push／发布。
- doc-impact 检查：每个仓库的本地 `docs/**` 即为有效证据；纯 `04-页面原型/**` 文档改动不触发代码仓库影响检查。
