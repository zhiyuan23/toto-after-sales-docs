---
type: llm-wiki-operation
topic: TOTO售后服务
status: active
updated: "2026-10-22"
owner: shared
confidence: high
belongs_to:
  - kb:project:toto-after-sales-docs
sources:
  - "2026-10-22 按用户确认重排开发管理目录并修正引用；内容与业务状态保持，稳定ID不变。"
  - 用户授权：2026-10-14 保留 TOTO 现有目录，统一 LLM Wiki 格式，适配校验与文档生成，确保团队独立使用项目文档。
  - ../../.llm-wiki.json
  - ../../scripts/knowledge-base-core.mjs
  - ../../scripts/validate-knowledge-base.mjs
  - ../../scripts/build-delivery-docs.mjs
tags:
  - llm-wiki
  - TOTO
  - 知识治理
schema_version: 2
id: kb:operation:toto-wiki-maintenance
created: 2026-10-14
sensitivity: internal
---

# TOTO LLM Wiki 文档维护规范

## 1. 事实归属与入口

本仓库独立维护项目需求、技术契约、进度、流程、Spec 和交付说明，保留现有路径。[项目概览](../../00-项目资料/01-项目概览与范围.md)是仓库知识主节点，稳定 ID 为 `kb:project:toto-after-sales-docs`；[README](../../README.md)继续作为开发导航。

团队成员从本仓库开始工作，按任务阅读需求、技术设计与 Spec，再进入对应源码仓库。项目约定和工具均随本仓库分发。

## 2. 格式与业务状态

正式知识使用 Schema v2：`type`、`topic`、`status`、`updated`、`owner`、`confidence`、`sources`、`tags`、`schema_version`、`id`、`created`、`sensitivity`。支持扁平 YAML、简单标量与单层列表；文件头必须位于文件最前面，正文和更新说明放在结束的 `---` 之后。

本仓库文档由团队共同维护，已有文件头和新建页面统一使用 `owner: shared`。该字段表示知识维护归属，不改变 Git 作者、提交者、访问权限或业务责任人。

`status` 仅使用 `draft / active / deprecated`，表示知识页面生命周期。业务 Spec 的草稿、确认、开发、部署、真机和验收状态继续在正文独立维护。格式整理、结构通过和构建成功均不代表业务已确认或已验收。

稳定 ID 分配后不因移动或改名重算；保留已有 16 个 ID，新增 ID 由准备工具分配后写入文件。仓库内关系使用本仓库稳定 ID，并由本仓库独立解析和校验。

`updated` 记录实际编辑或审阅日期；本次格式整理采用 2026-10-14，不声明全部业务已经重新验证。新增页面的 `created` 优先沿用 Git 首次加入日期，无法取得时记录知识页面创建日期。`confidence` 和 `sensitivity` 必须按证据与内容选择；新增页面默认 medium/internal，需要维护者核对。账号说明归 private；敏感度字段不是访问控制，秘密值仍不得进入 Git。

`sources` 保留原始材料与可复核出处；批量整理的来源说明只表明既有仓库原文，不能代替新结论的需求确认、源码或验证证据。后续实质更新时补齐直接来源。

## 3. 索引范围

范围由[配置](../../.llm-wiki.json)唯一维护：项目资料、需求、技术设计、开发管理、原型说明、业务流程、交付 Markdown、有效 Spec，以及 README、本地联调和设计检查说明。

原始摘录、`specs/evidence/`、`specs/support/`、Spec 模板、内部汇报副本、运行产物和 Agent 指令不进入默认正式知识校验。它们仍可通过正文链接访问。`99-归档/` 不进入当前范围；其中已有身份的历史页面仅参与关系目标解析，不能作为当前项目结论。排除目录不是丢弃证据。

保持 `README.md`、`design-qa.md` 的既有同名文件；配置仅允许这两个名称重复。链接使用明确路径，不能依赖同名标题或文件名猜测目标。

## 4. 新建、维护与校验

普通知识页先放入对应目录，再执行 `prepare-wiki-page.mjs <仓库相对路径>`。功能 Spec 先查已有契约，确需新建时显式指定分类：

```bash
node scripts/create-spec.mjs --category 03 --name 功能名称
node scripts/validate-knowledge-base.mjs --kb-root .
git diff --check
```

准备工具只给范围内、尚无文件头的页面分配元数据，不覆盖已有文件头，遇到无效文件头或错误 Spec 分类路径直接报错。Spec 创建工具使用[模板](../../specs/_template.md)并添加独立 ID；手动复制也必须放入分类并运行准备工具，根据真实确认状态填写正文并完善 sources。

校验使用本仓库的 LLM Wiki 解析与字段规则，支持自定义目录发现、零文件失败、明确同名例外和历史身份解析，无需安装额外 npm 包。规则变更时对比差异并运行测试，保留项目目录适配。

校验覆盖文件头、必填字段、ID、日期、类型关系、来源路径和 Markdown 相对路径。HTTP 来源可达性、所有章节锚点、业务事实和平台行为仍须按实际任务验证。

文档仓库可单独检出；校验和新建文档工具随仓库提供。默认校验中，未检出的 `backend / frontend / mobile` 跨仓源码引用按配置提示 `unavailable_workspace_reference`，不把它们混同于项目内部断链；内部文档路径、未知外部路径和身份关系错误仍使校验失败。关联源码检出后执行 `node scripts/validate-knowledge-base.mjs --kb-root . --strict-workspace-links`，严格确认源码路径。业务开发所需的源码仓库与环境要求保持。

## 5. 交付网页

[生成器](../../scripts/build-delivery-docs.mjs)在提取标题和渲染正文前剥离并校验文件头，沿用原目录、章节、样式和链接映射。

```bash
node scripts/build-delivery-docs.mjs
# 只验证生成结果，不覆盖当前页面：
node scripts/build-delivery-docs.mjs --output-root .local/verification-artifacts/delivery-preview
node --test scripts/llm-wiki.test.mjs
```

生成器沿用项目既有 marked 依赖入口；未安装时设置 `MARKED_MODULE` 指向可用 ESM 模块，见[交付说明](../../06-项目交付/README.md)。临时生成结果、原始检查日志及备份保存在 `.local/verification-artifacts/`，不纳入正常提交。

## 6. 后续维护与恢复

重要功能、业务决策和阶段交付更新本仓库对应事实页，完整需求、技术契约、Spec、进度和证据保持各自职责，不建立平行事实副本。

当前有效文档使用原目录维护；历史文件保留身份并标记状态，通过项目内来源和相对路径追溯。恢复时以 Git 历史或受控备份为依据，只恢复选定内容，重新检查 ID 与链接，不覆盖其他会话改动。

## 7. 本次验证记录（2026-10-14）

- 236 篇带文件头的项目文档（含 1 篇历史页面）统一使用 `owner: shared`。
- 本仓库 235 篇正式知识页面格式、ID、关系和相对路径校验通过；格式转换不改变业务契约和验收计数。
- 12 项目录适配与正文处理测试、32 项 Schema 解析／字段规则兼容测试和 9 项文档影响测试均通过，累计 53 项。
- 11 个交付 HTML 在新增文件头前后逐字节一致；正常重新生成时，门店手册 HTML 补齐其 Markdown 已有的购买列表说明。
- 仅复制项目文件到隔离目录，235 篇页面通过、0 错误；尚未检出的 132 处跨仓源码引用按配置提示。当前完整工作区的 `--strict-workspace-links` 通过、0 提示。
- 开发入口、完整需求、Spec 与工具均在本仓库提供；实际业务开发仍需准备对应源码和运行环境。验证不代表业务验收、提交、推送或部署。

本次调整属于文档格式、团队维护归属及知识工具适配，未改变售后业务功能或运行行为，按版本维护规范不提升业务版本。

## 分类 Spec 与校验入口

[Spec 导航与生成规则](../../specs/README.md#spec-generation) 是新建功能文档的唯一分类说明；`.spec-layout.json` 是机器可读布局来源。`create-spec.mjs` 强制显式分类并防止覆盖，`prepare-wiki-page.mjs` 拒绝根目录或未登记分类的功能 Spec，`validate-knowledge-base.mjs` 检查同一布局（不受正文扫描排除项影响）。根目录只保留 README 与模板，支持目录仅用于图片、证据、SQL 与辅助材料。

使用 `npm run docs:check` 校验，`npm run test:docs` 验证文档工具。安装的本仓库 pre-commit Hook 在文档影响检查之前运行知识与布局校验；尚未安装 Hook 的工作区仍须主动运行检查。移动或拆分保留原页面 ID，新页面生成独立 ID；本次版本总索引保留原版本文档 ID，月度页承接完整记录并分别持有新 ID。
