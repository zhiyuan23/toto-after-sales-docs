# TOTO 售后服务项目上下文

本目录是 TOTO 售后服务的跨仓项目入口，不是独立 Git 仓库。进入本目录处理任务时，先读 [开发工作区](README.md)和[开发进度与下一步](03-开发管理/00-开发进度与下一步.md)，再按任务范围进入对应仓库。

## 知识与需求入口

- 当前仓库中的 TOTO 项目文档是对话和任务执行的默认、完整项目上下文；优先使用本目录文档、对应功能 Spec、源码和配置查明事实。
- 外部知识库位置为 `/Users/snow/Library/Mobile Documents/com~apple~CloudDocs/knowledge-base/20-Projects/蓝鲸数字/TOTO售后服务/`，稳定 ID 为 `kb:project:toto-after-sales-service`。除非用户在当前任务中手动、明确要求查询或维护知识库，否则不得自动读取、检索或核验其中的文档，也不得因需要历史依据、长期关系或任务收尾检查而自行访问。
- 完整需求基线位于 [`01-功能需求/00-功能纵览.md`](01-功能需求/00-功能纵览.md)，技术设计位于 [`02-技术设计/`](02-技术设计/)，功能 Spec 位于 [`specs/`](specs/)。
- 当前源码与配置决定已实现行为；已确认 Spec 决定目标行为。冲突时先核实事实时点，不用旧文档覆盖源码，也不从源码反推未确认业务规则。
- 功能进度、功能 Spec、验收证据和实施信息均保留在本目录。只有用户明确要求维护外部知识库时，才按 `kb-maintainer` 处理，不自动同步。

## 工作区范围

- `backend/gaia-after-sales`：售后领域、管理端 API 和小程序 API。
- `mobile/gaia-after-sales-uni`：原 TOTO 售后小程序与 H5。
- `mobile/gaia-customer-service-uni`：“TOTO客服助手”计划仓库，当前尚未创建；没有已确认 Spec 时不得虚构技术基线和业务功能。
- `frontend/gaia-ui`：售后 Web 默认在同仓独立子系统 `apps/after-sales` 开发，复用 Gaia 认证、菜单、权限与租户体系；主系统 `src/views/afterSales` 为 legacy 保留入口。
- `frontend/gaia-ui/src/views/common`：公共页面子仓库；只有用户单独明确授权修改和提交 `common` 时才能操作，不得随 `gaia-ui` 或跨仓任务一起提交。
- `backend/gaia-saas-proj`：业务 API 聚合与运行宿主；可以按已确认功能范围修改，但只有用户明确要求提交时才能执行 `git commit`。

仓库级操作继续遵循对应仓库自己的 `AGENTS.md`。开始开发前检查分支、远端差异和未提交改动并完整保留；跨仓范围、功能契约和验证记录以本目录文档为准。菜单骨架默认隐藏，业务切片通过验收前不得标记为已开放。

## Web 功能开发：独立子系统通用基线

- 后续 Web 售后功能默认在 `gaia-ui/apps/after-sales` 开发；除非用户明确要求 legacy 维护，不再向主系统 `src/views/afterSales` 和 `src/components/commonV2` 增加功能。
- 开发前先读 [独立子系统 UI 与前端复用规范](02-技术设计/05-gaia-ui售后服务UI样式规范.md)、[AI 开发执行规范](03-开发管理/03-AI开发执行规范.md)和 `apps/after-sales/README.md`。
- 以独立子系统已开发的“商品分类”为标准功能范例，复用 `FaPageMain`、`EsSearch`、`EsListToolbar`、`EsTable`、Element Plus 及 `useListPage` / `useCrudDialog`。
- 功能目录沿用 `index.vue + components + model + schemas` 职责划分；查询、分页、过期响应隔离、弹窗状态和重复提交保护优先复用子系统现有通用方法，不在业务页重复实现。
- 通用组件和 composable 不推断 API、权限、数据范围或状态机。业务字段、校验、提交白名单、状态迁移和后端 `actions` 仍按对应功能契约实现，不照搬商品分类业务规则。
- 通用能力缺失时，在子系统已有通用组件或 composable 中做最小扩展并补充测试；不复制 `commonV2`、不运行时导入主系统源码，不引入第二套 CRUD/UI 体系。
- 交付前检查筛选／重置／分页的单次查询、权限展示、失败重试、提交状态和桌面显示；修改通用组件时运行其现有测试并回归商品分类及其他受影响页面。

## 后端功能开发

- 开发售后后端前先读 [后端开发规范](02-技术设计/06-售后后端开发规范.md)及对应功能 Spec，复用已验证的 API/AppService/model/service/mapper 分层和 Gaia 响应、租户、权限、事务机制。
- 先核对权威主档和实际数据库列类型，按字段白名单复用；扩展字段单独保存，不整行覆盖、不自动改表、不复制共享主档。具体并发和状态规则由各业务负责。
- 接口契约、迁移、权限、审计和测试随功能实现交付；隔离验证与共享环境验收分开记录。首版参考商品分类/商品档案源码，不复制其专属锁策略或测试身份。
- 用户已确认本项目当前不需要专项检查移动端/窄屏样式适配，以桌面管理后台验收为准；保留组件已有响应式行为。
