# 整周集中排班：研发验证记录

> 历史记录：用户随后要求整体恢复彩色边条版本，本集中表单实现已撤下。当前状态见[恢复验证](../2026-09-26-schedule-restore-border/verification.md)。

- 日期：2026-09-26；关联 A27／STA-003／OPT-20260926-04。
- 依据：[确认设计](../../2026-09-26-整周集中排班交互设计.md)、[实施计划](../../plans/2026-09-26-整周集中排班实施计划.md)。
- 范围：`gaia-ui/apps/after-sales` 排班页面、业务模型、两个集中表单、隔离夹具和文案；本轮无后端、数据库、菜单、公共组件修改。
- 状态：源码与核心隔离研发验证完成；正式业务验收待完成。未 commit、push 或部署共享环境；未重启后端。

## 最终操作

1. 主周表只保留“安排本周”主操作，点击具体日期格直接进入单日调整。列表顶部和行编辑使用相同两个表单。
2. 周表单按“选人 → 设置七天 → 查看影响”组织，在同一弹窗底部确认；确认立即生效，无第二层保存确认或草稿分支。
3. 选择独立于主表分页，搜索与翻页保留已选人员；全选明确限于本页，最多 100 人／700 格。
4. 默认只补空格。勾选“同时调整已有排班”后才调整可编辑记录；未变发布格、锁定、过期、作废及不可编辑记录计入保留，未选草稿不顺带发布。
5. 权限、版本、技能、原因、工单及全周每天有人在岗的规则继续生效；休假／临时停单也须填写原因。原因和备注最多 200 字，与实际后端一致。
6. 保存失败保留输入，不自动重试；保存中禁重复提交与离开，关闭／取消／路由／工作视角共用放弃判定。页面退出保护沿用现有表单与路由机制。

## 自动化与构建

使用 Node 24.21.0、pnpm 10.8.1，pnpm 显式 `--ignore-workspace`。

| 检查 | 结果 |
| --- | --- |
| 新排班模型与完整读取测试 | 23 项通过；含权限、未知人员、100／101 人、技能、版本载荷、覆盖草稿、未选草稿不计在岗、工作冲突、缺岗、未变发布格、原因、分页截断、失败及中止 |
| 原 `schedule-editor.test.ts` | 6 项通过；保留已有转换／复制纯函数回归 |
| `pnpm --ignore-workspace check` 前置检查 | ESLint、依赖检查、应用及测试 TypeScript、文案检查全部通过 |
| 完整测试 | 363 项，333 通过、30 失败；原基线 340 项，310 通过、30 失败；逐名称比较无新增失败 |
| Vite production build | 通过 |
| `check-bundle-size.mjs` | 218 个 JS/CSS 资源通过；最大约 1310.6 KiB |
| 前端及文档 `git diff --check` | 通过 |

旧 `page-guidance.test.ts` 中要求旧独立发布确认框固定文案的断言已退役。排班覆盖要求由新模型实际行为测试与浏览器缺岗提示验证；该文件其他断言保留。

## 浏览器关键路径

隔离地址：`http://127.0.0.1:9017/after-sales/tests/browser/schedule.html`。桌面 1280 × 720；保存仅修改夹具内存，真实业务写请求继续被隔离服务器阻断。

| 路径 | 观察结果 |
| --- | --- |
| 首次整周安排 | 默认为工作日工作／周末休息；选人后显示新增、修改、保留数量；缺岗日期使确认不可用并在固定底部提示 |
| 一次确认 | 选未排班人员、全周工作，精确提交七格 `publish:true`，保存请求 1 次；读请求从打开前 1、打开后 2、保存后 3，只刷新一次 |
| 单日保存 | 点击已发布工作格，改休息并填写原因；只提交该格，携带 id/version、清空非工作服务项目；成功一次刷新 |
| 单日零变更 | 原样打开不允许提交；内容未变化的已发布格不因原因不同制造修改 |
| 取消保护 | 有修改点击取消后出现放弃提示；继续编辑保留输入；放弃后关闭且不写入 |
| 跨页选择 | 18 人夹具第 1 页选 1 人，翻第 2 页仍保留；全选第 2 页的 3 人后合计 4 人 |
| 100 人限制 | 101 人夹具完整读取两页；选到 100 后第 101 人禁用，全选超限不扩大范围；修复拒绝全选后控件误显选中的反馈 |
| 默认保留与显式覆盖 | 选已有人员先保留七格；勾选覆盖后只改变有差异的日期及明确选中的草稿，已发布变更要求原因 |
| 保存失败 | `save-error` 第一次请求失败，输入不清除，保存 1／读取 2，不自动重试；手动重试成功后保存 2／读取 3 |
| 版本变化 | `version-error` 返回冲突，保持人员、规则、覆盖选择和原因，未触发额外刷新 |
| 加载失败 | `load-error` 打开表单读取失败，明确错误且禁确认；重试成功恢复人员与规则 |
| 无发布权限 | `no-publish` 不展示“安排本周”，未排班格禁用，已有格只打开详情 |
| 工单冲突 | `conflict` 中将维修工单日期改休息，显示人员、日期、WO-81，确认禁用 |
| 列表一致性 | 列表只保留“安排本周”，行编辑进入相同“单日调整”，详情入口保留 |
| 英文／深色 | 新周表和表单文案正常、七日选项和底部按钮可见；旧搜索／列表部分中文为既有现状 |
| 长表单 | 内容区域滚动，标题及确认／取消固定；变更明细折叠展开后不增加第二个业务弹窗 |

### 截图

- [主周表](week-board.png)
- [整周表单](week-form.png)
- [精确影响明细](week-impact.png)
- [单日冲突提示](day-conflict.png)
- [英文深色](week-dark-en.png)

## 验证边界

- 本轮未向真实业务数据提交排班，也未重放用户之前的 502 请求。
- 尝试只读打开本机 9010 的排班路由，当前浏览器未呈现可验收的业务页（仅通知容器）；未将该尝试记为真实账号验收。后端及登录状态未在本轮调整。
- 正式岗位权限、真实 MySQL 并发、共享环境、实际工作视角切换／刷新离开、完整筛选组合仍待环境验收。模型已覆盖无新增／无编辑／无批量／无发布权限；不将模型覆盖误写为真实岗位验证。
- 保留无关客户、服务人员小程序和其他文档的并发改动；无外部知识库访问。

## 原有失败名称

以下名称与前序检查逐项一致，未在本任务中扩大范围修复：

- a busy form blocks leaving the dashboard for another business page
- a busy form refuses perspective switching without clearing tabs
- a later route guard failure restores the original perspective and preserves tabs for retry
- a pending external form confirmation keeps the current view and tabs until its rejection
- a rejected navigation preserves tabs and allows retry after reporting the error
- accepted work perspective switching applies the new view only after the form agrees
- business create and edit forms use the shared dialog shell
- cancelled work perspective switching leaves the current home and form mounted
- catalog uploads use the official Gaia access and download addresses
- category detail shows readable ancestry and never exposes a raw parent ID as its name
- customer-service dispatch keeps station assignment while station page is wired for personnel assignment
- editable controls in shared business form dialogs provide placeholders
- installation code API permission is independent from purchase record permission and missing grants fail closed
- installation code list failure exposes retry without repeating successful permission requests
- installation code page retries permission initialization before requesting business data
- installation code search, paging and reset query once and preserve the applied keyword
- inventory stock range uses a complete non-clearable select instead of a switch
- inventory tabs only expose readable views and keep the active view in the route
- network master lists prioritize names and operational context
- page tabs use the shared lightweight visual hierarchy
- privacy, permission, and action-impact guidance remains contextual
- raw view dialogs are limited to reviewed non-standard interaction models
- real payloads whitelist fields and preserve false filters and optimistic versions
- redirecting a perspective switch to access status does not clear old tabs
- repeated switch commands while confirmation is pending commit only the first destination
- returning to the root home through the Logo path does not clear same-view tabs
- same-route query updates also respect cancellation without replacing the form
- selecting the current perspective leaves all tabs intact
- tests/catalog-state.test.ts
- tests/i18n.test.ts
