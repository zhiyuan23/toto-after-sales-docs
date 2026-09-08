# gaia-ui 售后服务 UI 样式规范

- 更新日期：2026-09-08
- 当前状态：新版通用组件 `commonV2` 已应用全部售后页面入口；业务接口和功能验收仍待接入。
- 最新依据：用户指定的 [Compass 商品页](https://compass.gaoge.cc/product/catalog/products) 与对应 `gaoge-compass/apps/admin` 底座源码。以下规则替代上一轮纵向筛选标签、筛选卡＋表格卡的方案。

## 1. 页面结构

所有售后功能页采用 `src/components/commonV2/CommonPageMain.vue` 整体白卡，外距 16px、内距 20px、圆角 8px、边框 1px `#e4e4e7`。白卡铺满内容宽度，并适配 Gaia 内容滚动区域高度；不修改宿主布局和全局样式。

标准列表结构固定为：

```text
CommonPageMain（整体白卡）
├── CommonSearch（横向标签与控件，内置虚线）
├── CommonListToolbar（新增／批量操作，按权限提供）
└── CommonTable
    └── CommonPagination（有真实分页数据时）
```

普通列表不再为筛选和表格各套一张卡片，不在内容顶部重复展示装饰页头。看板、流程、配置和隐藏上下文页面也使用同一整体卡片，内部按页面语义组织；只有独立业务分区才使用 `CommonCard`。

## 2. 筛选

- 标签与输入框横排，间距 8px；标签 14px、行高 36px、最多 6em，超长省略并保留完整 title 和控件关联标签。
- 网格最小列宽 280px，行间距 12px、列间距 32px；默认显示前两项，其余通过展开／收起显示。窄屏网格单列，标签仍在控件左侧。
- 筛选控件 36px 高、4px 圆角；按钮 36px 高、6px 圆角，顺序为重置、筛选、展开。按钮组靠右。
- 虚线由 `CommonSearch` 内置：1px dashed，上下 16px、左右延伸 16px。页面不要重复实现分隔线或另套浅灰筛选卡。
- 页面持有筛选草稿和已应用快照。筛选回第 1 页，分页使用已应用条件；重置只触发一次查询意图。收起后保留条件，可提示已应用高级条件数量。输入法组合输入的 Enter 不提交。

## 3. 表格、操作与分页

- 操作栏无额外背景、边框或内距，与表格间距 16px；新增使用 Element Plus primary plain，32px 高。
- 表格默认细网格、浅色斑马纹；白色表头，标题灰色 `#909399`、14px / 600。单行 40px，单元格 padding 为 0，内容横向内距 12px、行高 23px，多行内容自然增高。
- 行操作按钮 32px、间距 8px、圆角 6px，普通编辑／删除保持中性色图标。1 项操作列 56px，2 项或“首项＋更多”96px；没有可见动作时隐藏操作列。业务页传入已授权动作，不在通用组件推断权限。
- 分页距表格 16px，整组靠右，控件 32px；默认选项 15 / 30 / 50 / 100，可配置。切换条数回第 1 页，只发一次 `change`。700px 以下隐藏条数与跳页、保留基本翻页。
- 未接真实数据的页面显示未接入状态，筛选禁用，不伪造列、统计总数、分页或可执行 CRUD 按钮。加载失败、空结果和未接入必须区分。

## 4. 表单与确认

- `CommonFormDialog` 默认宽度 640px，可按字段规模调整；使用底座原生 Element Plus 弹窗视觉：4px 圆角、16px 内距、表头／页脚不额外加边框。
- 标准表单标签横排，控件默认 34px；双列间距 16px，窄屏单列，长文本占整行。复杂商品弹窗的 980px 属于具体业务规模，不作为所有表单默认值。
- 校验和请求由业务页执行，成功后关闭；失败保留数据。提交中禁止重复提交与关闭。`beforeClose(done)` 用于未保存确认。
- 删除确认明确对象名，通用工具只确认、不执行请求。真实权限、删除约束和接口失败由业务切片验收。

## 5. 命名、复用与隔离

采用独立目录 `src/components/commonV2/`，组件使用 `Common*` 命名，表明新版通用组件身份。Gaoge 仅作为来源说明，不作为目录或组件品牌。

通用组件包括 `CommonPageMain`、`CommonCard`、`CommonSearch`、`CommonListToolbar`、`CommonTable`、`CommonPagination`、`CommonRowActions`、`CommonFormDialog` 和 `confirmDelete`。从目录 `index.ts` 按需导入；接口、权限、字段和业务流程不抽进通用样式组件。

所有选择器及变量限定 `.common-v2` 和 `--cv2-*`。Teleport 下拉、日期、Tooltip 使用 `popper-class="common-v2 common-v2-popper"`，确认框使用 `customClass: 'common-v2 cv2-confirm'`；业务自建表单浮层也需采用同一约定。深色通过 Gaia `[data-theme='dark']` 接入。

不得改动全局 reset、全局 Element Plus 主题、其他业务模块或受保护的 `src/views/common`。保留现有技术栈与图标体系，不为视觉迁移引入 UnoCSS、Pinia/RBAC 或底座业务 API。

## 6. 当前覆盖与验收

49 个功能页、10 个分组落地页、1 个售后根页、3 个隐藏／上下文页接入整体白卡：商品分类、商品档案直接装配 `CommonPageMain` 和通用列表组件，其余当前页面通过共享 `FeaturePage`、`LandingPage`、`HiddenFlowPage` 接入。商品与服务 6 页统一使用横向筛选＋虚线＋结果区域。菜单、权限、隐藏状态、业务完成数保持原口径。

组件契约与运行命令见 [commonV2 使用说明](../../../frontend/gaia-ui/src/components/commonV2/README.md)。本地示例仅内存数据，不连接真实 API，不进入生产默认构建入口。测试、类型检查、构建、浏览器检查与未验边界记录在[阶段验收记录](../specs/2026-09-07-第一阶段菜单路由与页面UI架构.md)。后续业务切片仍需验证接口、权限、并发、租户数据隔离及真实失败状态。

商品档案现已作为公共方法与目录组织的[开发范例](../../../frontend/gaia-ui/src/views/afterSales/catalog/product/README.md)，配套 `src/hooks/commonV2/useListPage` / `useCrudDialog`。后续涉及列表和弹窗的功能按 [AI 开发执行规范](../03-开发管理/03-AI开发执行规范.md)复用；商品档案的内存交互示例需在 DEV 环境手动开启，不能作为真实商品业务验收。

## 7. 首版真实业务与当前验收范围

商品分类/商品档案已接入真实 API，分类扩展 CommonTable 的 treeProps/defaultExpandAll，商品采用标准分页；列表、弹窗、字段白名单与错误处理继续复用既有规范。旧内存示例只作测试夹具，没有正式页面入口。后端规范与当前验证边界见 [后端开发规范](06-售后后端开发规范.md)和[功能 Spec](../specs/2026-09-08-商品分类与商品档案全栈首版.md)。

用户于 2026-09-08 明确：本项目当前不需要专项检查移动端样式适配。此要求覆盖本文此前涉及窄屏专项验收的安排；已有响应式样式保留，当前交付聚焦桌面功能与视觉。
