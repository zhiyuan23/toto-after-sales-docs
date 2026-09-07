# TOTO 售后服务项目上下文

本目录是 TOTO 售后服务的跨仓项目入口，不是独立 Git 仓库。进入本目录处理任务时，先读 [开发工作区](README.md)和[开发进度与下一步](03-开发管理/00-开发进度与下一步.md)，再按任务范围进入对应仓库。

## 知识与需求入口

- Canonical 项目知识位于 `/Users/snow/Library/Mobile Documents/com~apple~CloudDocs/knowledge-base/20-Projects/蓝鲸数字/TOTO售后服务/`，稳定 ID 为 `kb:project:toto-after-sales-service`。
- 工作区已在 [`00-项目资料/`](00-项目资料/) 摘录开发必需的项目、仓库和技术信息；需要历史依据或长期关系时再读取知识库。
- 完整需求基线位于 [`01-功能需求/00-功能纵览.md`](01-功能需求/00-功能纵览.md)，技术设计位于 [`02-技术设计/`](02-技术设计/)，功能 Spec 位于 [`specs/`](specs/)。
- 当前源码与配置决定已实现行为；已确认 Spec 决定目标行为。冲突时先核实事实时点，不用旧文档覆盖源码，也不从源码反推未确认业务规则。
- 持久知识修改按 `kb-maintainer` 处理。功能进度、功能 Spec、验收证据和临时实施信息保留在本目录，只有经确认的长期结论、关系或事实变化才同步知识库。

## 工作区范围

- `backend/gaia-after-sales`：售后领域、管理端 API 和小程序 API。
- `mobile/gaia-after-sales-uni`：原 TOTO 售后小程序与 H5。
- `mobile/gaia-customer-service-uni`：“TOTO客服助手”计划仓库，当前尚未创建；没有已确认 Spec 时不得虚构技术基线和业务功能。
- `frontend/gaia-ui`：售后管理页面和权限适配。
- `frontend/gaia-ui/src/views/common`：公共页面子仓库；只有用户单独明确授权修改和提交 `common` 时才能操作，不得随 `gaia-ui` 或跨仓任务一起提交。
- `backend/gaia-saas-proj`：业务 API 聚合与运行宿主；可以按已确认功能范围修改，但只有用户明确要求提交时才能执行 `git commit`。

仓库级操作继续遵循对应仓库自己的 `AGENTS.md`。开始开发前检查分支、远端差异和未提交改动并完整保留；跨仓范围、功能契约和验证记录以本目录文档为准。菜单骨架默认隐藏，业务切片通过验收前不得标记为已开放。
