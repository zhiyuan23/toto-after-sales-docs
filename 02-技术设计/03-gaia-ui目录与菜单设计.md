# 售后服务 gaia-ui 目录与菜单设计

- 版本：V2.0
- 更新日期：2026-09-08
- 文档状态：V2 前端已实施；权威菜单与正式账号待分发联调
- 适用范围：统一管理后台、代理商工作台
- 需求依据：[TOTO 系统调研 ProcessOn 流程图](https://www.processon.com/f/6a681a83e50b43092180ded9#TOTO%E7%B3%BB%E7%BB%9F%E8%B0%83%E7%A0%94)、[页面清单](../01-功能需求/08-页面清单.md)及各端需求文档

本文确定统一管理后台和代理商工作台在 `gaia-ui` 中的导航归属、菜单名称、页面目录和角色可见范围。菜单设计以原调研图为主，但将原图中的流程步骤、详情页和上传页从侧栏菜单中移出，以便形成面向业务对象和日常任务的稳定信息架构。

当前导航以[后台菜单与角色权限手册](../04-业务阅读/05-后台菜单与角色权限手册.md)为准。程序已接入四个工作视角、授权菜单投影、默认首页与直达校验；原有 10 个业务域仅保留为唯一注册和代码存储结构。实施范围及验证边界见[V2 菜单实施记录](../specs/2026-09-08-多角色菜单V2实施.md)。

## 1. 已确认的总体方案

| 项目 | 设计结论 |
| --- | --- |
| 应用载体 | 统一管理后台和代理商工作台均在 `gaia-ui` 内实现，不建设独立代理商前端应用 |
| 一级顶部菜单 | **售后服务** |
| 顶部菜单位置 | **数码中心之后**；开发态固定菜单按此位置注入 |
| 顶部菜单代码 | `afterSales` |
| 页面根目录 | `src/views/afterSales/` |
| 导航层级 | 顶部一级菜单 → 左侧业务分组 → 功能菜单；详情、编辑、扫码填写、签名等作为隐藏路由或页面内流程 |
| 权限方式 | 唯一注册功能树；按总部运营、客服作业、服务站作业、门店业务投影已授权功能；管理员可查看全部 |
| 默认首页 | 按视角进入运营概览、服务受理、服务站工作台或门店工作台，不为代理商单独建设登录页 |
| 门店切换 | 放在门店工作台页头或全局业务上下文，不作为左侧菜单 |
| 菜单来源 | 继续由 `/api/sys/Module/tree` 返回动态菜单，菜单节点指向 `src/views/<path>/index.vue` |

这里的“代理商工作台”是同一 Web 应用中的角色门户，不是与统一管理后台并列的独立系统。项目进度仍可单独统计代理商功能，以便验收，但技术载体、顶部菜单和基础权限体系共用。

## 2. 命名原则

1. 一级菜单使用通用 SaaS 领域名称“**售后服务**”，不包含具体租户或品牌名称，也不使用“管理后台”“代理商系统”等技术或角色名称。
2. 导航分组按岗位任务组织，例如“运营分析、服务办理、本站服务、门店服务”；功能名称、code 和 path 保持稳定。
3. 同一概念只使用一个词：统一使用“顾客”而非顾客/客户混用；“客户服务”仅表示客服业务域；统一使用“服务人员”而非师傅/安装师傅。
4. 原图“售后网点管理”改为“服务站管理”，“服务商品管理”改为“服务项目”，“商品条码异常查询”简化为“条码异常”。
5. “管理”用于可增删改的主业务对象，“查询”用于只读检索，“工作台”用于待办与概览，“配置”用于规则或参数。
6. 列表、详情、创建、编辑原则上属于同一功能菜单；商品图片、顾客扫码填写、隐私签名、退货确认等不单独占用侧栏菜单。
7. 菜单显示名称使用简体中文；目录与路径使用有业务含义的英文 camelCase，菜单代码统一使用 `afs` 前缀，避免与 Gaia 既有模块冲突。

## 3. V2 完整菜单树

工作视角选择器只放在“运营概览”页面顶部，侧栏只显示当前视角的“分组 → 功能”；其他售后页面不重复展示选择器，也不新增顶部菜单。

```text
蓝鲸数字
└── 售后服务
    ├── 总部运营（工作视角） [管理员、总部]
    │   ├── 运营分析
    │   │   ├── 运营概览 [管理员、总部]
    │   │   ├── 运营报表 [管理员、总部]
    │   │   ├── 服务质量 [管理员、总部]
    │   │   └── 服务评价 [管理员、总部]
    │   ├── 渠道与服务网络
    │   │   ├── 代理商管理 [管理员、总部]
    │   │   ├── 门店管理 [管理员、总部]
    │   │   ├── 家装公司 [管理员、总部]
    │   │   ├── 服务站管理 [管理员、总部]
    │   │   └── 服务区域 [管理员、总部]
    │   ├── 商品与服务
    │   │   ├── 商品分类 [管理员、总部]
    │   │   ├── 商品档案 [管理员、总部]
    │   │   ├── 商品系列 [管理员、总部]
    │   │   ├── 配套品管理 [管理员、总部]
    │   │   ├── 服务项目 [管理员、总部]
    │   │   └── 配件档案 [管理员、总部]
    │   ├── 顾客与服务
    │   │   ├── 顾客档案 [管理员、总部]
    │   │   ├── 预约管理 [管理员、总部]
    │   │   ├── 工单管理 [管理员、总部]
    │   │   └── 安装码管理 [管理员、总部]
    │   ├── 防窜货
    │   │   ├── 防窜货查询 [管理员、总部]
    │   │   ├── 条码异常 [管理员、总部]
    │   │   ├── 异常复核 [管理员、总部]
    │   │   └── 防窜货规则 [管理员、总部]
    │   ├── 配件管理
    │   │   ├── 库存台账 [管理员、总部]
    │   │   ├── 领料管理 [管理员、总部]
    │   │   ├── 退料管理 [管理员、总部]
    │   │   ├── 调拨管理 [管理员、总部]
    │   │   ├── 工单耗用 [管理员、总部]
    │   │   └── 盘点管理 [管理员、总部]
    │   ├── 会员运营
    │   │   ├── 会员档案 [管理员、总部]
    │   │   ├── 标签管理 [管理员、总部]
    │   │   ├── 消息推送 [管理员、总部]
    │   │   └── 产品问卷 [管理员、总部]
    │   └── 数据与结算
    │       ├── 数据任务 [管理员、总部]
    │       └── 服务结算 [管理员]（待启用；总部角色暂不开放）
    ├── 客服作业（工作视角） [管理员、客服主管、客服专员]
    │   ├── 服务办理
    │   │   ├── 服务受理 [管理员、客服主管、客服专员]
    │   │   ├── 工单管理 [管理员、客服主管、客服专员]
    │   │   ├── 预约管理 [管理员、客服主管、客服专员]
    │   │   ├── 派单调度 [管理员、客服主管]
    │   │   ├── 异常工单 [管理员、客服主管、客服专员]
    │   │   ├── 完工审核 [管理员、客服主管]
    │   │   ├── 回访管理 [管理员、客服主管、客服专员]
    │   │   └── 投诉管理 [管理员、客服主管、客服专员]
    │   ├── 顾客查询
    │   │   ├── 顾客档案 [管理员、客服主管、客服专员]
    │   │   └── 安装码管理 [管理员、客服主管、客服专员]
    │   ├── 资料参考
    │   │   ├── 商品档案 [管理员、客服主管、客服专员]
    │   │   ├── 服务项目 [管理员、客服主管、客服专员]
    │   │   └── 服务知识库 [管理员、客服主管、客服专员]
    │   └── 服务分析
    │       ├── 运营概览 [管理员、客服主管、客服专员]
    │       ├── 服务质量 [管理员、客服主管、客服专员]
    │       ├── 服务评价 [管理员、客服主管、客服专员]
    │       └── 运营报表 [管理员、客服主管、客服专员]
    ├── 服务站作业（工作视角） [管理员、站点]
    │   ├── 本站服务
    │   │   ├── 服务站工作台 [管理员、站点]
    │   │   ├── 工单管理 [管理员、站点]
    │   │   ├── 预约管理 [管理员、站点]
    │   │   ├── 派单调度 [管理员、站点]
    │   │   ├── 异常工单 [管理员、站点]
    │   │   └── 完工审核 [管理员、站点]
    │   ├── 人员安排
    │   │   ├── 服务人员 [管理员、站点]
    │   │   └── 排班管理 [管理员、站点]
    │   ├── 配件管理
    │   │   ├── 配件档案 [管理员、站点]
    │   │   ├── 库存台账 [管理员、站点]
    │   │   ├── 领料管理 [管理员、站点]
    │   │   ├── 退料管理 [管理员、站点]
    │   │   ├── 调拨管理 [管理员、站点]
    │   │   ├── 工单耗用 [管理员、站点]
    │   │   └── 盘点管理 [管理员、站点]
    │   ├── 资料参考
    │   │   └── 服务知识库 [管理员、站点]
    │   └── 服务分析
    │       ├── 服务质量 [管理员、站点]
    │       ├── 服务评价 [管理员、站点]
    │       └── 运营报表 [管理员、站点]
    └── 门店业务（工作视角） [管理员、代理商、店员]
        └── 门店服务
            ├── 门店工作台 [管理员、代理商、店员]
            ├── 顾客登记 [管理员、代理商、店员]
            ├── 门店顾客 [管理员、代理商、店员]
            └── 门店预约 [管理员、代理商、店员]
```

共 4 个工作视角、18 个展示分组、75 处功能引用，去重为 49 个功能。总部业务角色默认 34 项、客服主管 17 项、客服专员 15 项、站点 19 项、代理商与店员各 4 项；管理员 49 项，服务结算只显示待启用状态。63 个 Web 需求入口分母不变。

## 4. 菜单节点、路径和需求入口映射

下表按原有存储目录列出唯一功能注册，**不表示运行侧栏分组**。角色列已按 V2 查看矩阵更新；查看不包含写操作，管理员全查看仍受租户和业务数据范围限制。

### 4.0 顶部菜单与存储分组节点

| 层级／名称 | 菜单代码 | path／页面目录 | 说明 |
| --- | --- | --- | --- |
| 顶部／售后服务 | `afterSales` | `afterSales` | Web 售后业务唯一顶部入口，排列在“数码中心”之后 |
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

### 4.1 工作台

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 运营概览 | `afsDashboardOverview` | `afterSales/dashboard/overview` | A01 | 管理员、总部、客服主管、客服专员 |
| 服务站工作台 | `afsDashboardStation` | `afterSales/dashboard/serviceStation` | A02 | 管理员、服务站管理员 |
| 门店工作台 | `afsDashboardDealer` | `afterSales/dashboard/dealer` | D02 | 管理员、代理商管理员、门店店员 |

### 4.2 客户服务

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 服务受理 | `afsServiceIntake` | `afterSales/customerService/intake` | A17 | 管理员、客服主管、客服专员 |
| 工单管理 | `afsWorkOrder` | `afterSales/customerService/workOrder` | A18 | 管理员、总部、客服主管、客服专员、服务站管理员 |
| 派单调度 | `afsDispatch` | `afterSales/customerService/dispatch` | A19 | 管理员、客服主管、服务站管理员 |
| 异常工单 | `afsWorkOrderException` | `afterSales/customerService/exception` | A20 | 管理员、客服主管、客服专员、服务站管理员 |
| 完工审核 | `afsCompletionReview` | `afterSales/customerService/completionReview` | A21 | 管理员、客服主管、服务站管理员 |
| 回访管理 | `afsFollowUp` | `afterSales/customerService/followUp` | A22 | 管理员、客服主管、客服专员 |
| 服务知识库 | `afsKnowledgeBase` | `afterSales/customerService/knowledgeBase` | A23 | 管理员、客服主管、客服专员、服务站管理员 |
| 投诉管理 | `afsComplaint` | `afterSales/customerService/complaint` | A24 | 管理员、客服主管、客服专员 |
| 服务结算 | `afsSettlement` | `afterSales/customerService/settlement` | A25 | 管理员 |

### 4.3 顾客与预约

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 顾客档案 | `afsCustomerArchive` | `afterSales/customer/customerArchive` | A15 | 管理员、总部、客服主管、客服专员 |
| 预约管理 | `afsAppointment` | `afterSales/customer/appointment` | A16 | 管理员、总部、客服主管、客服专员、服务站管理员 |
| 顾客登记 | `afsDealerRegistration` | `afterSales/customer/dealerRegistration` | D03、D04 | 管理员、代理商管理员、门店店员 |
| 门店顾客 | `afsDealerCustomer` | `afterSales/customer/dealerCustomer` | D07 | 管理员、代理商管理员、门店店员 |
| 门店预约 | `afsDealerAppointment` | `afterSales/customer/dealerAppointment` | D08 | 管理员、代理商管理员、门店店员 |

“顾客登记”页面内选择线下门店或虚拟门店登记类型。D05 顾客扫码填写和 D06 隐私签名属于该流程的隐藏页面；D01 沿用 Gaia 登录，并将授权门店选择实现为登录后业务上下文或页头切换器。

### 4.4 渠道与网点

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 代理商管理 | `afsDealer` | `afterSales/network/dealer` | A03 | 管理员、总部 |
| 门店管理 | `afsStore` | `afterSales/network/store` | A04 | 管理员、总部 |
| 家装公司 | `afsDecorationCompany` | `afterSales/network/decorationCompany` | A05 | 管理员、总部 |
| 服务站管理 | `afsServiceStation` | `afterSales/network/serviceStation` | A06 | 管理员、总部 |
| 服务区域 | `afsServiceArea` | `afterSales/network/serviceArea` | A07 | 管理员、总部 |

### 4.5 商品与服务

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 商品分类 | `afsProductCategory` | `afterSales/catalog/category` | A08 | 管理员、总部 |
| 商品档案 | `afsProduct` | `afterSales/catalog/product` | A09、A11 | 管理员、总部、客服主管、客服专员 |
| 商品系列 | `afsProductSeries` | `afterSales/catalog/series` | A10 | 管理员、总部 |
| 配套品管理 | `afsProductBundle` | `afterSales/catalog/bundle` | A12 | 管理员、总部 |
| 服务项目 | `afsServiceItem` | `afterSales/catalog/serviceItem` | A13 | 管理员、总部、客服主管、客服专员 |
| 配件档案 | `afsPart` | `afterSales/catalog/part` | A29 | 管理员、总部、服务站管理员 |

A11 商品图片并入“商品档案”的详情/编辑页，不再单列“商品图上传”菜单；上传仍保留文件类型、大小、病毒和权限校验要求。

### 4.6 服务资源

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 服务人员 | `afsServicePersonnel` | `afterSales/serviceResource/personnel` | A26 | 管理员、服务站管理员 |
| 排班管理 | `afsSchedule` | `afterSales/serviceResource/schedule` | A27 | 管理员、服务站管理员 |
| 服务质量 | `afsServiceQuality` | `afterSales/serviceResource/quality` | A28 | 管理员、总部、客服主管、客服专员、服务站管理员 |

### 4.7 配件库存

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 库存台账 | `afsPartStock` | `afterSales/inventory/stock` | A30 | 管理员、总部、服务站管理员 |
| 领料管理 | `afsPartRequisition` | `afterSales/inventory/requisition` | A31 | 管理员、总部、服务站管理员 |
| 退料管理 | `afsPartReturn` | `afterSales/inventory/return` | A32 | 管理员、总部、服务站管理员 |
| 调拨管理 | `afsPartTransfer` | `afterSales/inventory/transfer` | A33 | 管理员、总部、服务站管理员 |
| 工单耗用 | `afsPartConsumption` | `afterSales/inventory/consumption` | A34 | 管理员、总部、服务站管理员 |
| 盘点管理 | `afsStocktake` | `afterSales/inventory/stocktake` | A35 | 管理员、总部、服务站管理员 |

### 4.8 防窜货

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 防窜货查询 | `afsDiversionSearch` | `afterSales/antiDiversion/search` | A36 | 管理员、总部 |
| 条码异常 | `afsBarcodeException` | `afterSales/antiDiversion/barcodeException` | A37 | 管理员、总部 |
| 安装码管理 | `afsInstallationCode` | `afterSales/antiDiversion/installationCode` | A38 | 管理员、总部、客服主管、客服专员 |
| 异常复核 | `afsDiversionReview` | `afterSales/antiDiversion/review` | A39 | 管理员、总部 |
| 防窜货规则 | `afsDiversionRule` | `afterSales/antiDiversion/rule` | A40 | 管理员、总部 |

### 4.9 会员运营

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 会员档案 | `afsMember` | `afterSales/memberOperation/member` | A41 | 管理员、总部 |
| 标签管理 | `afsMemberTag` | `afterSales/memberOperation/tag` | A14 | 管理员、总部 |
| 消息推送 | `afsMemberPush` | `afterSales/memberOperation/push` | A42、A43 | 管理员、总部 |
| 服务评价 | `afsServiceSurvey` | `afterSales/memberOperation/serviceSurvey` | A44 | 管理员、总部、客服主管、客服专员、服务站管理员 |
| 产品问卷 | `afsProductSurvey` | `afterSales/memberOperation/productSurvey` | A45 | 管理员、总部 |

A43 推送结果作为“消息推送”的结果页或页签，不单列侧栏菜单。

### 4.10 数据中心

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 运营报表 | `afsReport` | `afterSales/dataCenter/report` | A54 | 管理员、总部、客服主管、客服专员、服务站管理员 |
| 数据任务 | `afsDataJob` | `afterSales/dataCenter/job` | A55 | 管理员、总部 |

“数据任务”统一承载导入、导出、预检、错误明细、文件下载和任务状态，避免各业务菜单重复建设导入导出中心。

### 4.11 蓝鲸数字全局系统能力（不进入售后菜单）

| 能力 | 承接位置 | 入口 ID | 说明 |
| --- | --- | --- | --- |
| 角色与权限 | 蓝鲸数字全局权限管理 | A46、A47 | 配置售后相关角色的菜单、按钮、接口和数据范围，不在 `afterSales` 下重复建设 |
| 用户管理 | 蓝鲸数字全局用户管理 | A48、A49、A50 | 复用全局用户、组织和账号能力 |
| 业务配置 | 蓝鲸数字全局系统配置 | A51 | 复用全局字典、参数和通知配置能力 |
| 日志审计 | 蓝鲸数字全局日志管理 | A52、A53 | 复用全局操作日志与登录日志能力 |

以上入口继续保留需求追踪，但没有 `afterSales/settings` 菜单代码或页面 path。后续在蓝鲸数字全局系统能力中补齐售后权限范围并单独验收。

## 5. gaia-ui 页面目录

以下为目标目录结构；当前 `gaia-ui` 尚未创建 `src/views/afterSales/`，功能实现时按此逐步落地。

```text
src/views/afterSales/
├── index.vue                         # 顶部菜单默认入口，按角色重定向工作台
├── access/                          # 5 个隐藏导航授权承载页，访问时重定向
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
└── shared/
    ├── components/                   # 售后域内复用组件
    ├── composables/                  # 售后域内组合逻辑
    ├── constants/                    # 功能清单、工作视角、导航与角色模板
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

## 7. 角色默认导航与授权来源

| 角色 | 工作视角 | 默认首页 | 功能数 |
| --- | --- | --- | ---: |
| 系统管理员 | 全部四个 | 运营概览；可切换视角 | 49 |
| 总部管理／运营 | 总部运营 | 运营概览 | 34 |
| 客服主管 | 客服作业 | 服务受理 | 17 |
| 客服专员 | 客服作业 | 服务受理 | 15 |
| 服务站管理员 | 服务站作业 | 服务站工作台 | 19 |
| 代理商管理员、店员 | 门店业务 | 门店工作台 | 各 4 |

正式导航取新鲜 `/api/sys/Module/tree` 的功能授权与隐藏视角授权项的交集，不读取登录页写死的 `roles: ['admin']` 推断管理员。5 个导航授权项见配置清单：`afsNavigationAdministrator` 与四个 `afsWorkspace*`；它们只承载导航授权，不包含业务接口或按钮授权。管理员角色需绑定全部功能与全局能力对应查看权限，前端不会凭管理员标记补出后端未授权的功能。

多角色账号合并功能授权，在当前视角下去重显示。单视角直接进入；多视角恢复本账号仍有效的上次视角，否则采用总部→客服→站点→门店中的第一个有效视角。首页无权时落到第一个授权功能；空视角不显示。旧分组链接转入有效首页，越权功能直达 `/401`。

切换工作视角前提示未保存内容，页面重新挂载；视角偏好不当作授权缓存，登录后重新核对菜单。组织／门店切换、待办数量、全局快捷入口、业务数据范围联动尚待各切片完成，当前选择器只切导航，不改变后端身份。

## 8. 原调研节点的调整说明

| 原调研名称或结构 | 调整后 | 调整原因 |
| --- | --- | --- |
| 管理后台系统、代理商系统 | 共用“售后服务”顶部菜单 | 两者已确认同属 `gaia-ui`，按角色分配子菜单；模块保持通用 SaaS 命名 |
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
| 系统管理中的角色、权限、三类用户、业务配置、两类日志 | 蓝鲸数字全局系统能力承接 | 售后服务保持通用 SaaS 业务菜单，不重复建设系统配置入口 |
| Excel 导入导出 | 数据任务 | 统一承载异步任务、错误明细和文件生命周期 |

## 9. Gaia 菜单配置与分发

业务目录与角色规则统一见[后台菜单与角色权限手册](../04-业务阅读/05-后台菜单与角色权限手册.md)。代码映射位于 `shared/constants/workspace-manifest.mjs`；菜单配置 JSON 从相同代码按需生成，文档目录不重复保存生成产物。生成内容包括 68 个唯一节点（1 顶部＋10 存储组＋49 功能＋3 流程＋5 导航授权）、四视角和七种角色模板，是按 code 核对的配置源，不是可直接提交的批量 API 请求。

保留[生成脚本](../../../frontend/gaia-ui/scripts/after-sales-menu-package.mjs)。在 `gaia-ui` 仓库中执行，输出位置按本次分发任务指定，例如：

```sh
node scripts/after-sales-menu-package.mjs /tmp/toto-menu-v2-review.json
```

1. 在目标环境的 `gaia-tenant` 权威菜单中按 code 对照，保留既有 ID；路径冲突先核实，不删除重建功能。不直接改运行库 `sys_module`。
2. 依父子关系注册缺失节点；解析真实 parentId、分类、排序及已存在“数码中心”的顺序，导航授权与流程项隐藏。生产业务按验收开通；服务结算只向管理员开放状态查看。
3. 指定目标租户并合并本次模块分配，保留租户已有无关模块；经平台现有分发及回执链同步。现有 `/api/tenantSaasModule/saveTenantModuleOperation` 接口需真实租户 ID 和模块／操作 ID，不可直接提交清单中的 code。
4. 将角色模板绑定目标环境的实际角色 ID；管理员包含全部售后功能与四视角，其他岗位按模板裁剪，已有非售后授权保持。功能查询 API 按已确认切片配套，写操作单独授权；A46～A53 在现有全局模块中配置，不新增重复菜单。
5. 关闭本地预览与临时 API 放行，用各角色真实账号验证菜单、直达、动作、租户及组织范围，再回写入口验收。

前端与清单生成脚本已更新；当前接口检测到旧版“本地菜单初始化”记录，不等于本次完成了权威注册。目标租户／环境尚待指定，尚未执行正式分发和角色写入。本地开发开关开启且旧菜单缺少导航项时，仅补导航预览标记，保留后端功能集合和 ID，不补未授权功能；页面明确标注“本地菜单预览”。
