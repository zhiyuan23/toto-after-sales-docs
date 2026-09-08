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
- `frontend/gaia-ui`：统一管理后台和代理商工作台，共用“TOTO 售后服务”一级顶部菜单；目录与命名见 `02-技术设计/03-gaia-ui目录与菜单设计.md`。
- `frontend/gaia-ui/src/views/common`：公共页面子仓库；只有用户单独明确授权修改和提交 `common` 时才能操作，不得随 `gaia-ui` 或跨仓任务一起提交。
- `backend/gaia-saas-proj`：业务 API 聚合与运行宿主；可以按已确认功能范围修改，但只有用户明确要求提交时才能执行 `git commit`。

仓库级操作继续遵循对应仓库自己的 `AGENTS.md`。开始开发前检查分支、远端差异和未提交改动并完整保留；跨仓范围、功能契约和验证记录以本目录文档为准。菜单骨架默认隐藏，业务切片通过验收前不得标记为已开放。

## Web 功能开发：新版通用组件与样式

- 开发或修改 `gaia-ui` 售后功能前，先读 [UI 样式规范](02-技术设计/05-gaia-ui售后服务UI样式规范.md)、[commonV2 组件说明](../../frontend/gaia-ui/src/components/commonV2/README.md)和 [AI 开发执行规范](03-开发管理/03-AI开发执行规范.md)中的 Web UI 约束。
- 售后功能开发默认使用 `src/components/commonV2/`，从目录入口按需导入 `Common*` 组件。全部功能页（含工作台、流程、配置和隐藏／上下文页）使用 `CommonPageMain` 整体白卡；标准列表按 `CommonSearch → CommonListToolbar → CommonTable / CommonPagination` 组合，采用 `CommonPageMain layout="list"` 与 `CommonTable fill` 撑满剩余高度，表体内部滚动、分页留在底部；不放独立刷新按钮，保留业务动作后自动更新与失败重试。
- 筛选标签与输入控件横向排列，筛选与表格之间的虚线由 `CommonSearch` 提供。普通列表不得恢复为纵向标签、筛选卡＋表格卡或页面自行编写的一套 CRUD 样式；具体尺寸以 UI 规范和组件实现为准。
- 表单弹窗和行操作复用 `CommonFormDialog`、`CommonRowActions` 及删除确认工具。组件暂不覆盖的业务交互可在页面实现；可复用的视觉能力在 `commonV2` 中补充，不复制整套组件或引入第二套样式体系。
- 后续功能涉及列表查询、分页、刷新或新增／编辑弹窗时，默认复用 `src/hooks/commonV2/` 的 `useListPage` / `useCrudDialog`，先读[商品档案开发范例](../../frontend/gaia-ui/src/views/afterSales/catalog/product/README.md)和[公共方法契约](../../frontend/gaia-ui/src/hooks/commonV2/README.md)。沿用功能目录内 `index.vue + components + model + schemas` 的职责划分，按需建文件；不要复制查询／弹窗状态逻辑或示例内存数据源。
- 商品分类与商品档案已实现首版真实 API 和前端装配，当前完成隔离环境验证，共享 MySQL／正式菜单角色仍待联调。接入真实功能时继续使用 Gaia 的请求、权限与动态路由体系，在 `src/api/afterSales/` 按已确认契约适配请求和响应；不得照搬示例校验、虚构接口路径或将示例动作当作权限默认值。
- 样式和浮层保持 `.common-v2` / `--cv2-*` 隔离，不修改全局主题、其他业务模块或受保护的 `src/views/common`。业务 API、权限、状态机和数据范围由业务切片负责，不能用通用 CRUD 绕过。
- 交付前核对新版组件使用、页面结构、筛选／分页行为、浮层隔离和桌面显示；修改通用组件时运行其现有测试并回归受影响页面。用户已明确的页面要求优先，普通实现细节无需另行等待样式批准。

## 后端功能开发

- 开发售后后端前先读 [后端开发规范](02-技术设计/06-售后后端开发规范.md)及对应功能 Spec，复用已验证的 API/AppService/model/service/mapper 分层和 Gaia 响应、租户、权限、事务机制。
- 先核对权威主档和实际数据库列类型，按字段白名单复用；扩展字段单独保存，不整行覆盖、不自动改表、不复制共享主档。具体并发和状态规则由各业务负责。
- 接口契约、迁移、权限、审计和测试随功能实现交付；隔离验证与共享环境验收分开记录。首版参考商品分类/商品档案源码，不复制其专属锁策略或测试身份。
- 用户已确认本项目当前不需要专项检查移动端/窄屏样式适配，以桌面管理后台验收为准；保留组件已有响应式行为。
