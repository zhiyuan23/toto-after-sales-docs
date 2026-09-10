# gaia-ui 售后独立子系统 UI 与前端复用规范

- 更新日期：2026-09-10
- 适用范围：`gaia-ui/apps/after-sales`
- 当前基线：已开发的独立子系统“商品分类”功能

## 1. 开发位置与适用边界

后续 Web 售后功能默认在 `gaia-ui/apps/after-sales` 开发，使用子系统自身的路由、页面、通用组件、composables 和 API 适配层。除非用户明确要求维护旧入口，不再把新功能实现到主系统 `src/views/afterSales` 或 `src/components/commonV2` 中。

主系统旧售后页面及 `commonV2` 仅作 legacy 实现保留，不再是子系统新页面的开发基线。子系统不复制 `commonV2`，不运行时导入主系统源码，不修改受保护的 `src/views/common`。

## 2. 标准功能范例

标准列表和表单功能以以下已实现代码为首要参考：

- 页面：`apps/after-sales/src/views/catalog/category/index.vue`
- 表单弹窗：`apps/after-sales/src/views/catalog/category/components/CategoryFormDialog.vue`
- 模型和映射：`apps/after-sales/src/views/catalog/category/model/`
- 筛选与表格配置：`apps/after-sales/src/views/catalog/category/schemas/`
- 列表方法：`apps/after-sales/src/composables/useListPage.ts`
- 弹窗方法：`apps/after-sales/src/composables/useCrudDialog.ts`

范例用于复用页面结构、状态处理和交互模式，不表示可复制商品分类的字段、校验、接口、权限码、引用规则或启停规则。

## 3. 通用页面结构

标准列表页默认使用：

```text
FaPageMain
├── EsSearch
├── EsListToolbar（存在已授权页面操作时）
├── 错误／业务提示及重试入口
└── EsTable（包含表格、行操作和可选分页）
```

- 页面使用 `FaPageMain` 填满子系统宿主剩余高度。
- 标准列表页必须建立连续高度链：页面根容器使用宿主可用视口高度并设置 `min-height: 0`，`FaPageMain` 内容区及 `EsTable` 直接父层使用 `flex: 1` 和 `min-height: 0`。表格在剩余空间内撑满并内部滚动，分页固定在底部；即使列表为空或加载中也不能按内容高度收缩，业务页不得写死像素表格高度。
- 筛选使用 `EsSearch`，不在功能页重新实现同类筛选容器、展开收起或重置逻辑。
- 页面操作使用 `EsListToolbar`；无已授权操作时不渲染空工具栏。
- 列表、树表、行操作和分页优先使用 `EsTable`，页面只提供列配置、业务数据和已授权操作。
- 列表页不设独立刷新按钮；保存、启停等操作成功后刷新，失败时保留明确重试入口。
- 未接真实接口时显示未接入状态，不伪造列表、总数、分页或可执行操作。

## 4. 通用组件与方法复用

| 层级 | 默认职责 |
| --- | --- |
| `components/common/EsSearch` | 筛选字段配置、默认值、展开/收起、筛选和重置事件 |
| `components/common/EsListToolbar` | 页面级新增、批量等操作容器 |
| `components/common/EsTable` | 列表/树表展示、加载、空状态、行操作、分页 |
| `composables/useListPage` | 筛选草稿与已应用快照、页码、列表、loading/error、刷新、请求取消与过期响应隔离、删除后页码修正 |
| `composables/useCrudDialog` | 新增/编辑模式、独立表单模型、dirty、互斥提交、失败保留和成功关闭 |
| 功能 `index.vue` | 页面装配、权限初始化、业务事件协调及操作后刷新 |
| 功能 `components/` | 专属表单弹窗和复杂业务交互 |
| 功能 `model/` | 类型、默认值、详情回填、查询归一化和提交字段白名单 |
| 功能 `schemas/` | 筛选项和表格列配置 |
| `api/<domain>/` | 按真实契约处理请求、业务错误、响应适配和 `AbortSignal` |

- 已有通用能力能满足时必须直接复用，不在业务页复制查询、分页、弹窗状态或行操作框架。
- 确有多功能可复用的缺失能力时，最小扩展子系统现有通用组件或 composable，并补充针对性测试；业务专属逻辑保留在功能目录。
- `useListPage` 不自动请求、不推断 API 或权限；`useCrudDialog` 不承担业务校验和传输。
- 表单使用默认值工厂和 mapper 创建副本，不直接编辑列表行。校验与保存在业务功能内完成；提交失败保留输入，提交中禁止重复提交和关闭。

## 5. 查询、权限与业务边界

- 筛选和重置回到第 1 页，分页使用已应用的筛选快照；一次用户操作只发起一次查询。
- 请求取消和过期响应隔离用于防止旧数据回写，不能替代后端权限和数据隔离。
- 页面先获取真实领域权限；`read=false` 时不请求业务列表。页面操作按权限显示，行操作以后端返回的 `actions` 为准。
- 前端不推断角色、不复制数据范围或状态机，不把隐藏按钮当作授权。
- 租户、组织、门店、服务站或用户上下文变化时，先清理旧列表、选择、详情和表单，再在新权限确认后加载。
- 状态迁移、引用限制、并发版本和提交字段白名单仍按各功能契约实现，不因复用通用 CRUD 能力而放宽。

## 6. 视觉与样式维护

- 子系统页面沿用已有 `FaPageMain`、`EsSearch`、`EsListToolbar`、`EsTable`、Element Plus 和子系统现有主题，不引入第二套 UI 体系。
- 通用视觉问题在现有通用组件中修复，不在多个页面重复覆盖；业务专属样式保留在对应功能目录。
- 不修改主系统全局主题或无关业务模块，不为单页视觉差异复制整套组件。
- 当前以桌面管理后台为验收目标，保留现有响应式能力，不做移动端/窄屏专项验收。

## 7. 验证要求

- 新页面至少覆盖查询、筛选、重置、分页（如适用）、空状态、加载失败和重试。
- 写操作覆盖权限展示、校验、重复提交保护、失败保留、未保存确认及成功后刷新。
- 修改通用组件或 composable 时，运行其现有测试并回归商品分类及其他受影响页面。
- 按影响范围执行子系统定向测试、类型检查、生产构建和必要的桌面交互验证；标准列表页需同时检查有数据、空数据和加载状态下表格撑满剩余高度、内部滚动及底部分页位置。
- 隔离数据或构建通过不等于共享 MySQL、真实租户和正式角色验收完成，必须分开记录。
