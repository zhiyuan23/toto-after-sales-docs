# TOTO 售后服务 gaia-ui 目录与菜单设计

- 版本：V1.0
- 更新日期：2026-09-08
- 文档状态：菜单设计基线
- 适用范围：统一管理后台、代理商工作台
- 需求依据：[TOTO 系统调研 ProcessOn 流程图](https://www.processon.com/f/6a681a83e50b43092180ded9#TOTO%E7%B3%BB%E7%BB%9F%E8%B0%83%E7%A0%94)、[页面清单](../01-功能需求/08-页面清单.md)及各端需求文档

本文确定统一管理后台和代理商工作台在 `gaia-ui` 中的导航归属、菜单名称、页面目录和角色可见范围。菜单设计以原调研图为主，但将原图中的流程步骤、详情页和上传页从侧栏菜单中移出，以便形成面向业务对象和日常任务的稳定信息架构。

## 1. 已确认的总体方案

| 项目 | 设计结论 |
| --- | --- |
| 应用载体 | 统一管理后台和代理商工作台均在 `gaia-ui` 内实现，不建设独立代理商前端应用 |
| 一级顶部菜单 | **售后服务**；显示名可按租户品牌口径配置为“TOTO 售后服务”，权限锚点固定为 `afterSales` |
| 顶部菜单代码 | `afterSales` |
| 页面根目录 | `src/views/afterSales/` |
| 导航层级 | `pc_web` 一级菜单 → 左侧业务分组 → 功能菜单；详情、编辑、扫码填写、签名等作为隐藏路由或页面内流程 |
| 权限方式 | 共用一棵菜单树，按总部、客服、服务站、代理商/门店等角色分配菜单、按钮、接口和数据范围 |
| 默认首页 | 按角色进入运营概览、服务站工作台或门店工作台，不为代理商单独建设登录页 |
| 门店切换 | 放在门店工作台页头或全局业务上下文，不作为左侧菜单 |
| 菜单来源 | 继续由 `/api/sys/Module/tree` 返回动态菜单，菜单节点指向 `src/views/<path>/index.vue`；接入细节见[Gaia 菜单角色按钮权限接入调研](06-gaia菜单角色按钮权限接入调研.md) |

这里的“代理商工作台”是同一 Web 应用中的角色门户，不是与统一管理后台并列的独立系统。项目进度仍可单独统计代理商功能，以便验收，但技术载体、一级菜单和基础权限体系共用。一级菜单在横向导航中的具体位置不作权限要求；当导航宽度不足时可进入 `...` 折叠区。

## 2. 命名原则

1. 一级菜单使用业务品牌与领域名称“**TOTO 售后服务**”，不使用“管理后台”“代理商系统”等技术或角色名称。
2. 业务分组使用稳定领域名，例如“客户服务、顾客与预约、渠道与网点”；功能菜单使用“对象 + 动作/用途”，例如“工单管理、派单调度”。
3. 同一概念只使用一个词：统一使用“顾客”而非顾客/客户混用；“客户服务”仅表示客服业务域；统一使用“服务人员”而非师傅/安装师傅。
4. 原图“售后网点管理”改为“服务站管理”，“服务商品管理”改为“服务项目”，“商品条码异常查询”简化为“条码异常”。
5. “管理”用于可增删改的主业务对象，“查询”用于只读检索，“工作台”用于待办与概览，“配置”用于规则或参数。
6. 列表、详情、创建、编辑原则上属于同一功能菜单；商品图片、顾客扫码填写、隐私签名、退货确认等不单独占用侧栏菜单。
7. 菜单显示名称使用简体中文；目录与路径使用有业务含义的英文 camelCase，菜单代码统一使用 `afs` 前缀，避免与 Gaia 既有模块冲突。

## 3. 完整菜单树

```text
TOTO 售后服务
├── 工作台
│   ├── 运营概览
│   ├── 服务站工作台
│   └── 门店工作台
├── 客户服务
│   ├── 服务受理
│   ├── 工单管理
│   ├── 派单调度
│   ├── 异常工单
│   ├── 完工审核
│   ├── 回访管理
│   ├── 服务知识库
│   ├── 投诉管理
│   └── 服务结算（范围待确认）
├── 顾客与预约
│   ├── 顾客档案
│   ├── 预约管理
│   ├── 顾客登记
│   ├── 门店顾客
│   └── 门店预约
├── 渠道与网点
│   ├── 代理商管理
│   ├── 门店管理
│   ├── 家装公司
│   ├── 服务站管理
│   └── 服务区域
├── 商品与服务
│   ├── 商品分类
│   ├── 商品档案
│   ├── 商品系列
│   ├── 配套品管理
│   ├── 服务项目
│   └── 配件档案
├── 服务资源
│   ├── 服务人员
│   ├── 排班管理
│   └── 服务质量
├── 配件库存
│   ├── 库存台账
│   ├── 领料管理
│   ├── 退料管理
│   ├── 调拨管理
│   ├── 工单耗用
│   └── 盘点管理
├── 防窜货
│   ├── 防窜货查询
│   ├── 条码异常
│   ├── 安装码管理
│   ├── 异常复核
│   └── 防窜货规则
├── 会员运营
│   ├── 会员档案
│   ├── 标签管理
│   ├── 消息推送
│   ├── 服务评价
│   └── 产品问卷
├── 数据中心
│   ├── 运营报表
│   └── 数据任务
└── 系统配置
    ├── 角色与权限
    ├── 用户管理
    ├── 业务配置
    └── 日志审计
```

菜单共 11 个业务分组、53 个建议可见功能菜单。每个角色只看到授权范围，代理商/门店角色默认只显示 4 个菜单；尚未完成验收的菜单在生产租户保持隐藏。页面清单中的 63 个 Web 入口组用于需求追踪，不等同于 63 个侧栏菜单。

## 4. 菜单节点、路径和需求入口映射

角色缩写：`总部` 为 TOTO 管理与运营人员，`客服` 为客服中心，`站点` 为服务站管理人员，`门店` 为代理商及门店人员，`系统` 为系统管理员。角色列是初始建议，最终以后续角色权限矩阵为准。

### 4.0 顶部菜单与分组节点

| 层级／名称 | 菜单代码 | path／页面目录 | 说明 |
| --- | --- | --- | --- |
| 顶部／TOTO 售后服务 | `afterSales` | `afterSales` | Web 售后业务唯一顶部入口 |
| 分组／工作台 | `afsDashboard` | `afterSales/dashboard` | 按角色显示不同工作台 |
| 分组／客户服务 | `afsCustomerService` | `afterSales/customerService` | 客服受理、派单、审核及服务闭环 |
| 分组／顾客与预约 | `afsCustomer` | `afterSales/customer` | 管理侧与门店侧顾客、登记和预约 |
| 分组／渠道与网点 | `afsNetwork` | `afterSales/network` | 代理商、门店、家装公司、服务站和区域 |
| 分组／商品与服务 | `afsCatalog` | `afterSales/catalog` | 商品、服务项目和配件主档 |
| 分组／服务资源 | `afsServiceResource` | `afterSales/serviceResource` | 服务人员、排班和质量 |
| 分组／配件库存 | `afsInventory` | `afterSales/inventory` | 多级库存和单据闭环 |
| 分组／防窜货 | `afsAntiDiversion` | `afterSales/antiDiversion` | 码查询、异常和规则 |
| 分组／会员运营 | `afsMemberOperation` | `afterSales/memberOperation` | 会员、标签、推送、评价和问卷 |
| 分组／数据中心 | `afsDataCenter` | `afterSales/dataCenter` | 报表、对账和数据任务 |
| 分组／系统配置 | `afsSettings` | `afterSales/settings` | 售后角色、用户、配置和审计入口 |

### 4.1 工作台

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 运营概览 | `afsDashboardOverview` | `afterSales/dashboard/overview` | A01 | 总部、客服、系统 |
| 服务站工作台 | `afsDashboardStation` | `afterSales/dashboard/serviceStation` | A02 | 总部、客服、站点 |
| 门店工作台 | `afsDashboardDealer` | `afterSales/dashboard/dealer` | D02 | 门店 |

### 4.2 客户服务

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 服务受理 | `afsServiceIntake` | `afterSales/customerService/intake` | A17 | 客服、总部 |
| 工单管理 | `afsWorkOrder` | `afterSales/customerService/workOrder` | A18 | 客服、总部、站点 |
| 派单调度 | `afsDispatch` | `afterSales/customerService/dispatch` | A19 | 客服、总部、站点 |
| 异常工单 | `afsWorkOrderException` | `afterSales/customerService/exception` | A20 | 客服、总部、站点 |
| 完工审核 | `afsCompletionReview` | `afterSales/customerService/completionReview` | A21 | 客服、总部、站点 |
| 回访管理 | `afsFollowUp` | `afterSales/customerService/followUp` | A22 | 客服、总部 |
| 服务知识库 | `afsKnowledgeBase` | `afterSales/customerService/knowledgeBase` | A23 | 客服、总部、站点 |
| 投诉管理 | `afsComplaint` | `afterSales/customerService/complaint` | A24 | 客服、总部 |
| 服务结算 | `afsSettlement` | `afterSales/customerService/settlement` | A25 | 总部、系统 |

### 4.3 顾客与预约

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 顾客档案 | `afsCustomerArchive` | `afterSales/customer/customerArchive` | A15 | 总部、客服 |
| 预约管理 | `afsAppointment` | `afterSales/customer/appointment` | A16 | 总部、客服、站点 |
| 顾客登记 | `afsDealerRegistration` | `afterSales/customer/dealerRegistration` | D03、D04 | 门店 |
| 门店顾客 | `afsDealerCustomer` | `afterSales/customer/dealerCustomer` | D07 | 门店 |
| 门店预约 | `afsDealerAppointment` | `afterSales/customer/dealerAppointment` | D08 | 门店 |

“顾客登记”页面内选择线下门店或虚拟门店登记类型。D05 顾客扫码填写和 D06 隐私签名属于该流程的隐藏页面；D01 沿用 Gaia 登录，并将授权门店选择实现为登录后业务上下文或页头切换器。

### 4.4 渠道与网点

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 代理商管理 | `afsDealer` | `afterSales/network/dealer` | A03 | 总部、系统 |
| 门店管理 | `afsStore` | `afterSales/network/store` | A04 | 总部、系统 |
| 家装公司 | `afsDecorationCompany` | `afterSales/network/decorationCompany` | A05 | 总部 |
| 服务站管理 | `afsServiceStation` | `afterSales/network/serviceStation` | A06 | 总部、系统 |
| 服务区域 | `afsServiceArea` | `afterSales/network/serviceArea` | A07 | 总部、系统 |

### 4.5 商品与服务

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 商品分类 | `afsProductCategory` | `afterSales/catalog/category` | A08 | 总部、系统 |
| 商品档案 | `afsProduct` | `afterSales/catalog/product` | A09、A11 | 总部、客服、系统 |
| 商品系列 | `afsProductSeries` | `afterSales/catalog/series` | A10 | 总部、系统 |
| 配套品管理 | `afsProductBundle` | `afterSales/catalog/bundle` | A12 | 总部、系统 |
| 服务项目 | `afsServiceItem` | `afterSales/catalog/serviceItem` | A13 | 总部、客服、系统 |
| 配件档案 | `afsPart` | `afterSales/catalog/part` | A29 | 总部、站点、系统 |

A11 商品图片并入“商品档案”的详情/编辑页，不再单列“商品图上传”菜单；上传仍保留文件类型、大小、病毒和权限校验要求。

### 4.6 服务资源

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 服务人员 | `afsServicePersonnel` | `afterSales/serviceResource/personnel` | A26 | 总部、站点、系统 |
| 排班管理 | `afsSchedule` | `afterSales/serviceResource/schedule` | A27 | 总部、站点 |
| 服务质量 | `afsServiceQuality` | `afterSales/serviceResource/quality` | A28 | 总部、客服、站点 |

### 4.7 配件库存

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 库存台账 | `afsPartStock` | `afterSales/inventory/stock` | A30 | 总部、站点 |
| 领料管理 | `afsPartRequisition` | `afterSales/inventory/requisition` | A31 | 总部、站点 |
| 退料管理 | `afsPartReturn` | `afterSales/inventory/return` | A32 | 总部、站点 |
| 调拨管理 | `afsPartTransfer` | `afterSales/inventory/transfer` | A33 | 总部、站点 |
| 工单耗用 | `afsPartConsumption` | `afterSales/inventory/consumption` | A34 | 总部、站点 |
| 盘点管理 | `afsStocktake` | `afterSales/inventory/stocktake` | A35 | 总部、站点 |

### 4.8 防窜货

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 防窜货查询 | `afsDiversionSearch` | `afterSales/antiDiversion/search` | A36 | 总部 |
| 条码异常 | `afsBarcodeException` | `afterSales/antiDiversion/barcodeException` | A37 | 总部 |
| 安装码管理 | `afsInstallationCode` | `afterSales/antiDiversion/installationCode` | A38 | 总部、客服 |
| 异常复核 | `afsDiversionReview` | `afterSales/antiDiversion/review` | A39 | 总部 |
| 防窜货规则 | `afsDiversionRule` | `afterSales/antiDiversion/rule` | A40 | 总部、系统 |

### 4.9 会员运营

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 会员档案 | `afsMember` | `afterSales/memberOperation/member` | A41 | 总部、客服 |
| 标签管理 | `afsMemberTag` | `afterSales/memberOperation/tag` | A14 | 总部 |
| 消息推送 | `afsMemberPush` | `afterSales/memberOperation/push` | A42、A43 | 总部 |
| 服务评价 | `afsServiceSurvey` | `afterSales/memberOperation/serviceSurvey` | A44 | 总部、客服、站点 |
| 产品问卷 | `afsProductSurvey` | `afterSales/memberOperation/productSurvey` | A45 | 总部 |

A43 推送结果作为“消息推送”的结果页或页签，不单列侧栏菜单。

### 4.10 数据中心

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 运营报表 | `afsReport` | `afterSales/dataCenter/report` | A54 | 总部、客服、站点 |
| 数据任务 | `afsDataJob` | `afterSales/dataCenter/job` | A55 | 总部、系统 |

“数据任务”统一承载导入、导出、预检、错误明细、文件下载和任务状态，避免各业务菜单重复建设导入导出中心。

### 4.11 系统配置

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 角色与权限 | `afsRolePermission` | `afterSales/settings/rolePermission` | A46、A47 | 系统 |
| 用户管理 | `afsUser` | `afterSales/settings/user` | A48、A49、A50 | 系统 |
| 业务配置 | `afsBusinessConfig` | `afterSales/settings/businessConfig` | A51 | 系统、总部 |
| 日志审计 | `afsAuditLog` | `afterSales/settings/auditLog` | A52、A53 | 系统 |

能通过 Gaia 既有系统管理页面按 TOTO 范围复用的能力，应复用已有页面或以业务入口跳转，不复制角色、用户和日志实现。“业务配置”内部按业务字典、系统参数和通知模板分为页签。

## 5. gaia-ui 页面目录

以下为目标目录结构；当前 `gaia-ui` 尚未创建 `src/views/afterSales/`，功能实现时按此逐步落地。

```text
src/views/afterSales/
├── index.vue                         # 顶部菜单默认入口，按角色重定向工作台
├── dashboard/
│   ├── index.vue                     # 分组落地/重定向
│   ├── overview/index.vue
│   ├── serviceStation/index.vue
│   └── dealer/index.vue
├── customerService/
│   ├── index.vue
│   ├── intake/index.vue
│   ├── workOrder/index.vue
│   ├── dispatch/index.vue
│   ├── exception/index.vue
│   ├── completionReview/index.vue
│   ├── followUp/index.vue
│   ├── knowledgeBase/index.vue
│   ├── complaint/index.vue
│   └── settlement/index.vue
├── customer/
│   ├── index.vue
│   ├── customerArchive/index.vue
│   ├── appointment/index.vue
│   ├── dealerRegistration/index.vue
│   ├── dealerCustomer/index.vue
│   ├── dealerAppointment/index.vue
│   └── registrationFlow/             # 扫码填写、隐私签名等隐藏流程页
├── network/
│   ├── index.vue
│   ├── dealer/index.vue
│   ├── store/index.vue
│   ├── decorationCompany/index.vue
│   ├── serviceStation/index.vue
│   └── serviceArea/index.vue
├── catalog/
│   ├── index.vue
│   ├── category/index.vue
│   ├── product/index.vue
│   ├── series/index.vue
│   ├── bundle/index.vue
│   ├── serviceItem/index.vue
│   └── part/index.vue
├── serviceResource/
│   ├── index.vue
│   ├── personnel/index.vue
│   ├── schedule/index.vue
│   └── quality/index.vue
├── inventory/
│   ├── index.vue
│   ├── stock/index.vue
│   ├── requisition/index.vue
│   ├── return/index.vue
│   ├── transfer/index.vue
│   ├── consumption/index.vue
│   └── stocktake/index.vue
├── antiDiversion/
│   ├── index.vue
│   ├── search/index.vue
│   ├── barcodeException/index.vue
│   ├── installationCode/index.vue
│   ├── review/index.vue
│   └── rule/index.vue
├── memberOperation/
│   ├── index.vue
│   ├── member/index.vue
│   ├── tag/index.vue
│   ├── push/index.vue
│   ├── serviceSurvey/index.vue
│   └── productSurvey/index.vue
├── dataCenter/
│   ├── index.vue
│   ├── report/index.vue
│   └── job/index.vue
├── settings/
│   ├── index.vue
│   ├── rolePermission/index.vue
│   ├── user/index.vue
│   ├── businessConfig/index.vue
│   └── auditLog/index.vue
└── shared/
    ├── components/                   # 售后域内复用组件
    ├── composables/                  # 售后域内组合逻辑
    ├── constants/                    # 菜单无关的业务常量
    └── types/                        # 售后前端类型
```

目录按业务域组织，不按“管理员页面/代理商页面”复制两套结构。只有被两个以上售后页面实际复用的内容才放入 `shared`；不得修改或依赖受保护的 `src/views/common` 子仓库来承载本项目页面。

## 6. 动态菜单与路由约束

1. `gaia-ui` 当前通过 `/api/sys/Module/tree?categoryCode=pc_web` 获取动态菜单；模块 `path` 会映射到 `src/views/<path>/index.vue`。
2. 菜单数据中的 path 不带开头 `/`，例如 `afterSales/customer/customerArchive`；浏览器路由为 `/afterSales/customer/customerArchive`。
3. 所有动态菜单落地页使用 `index.vue`，以匹配现有 `import.meta.glob('../views/**/index.{vue,tsx}')`。
4. 顶部菜单、业务分组和功能菜单都使用稳定且唯一的 code。功能上线后不因中文名称调整修改 code，以免破坏权限关联。
5. 详情、编辑、扫码和签名等页面使用隐藏路由或页面内状态，不出现在侧栏；必须保留刷新、返回、标签页和直接访问鉴权能力。
6. 菜单权限、按钮权限、API 权限和数据范围必须同步配置；仅隐藏前端菜单不构成授权控制。
7. 菜单初始化应幂等，可按租户分配；未验收菜单可在开发/测试租户启用，在生产租户保持隐藏。
8. 售后服务只要求作为 `pc_web` 下的一级菜单；横向导航中的显示位置和是否进入 `...` 折叠区由 `ordinal` 与页面宽度决定，不作为业务或权限验收条件。

## 7. 角色默认导航

| 角色类型 | 默认首页 | 主要可见分组 |
| --- | --- | --- |
| TOTO 总部管理/运营 | 运营概览 | 除门店专属入口外的授权业务分组 |
| 客服人员 | 服务受理 | 工作台、客户服务、顾客与预约、商品与服务、服务评价、报表 |
| 服务站管理人员 | 服务站工作台 | 工作台、工单处理、顾客预约、服务资源、配件库存、服务评价、报表 |
| 代理商/门店人员 | 门店工作台 | 工作台、顾客登记、门店顾客、门店预约 |
| 系统管理员 | 运营概览 | 渠道与网点、商品与服务、数据中心、系统配置及授权业务菜单 |

同一用户具有多个门店或组织权限时，在页面头部切换当前业务上下文；切换后必须立即刷新按钮权限和数据范围。角色名称、默认首页和可见菜单将在角色权限切片中最终确认。

## 8. 原调研节点的调整说明

| 原调研名称或结构 | 调整后 | 调整原因 |
| --- | --- | --- |
| 管理后台系统、代理商系统 | 共用“TOTO 售后服务”顶部菜单 | 两者已确认同属 `gaia-ui`，按角色分配子菜单 |
| 主档管理 | 拆为“渠道与网点”“商品与服务”“服务资源” | 减少单组菜单数量，名称更贴近日常管理对象 |
| 售后网点管理 | 服务站管理 | 与需求和工单路由中的“服务站”术语统一 |
| 门店查询管理 | 并入门店管理 | 查询是门店管理的基础能力，不重复建菜单 |
| 商品图上传 | 并入商品档案 | 图片属于商品编辑流程 |
| 服务商品管理 | 服务项目 | 避免将安装、维修、指导误解为实物商品 |
| 顾客信息管理 | 顾客与预约 | 同时覆盖顾客、购买登记和安装预约 |
| 登记顾客信息（线下/虚拟） | 顾客登记中的类型/页签 | 共用字段、校验和提交闭环，避免重复菜单 |
| 顾客扫码填写、授权签字 | 顾客登记隐藏流程页 | 属于流程步骤，不是日常导航入口 |
| 预约安装信息查询、预约安装操作 | 门店预约 | 查询、创建、再次预约和退货在一个业务入口闭环 |
| 会员管理与标签管理分散在主档和会员节点 | 统一放入会员运营 | 按运营对象归组，避免重复入口 |
| 推送结果管理 | 消息推送结果页/页签 | 结果依赖推送任务，不需要独立菜单 |
| 问卷调查管理 | 拆为服务评价、产品问卷 | 区分首期工单评价与二期产品满意度调查 |
| 系统管理中的角色、权限、三类用户、两类日志 | 角色与权限、用户管理、日志审计 | 保留完整能力，减少低频菜单碎片 |
| Excel 导入导出 | 数据任务 | 统一承载异步任务、错误明细和文件生命周期 |

## 9. 实施顺序

1. 在菜单/权限数据中建立 `afterSales` 一级节点及业务分组，先保持生产隐藏；菜单、按钮、API 与角色授权按[Gaia 菜单角色按钮权限接入调研](06-gaia菜单角色按钮权限接入调研.md)执行。
2. 按本文件创建 `src/views/afterSales` 目录和 53 个菜单落地入口；范围待确认的“服务结算”只保留隐藏节点。
3. 配置角色默认首页和首批可见菜单：总部、客服、服务站、代理商/门店、系统管理员。
4. 实现 D01 的门店业务上下文选择，以及 D05/D06 等隐藏流程路由。
5. 验证菜单加载、刷新、直接访问、返回、无权限、跨门店和跨租户场景；通过后再更新入口进度。
6. 后续按业务切片逐个接入真实数据和 API，业务验收前不把菜单可打开计为功能完成。

本设计只确定信息架构、命名和代码目录，不代表具体业务规则、接口、角色矩阵或生产菜单已完成。
