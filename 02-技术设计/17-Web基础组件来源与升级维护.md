---
type: "llm-wiki-system-context"
topic: "TOTO售后服务"
status: "active"
updated: "2026-10-20"
owner: "shared"
confidence: "medium"
belongs_to:
  - "kb:project:toto-after-sales-docs"
sources:
  - "../specs/2026-10-15-Web公共组件与阅读交互优化.md#list-display-fixes-20261020"
  - "2026-10-20 用户要求：将本轮视觉升级迁入CRM，通用规则更新知识库，并在后续底座Git提交时提醒同步。"
  - "2026-10-20 用户确认：组件来源与本地适配信息集中维护到TOTO项目文档，源码只保留README入口和许可。"
  - "../specs/2026-10-15-Web公共组件与阅读交互优化.md#fa-foundation-product-20261020"
  - "../specs/2026-10-15-Web公共组件与阅读交互优化.md#fa-foundation-closeout-20261020"
  - "../../../frontend/gaia-ui/apps/after-sales/README.md"
  - "../../../frontend/gaia-ui/apps/after-sales/src/ui/FA-LICENSE"
tags:
  - "llm-wiki"
  - "TOTO"
  - "02-技术设计"
schema_version: "2"
id: "kb:project:toto-doc-fb02d33840106229"
created: "2026-10-20"
sensitivity: "internal"
---

# Web 基础组件来源与升级维护

- 适用范围：`gaia-ui/apps/after-sales/src/ui`，仅为独立售后 Web 子系统。
- 来源基线与映射核对日期：2026-10-20。
- 本文集中维护上游版本、文件映射、本地适配与升级核对事项；组件源码不重复添加 `Source / Local` 追踪文件头。解释特殊逻辑、兼容原因、无障碍或安全边界的代码注释继续保留。
- 本次升级过程及研发验证见[Web 公共组件与阅读交互优化](../specs/2026-10-15-Web公共组件与阅读交互优化.md#fa-foundation-product-20261020)，后续收尾见[基础风格升级收尾](../specs/2026-10-15-Web公共组件与阅读交互优化.md#fa-foundation-closeout-20261020)。本文不重复维护开发进度或业务验收结果。

## 1. 上游来源与许可位置

| 项目 | 当前基线 |
| --- | --- |
| 上游仓库 | [Fantastic Admin basic](https://github.com/fantastic-admin/basic) |
| 参考提交 | `1b5961ef9b0cdb3f35159582b0abe2862f19bd16`，简称 `1b5961e` |
| 读取／同步日期 | 2026-10-20；不是自动跟随上游 main |
| 上游组件根目录 | `packages/components/src/basic/` |
| 本地组件根目录 | `gaia-ui/apps/after-sales/src/ui/components/` |
| 源码仓库入口 | [售后子系统 README](../../../frontend/gaia-ui/apps/after-sales/README.md) |
| 本地许可文件 | [src/ui/FA-LICENSE](../../../frontend/gaia-ui/apps/after-sales/src/ui/FA-LICENSE)，保留既有 MIT 许可及版权文本 |

来源追踪说明迁入本文，不删除或改写源码仓库已有的版权、许可文件和必要声明。本文及 Spec 不能代替随源码保留的许可文件。后续单独交付、复制组件时，继续携带相应许可材料。

## 2. 组件文件映射

下表完整接收本次移除的 153 处首行来源注释。路径分别相对于上表的本地／上游组件根目录；同一行列出的文件名在两端相同。它记录来源关系，不表示本地源码与上游逐字一致，也不表示未列出的项目组件没有其他历史来源。

例如 `FaButton/button/Button.vue` 对应上游 `packages/components/src/basic/button/button/Button.vue`。`FaPinInput` 对应上游 `input-otp`，保留项目原有名称。

| 本地目录 | 上游目录 | 文件名 | 文件数 |
| --- | --- | --- | ---: |
| `FaAvatar/avatar/` | `avatar/avatar/` | `Avatar.vue`、`AvatarFallback.vue`、`AvatarImage.vue`、`index.ts` | 4 |
| `FaAvatar/` | `avatar/` | `index.vue` | 1 |
| `FaButton/button/` | `button/button/` | `Button.vue`、`index.ts` | 2 |
| `FaButton/` | `button/` | `index.vue` | 1 |
| `FaCard/card/` | `card/card/` | `Card.vue`、`CardContent.vue`、`CardDescription.vue`、`CardFooter.vue`、`CardHeader.vue`、`CardTitle.vue`、`index.ts` | 7 |
| `FaCard/` | `card/` | `index.vue` | 1 |
| `FaCheckbox/checkbox/` | `checkbox/checkbox/` | `Checkbox.vue`、`index.ts` | 2 |
| `FaCheckbox/` | `checkbox/` | `index.vue` | 1 |
| `FaContextMenu/context-menu/` | `context-menu/context-menu/` | `ContextMenu.vue`、`ContextMenuCheckboxItem.vue`、`ContextMenuContent.vue`、`ContextMenuGroup.vue`、`ContextMenuItem.vue`、`ContextMenuLabel.vue`、`ContextMenuPortal.vue`、`ContextMenuRadioGroup.vue`、`ContextMenuRadioItem.vue`、`ContextMenuSeparator.vue`、`ContextMenuShortcut.vue`、`ContextMenuSub.vue`、`ContextMenuSubContent.vue`、`ContextMenuSubTrigger.vue`、`ContextMenuTrigger.vue`、`index.ts` | 16 |
| `FaDivider/` | `divider/` | `index.vue` | 1 |
| `FaDrawer/sheet/` | `drawer/sheet/` | `Sheet.vue`、`SheetClose.vue`、`SheetContent.vue`、`SheetDescription.vue`、`SheetFooter.vue`、`SheetHeader.vue`、`SheetTitle.vue`、`index.ts` | 8 |
| `FaDropdown/dropdown-menu/` | `dropdown/dropdown-menu/` | `DropdownMenu.vue`、`DropdownMenuCheckboxItem.vue`、`DropdownMenuContent.vue`、`DropdownMenuGroup.vue`、`DropdownMenuItem.vue`、`DropdownMenuLabel.vue`、`DropdownMenuRadioGroup.vue`、`DropdownMenuRadioItem.vue`、`DropdownMenuSeparator.vue`、`DropdownMenuShortcut.vue`、`DropdownMenuSub.vue`、`DropdownMenuSubContent.vue`、`DropdownMenuSubTrigger.vue`、`DropdownMenuTrigger.vue`、`index.ts` | 15 |
| `FaDropdown/` | `dropdown/` | `index.vue` | 1 |
| `FaInput/` | `input/` | `index.vue` | 1 |
| `FaInput/input/` | `input/input/` | `Input.vue`、`index.ts` | 2 |
| `FaInput/input-group/` | `input/input-group/` | `InputGroup.vue`、`InputGroupAddon.vue`、`index.ts` | 3 |
| `FaKbd/` | `kbd/` | `index.vue` | 1 |
| `FaLabel/` | `label/` | `index.vue` | 1 |
| `FaLabel/label/` | `label/label/` | `Label.vue`、`index.ts` | 2 |
| `FaModal/dialog/` | `modal/dialog/` | `Dialog.vue`、`DialogClose.vue`、`DialogContent.vue`、`DialogDescription.vue`、`DialogFooter.vue`、`DialogHeader.vue`、`DialogTitle.vue`、`index.ts` | 8 |
| `FaModal/` | `modal/` | `use-draggable.ts` | 1 |
| `FaPageHeader/` | `page-header/` | `index.vue` | 1 |
| `FaPageMain/` | `page-main/` | `index.vue` | 1 |
| `FaPagination/` | `pagination/` | `index.vue` | 1 |
| `FaPagination/pagination/` | `pagination/pagination/` | `Pagination.vue`、`PaginationContent.vue`、`PaginationEllipsis.vue`、`PaginationFirst.vue`、`PaginationItem.vue`、`PaginationLast.vue`、`PaginationNext.vue`、`PaginationPrevious.vue`、`index.ts` | 9 |
| `FaPasswordStrength/` | `password-strength/` | `index.vue` | 1 |
| `FaPinInput/` | `input-otp/` | `index.vue` | 1 |
| `FaPinInput/input-otp/` | `input-otp/input-otp/` | `InputOTP.vue`、`InputOTPGroup.vue`、`InputOTPSeparator.vue`、`InputOTPSlot.vue`、`index.ts` | 5 |
| `FaPopover/` | `popover/` | `index.vue` | 1 |
| `FaPopover/popover/` | `popover/popover/` | `Popover.vue`、`PopoverContent.vue`、`PopoverTrigger.vue`、`index.ts` | 4 |
| `FaRadioGroup/radio-group/` | `radio-group/radio-group/` | `RadioGroup.vue`、`RadioGroupItem.vue`、`index.ts` | 3 |
| `FaScrollArea/` | `scroll-area/` | `index.vue` | 1 |
| `FaScrollArea/scroll-area/` | `scroll-area/scroll-area/` | `ScrollArea.vue`、`ScrollBar.vue`、`index.ts` | 3 |
| `FaSearchBar/` | `search-bar/` | `index.vue` | 1 |
| `FaSelect/` | `select/` | `index.vue` | 1 |
| `FaSelect/select/` | `select/select/` | `Select.vue`、`SelectContent.vue`、`SelectGroup.vue`、`SelectItem.vue`、`SelectItemText.vue`、`SelectLabel.vue`、`SelectScrollDownButton.vue`、`SelectScrollUpButton.vue`、`SelectSeparator.vue`、`SelectTrigger.vue`、`SelectValue.vue`、`index.ts` | 12 |
| `FaSwitch/` | `switch/` | `index.vue` | 1 |
| `FaSwitch/switch/` | `switch/switch/` | `Switch.vue`、`index.ts` | 2 |
| `FaTable/` | `table/` | `index.vue` | 1 |
| `FaTable/table/` | `table/table/` | `Table.vue`、`TableBody.vue`、`TableCaption.vue`、`TableCell.vue`、`TableEmpty.vue`、`TableFooter.vue`、`TableHead.vue`、`TableHeader.vue`、`TableRow.vue`、`index.ts` | 10 |
| `FaTabs/` | `tabs/` | `index.vue` | 1 |
| `FaTabs/tabs/` | `tabs/tabs/` | `Tabs.vue`、`TabsContent.vue`、`TabsList.vue`、`TabsTrigger.vue`、`index.ts` | 5 |
| `FaToast/` | `toast/` | `index.vue` | 1 |
| `FaToast/sonner/` | `toast/sonner/` | `Sonner.vue`、`index.ts` | 2 |
| `FaTooltip/` | `tooltip/` | `index.vue` | 1 |
| `FaTooltip/tooltip/` | `tooltip/tooltip/` | `Tooltip.vue`、`TooltipContent.vue`、`TooltipProvider.vue`、`TooltipTrigger.vue`、`index.ts` | 5 |

以上为 2026-10-20 来源说明迁移时的文件清单。后续新增、删除、重命名或切换参考版本时，同步更新受影响行；新版本仅同步部分组件时，为相应行单独注明提交号，不直接替换全局基线。

## 3. 本地适配与保留边界

### 3.1 原文件头承载的信息

| 原说明 | 集中维护的含义 |
| --- | --- |
| `imports, component name and UnoCSS compatibility` | 按项目路径调整导入和组件名，并处理当前 UnoCSS 的写法兼容；不将上游别名和样式配置直接照搬进项目。 |
| `project accessibility/overlay contracts retained` | 保留项目既有无障碍和浮层交互约定。这是批量文件头的通用说明，不表示每个组件都包含浮层逻辑。具体行为以当前源码与对应 Spec 为准。 |
| `FaDropdown/index.vue`: `legacy hide/class/contentClass/label interfaces retained` | 保留已有 `hide / class / contentClass / label` 接口及调用兼容。 |
| `FaPageMain/index.vue`: `existing list-height contract` | 保留项目列表高度与内部滚动契约。 |
| `FaPasswordStrength/index.vue`: `translated labels` | 使用项目翻译文案，保留国际化接入。 |
| `FaPinInput/index.vue` 及四个 `input-otp/*.vue`: `legacy numeric input default retained` | 保留组件名、导入和旧数字输入默认值；字符串模型与输入／完成事件继续按本地实现。 |
| `FaPinInput/input-otp/index.ts`: `1b5961e` | 原文件头使用的短提交号，对应本文完整参考提交。 |
| `FaToast/index.vue`: `name` | 保留本地组件名称。 |

### 3.2 升级时必须核对的项目契约

这些边界来自当前升级 Spec 与本地实现；具体参数、事件和业务规则仍由源码及其功能契约决定。

| 范围 | 保留与核对事项 |
| --- | --- |
| 导入、样式和主题 | 使用子系统工具与本地导入路径；兼容 UnoCSS 变量写法和项目主题。上游颜色与项目 HSL 主题的映射、已确认的焦点圈／圆角／间距及减少动态偏好支持，不能被下一轮同步直接覆盖。样式使用规则见[UI 与前端复用规范](05-gaia-ui售后服务UI样式规范.md)。 |
| 图标 | 保留本地 sprite、离线回退及当前图标接口。`FaIcon` 的项目实现不因本清单而声明为上游原样副本。 |
| 页面容器与固定操作栏 | 保留 `FaPageMain` 的列表高度契约、内部滚动，以及固定栏的项目宿主定位；不能照搬未装配的上游 Teleport 容器。 |
| 弹窗与抽屉 | 保留 `FaModal / FaDrawer` 的关闭守卫、焦点处理、键盘行为、国际化及公共包装，核对遮罩只显示一层。未带来源文件头的项目包装层也需要按实际影响回归。 |
| 下拉与右键菜单 | 保留 `FaDropdown` 既有接口与 `FaContextMenu` 的 `openChange`；核对 Portal、关闭恢复、无箭头及现有浮层动画，不覆盖已确认的 Esc 传播边界。 |
| 输入与普通选择 | 保留数字输入默认值、原始值类型、禁用／清空／校验及程序回填行为；布尔 `false`、数字 `0`、字符串 `0` 和空值不能混淆。业务适配仍由既有 Es 公共层与业务页面承担。 |
| 表格与分页 | 保留当前有效页容量的展示补项及EsTable显式日期格式／完整文本提示；见[日期与分页显示修复](../specs/2026-10-15-Web公共组件与阅读交互优化.md#list-display-fixes-20261020)。 保留 `EsTable` 的后端分页、固定／最小列宽、列设置、行操作、权限、卡片模式、加载／空态及失败重试契约。优先使用既有表格内置能力，不另建表格体系。 本次FaTable已接入v9列宽、分组聚合、多级表头与区域选择，保留受控状态、键盘路由及EsTable业务包装；aggregate使用上下文定义，不能以v8签名覆盖。业务页须在开发时评估并同步启用适用能力，见[本轮契约](../specs/2026-10-15-Web公共组件与阅读交互优化.md#table-page-capabilities-20261020)。 |
| 宿主扩展和复杂控件 | Auth、NotAllowed、SystemInfo、SmartFixedBlock、独立 Notification，以及仍使用 Element 的树、远程／复杂选择等，按本地职责维护；不能仅凭 `Fa` 名称替换，也不从视觉组件推断业务、权限或数据范围。 |

## 4. 后续同步方式

1. 先明确本次参考提交和同步范围，对照本文映射找到对应上游路径；如本地已有未提交改动，保留并区分来源。
2. 以当前源码和已确认功能契约核对本地适配，再同步需要的上游修改；不能直接全目录覆盖。
3. 在本文更新版本、日期、受影响映射和适配边界；源码中的通用来源文件头不再重复维护。必要的局部行为解释仍写在相应代码附近。
4. 在对应 Spec 记录修改原因、验证结果和未验证项，按实际影响更新应用进度；不在本文另建验证流水或剩余任务清单。
5. 遵循子系统的检查要求；影响交互时回归商品分类、商品档案及受影响的弹窗／浮层／键盘状态。纯来源注释迁移通过逐文件内容对比确认无逻辑变化，并执行项目要求的代码和文档检查。

## 5. 跨项目复用与提交提醒

通用约束统一维护在个人知识库的 `30-Topics/gaoge-admin-standards/`：总入口稳定 ID 为 `kb:topic:admin-frontend-development`，ElementPlus-FaEs 具体底座合同为 `kb:reference:gaoge-admin-elementplus-faes`。本文维护 TOTO 源码映射和项目差异，知识库维护跨项目规则与参考基线，其他项目只记录采用范围、实际来源快照和自身适配。

本轮用户授权将 TOTO 视觉升级迁入 `gaoge-crm/apps/admin`；CRM 保留 Node JWT、租户／Resource RBAC、服务端导航、本地图标注册和 Element Plus 按需加载，不能直接覆盖为 TOTO 的 Gaia/Spring、业务菜单或整体安装方式。迁入开始时以来源工作树的逐文件散列为证据；本轮选定内容后已逐字节核验对应TOTO视觉升级提交 `fc471b3ae3f0f11b69b0d5574e0d476267f13138`。该提交之后仍在开发的表格扩展不并入本次冻结快照；未提交改动不能冒充某个干净Git提交。

后续 TOTO 修改通用底座时，现有 `check-doc-impact.mjs` 及已安装的 Git Hook 根据暂存路径显示非阻断同步提醒，包含删除路径和本说明／UI规范单独修改的情况。Agent 完成相关 Git 提交后，应向用户说明知识库规范、CRM及其他实际采用该底座项目的已同步／待同步／不适用状态；存在待同步时明确提醒更新。提示不表示同步完成，不自动改码、提交、推送或发布其他仓库。

目标项目先核对接入范围、参考快照、工作区和差异，逐路径判断已同步、基线相同、缺失、分叉或阻塞，再适配与独立验证。采用通用规范不等于加入某套底座的代码同步组；本次授权仅覆盖 CRM，同步组内其他项目不因提醒而自动变更。
