# 售后服务 gaia-ui 目录与菜单设计

- 版本：V3.0
- 更新日期：2026-09-13
- 文档状态：V3 前端已实施；权威菜单与正式账号待分发联调
- 适用范围：单一 Web 管理后台及其总部运营、客服作业、服务站作业、门店业务视角
- 需求依据：[TOTO 系统调研 ProcessOn 流程图](https://www.processon.com/f/6a681a83e50b43092180ded9#TOTO%E7%B3%BB%E7%BB%9F%E8%B0%83%E7%A0%94)、[页面清单](../01-功能需求/08-页面清单.md)及各端需求文档

本文确定单一 Web 管理后台在 `gaia-ui` 中的导航归属、菜单名称、页面目录和角色可见范围。原“统一管理后台”和“代理商工作台”只是历史需求来源及入口编号分组，不是两个应用。菜单设计以原调研图为主，但将原图中的流程步骤、详情页和上传页从侧栏菜单中移出，以便形成面向业务对象和日常任务的稳定信息架构。

> 架构演进说明：售后 Web 的默认实现位置已经调整为同一 `gaia-ui` 仓库的 `apps/after-sales/` 独立 SPA，菜单 code、角色投影和 Gaia 权限来源保持不变；`src/views/afterSales/` 是 legacy 保留入口。源码、运行、构建及部署改造见[售后子系统独立前端改造方案](07-gaia-ui售后子系统独立前端改造方案.md)。

当前导航以[后台菜单与角色权限手册](09-后台菜单与岗位权限矩阵.md)为准。程序已接入四个工作视角、16 个展示分组（2026-09-12 源码快照）、管理员全局切换、授权菜单投影、默认首页与直达校验；原有 10 个业务域仅保留为唯一注册和代码存储结构。V3 实施范围及验证边界见[后台菜单与工作视角收敛记录](../specs/2026-09-11-后台菜单与工作视角收敛.md)。

## 1. 已确认的总体方案

| 项目 | 设计结论 |
| --- | --- |
| 应用载体 | 只建设一个 `gaia-ui/apps/after-sales` Web 管理后台，不建设独立代理商前端应用 |
| 一级顶部菜单 | **售后服务** |
| 顶部菜单位置 | **数码中心之后**；开发态固定菜单按此位置注入 |
| 顶部菜单代码 | `afterSales` |
| 页面根目录 | `apps/after-sales/src/views/`；`src/views/afterSales/` 仅作 legacy 保留 |
| 导航层级 | 顶部一级菜单 → 左侧业务分组 → 功能菜单；详情、编辑、扫码填写、签名等作为隐藏路由或页面内流程 |
| 权限方式 | 唯一注册功能树；按总部运营、客服作业、服务站作业、门店业务投影已授权功能；管理员获得四视角切换权，具体功能仍须显式授权 |
| 默认首页 | 按视角进入运营概览、客服工作台、服务站工作台或门店工作台；总首页 `/` 直接呈现当前视角工作台 |
| 门店切换 | 放在门店工作台页头或全局业务上下文，不作为左侧菜单 |
| 菜单来源 | 继续由 `/api/sys/Module/tree` 返回动态菜单，菜单节点指向 `src/views/<path>/index.vue` |

这里的“代理商工作台”统一称为门店业务视角，是同一 Web 管理后台中的角色门户。历史 `Dxx` 入口可以单独筛选和验收，但项目总进度必须汇总到 Web 管理后台，不再作为独立功能端统计。

## 2. 命名原则

1. 一级菜单使用通用 SaaS 领域名称“**售后服务**”，不包含具体租户或品牌名称，也不使用“管理后台”“代理商系统”等技术或角色名称。
2. 导航分组按岗位任务组织，例如“运营管理、工单处理、本站工单、业务办理”；功能 code 和 path 保持稳定，用户名称可按业务理解收敛。
3. 同一概念只使用一个词：统一使用“顾客”而非顾客/客户混用；“客户服务”仅表示客服业务域；统一使用“服务人员”而非师傅/安装师傅。
4. 原图“售后网点管理”改为“服务站管理”，“商品条码异常查询”简化为“条码异常”；原“服务商品管理／服务项目”已退出当前 Web 产品范围。
5. “管理”用于可增删改的主业务对象，“查询”用于只读检索，“工作台”用于待办与概览，“配置”用于规则或参数。
6. 列表、详情、创建、编辑原则上属于同一功能菜单；商品图片、顾客扫码填写、隐私签名、退货确认等不单独占用侧栏菜单。
7. 菜单显示名称使用简体中文；目录与路径使用有业务含义的英文 camelCase，菜单代码统一使用 `afs` 前缀，避免与 Gaia 既有模块冲突。

## 3. V2 历史菜单树（已被 V3 取代）

本节保留 2026-09-08 的 V2 目录用于差异追溯，不再作为当前导航实现依据。V3 当前目录以[角色权限手册第 2 节](09-后台菜单与岗位权限矩阵.md#full-catalog)和独立子系统 `src/features/navigation/manifest.json` 为准：管理员切换器位于全局页头，侧栏只显示当前视角的“分组 → 功能”，不存在第五套管理员混合菜单。

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

以上是 V2 历史数量。2026-09-12 当前源码为 4 个工作视角、16 个展示分组、61 处侧栏引用，去重后 41 个侧栏注册；另有 1 个服务侧安装申请查询上下文功能和 6 个导航外功能，共 48 个注册功能。此前恢复的会员运营、数据与结算分组及占位引用不表示业务开放；A05、A13、D08 仅保留历史编号用于变更追溯；A38 安装码管理已按 2026-09-12 确认恢复至总部／客服业务查询组。

## 4. 菜单节点、路径和需求入口映射

下表按原有存储目录列出 48 个当前唯一功能注册，**不表示运行侧栏分组，也不表示当前全部可见**。角色列保留功能分配方向；V3 是否进入侧栏／上下文／规划隐藏以导航清单和角色权限手册为准。查看不包含写操作，管理员仍受功能授权、租户和业务数据范围限制。

### 4.0 顶部菜单与存储分组节点

| 层级／名称 | 菜单代码 | path／页面目录 | 说明 |
| --- | --- | --- | --- |
| 顶部／售后服务 | `afterSales` | `afterSales` | Web 售后业务唯一顶部入口，排列在“数码中心”之后 |
| 分组／工作台 | `afsDashboard` | `afterSales/dashboard` | 按角色显示不同工作台 |
| 分组／客户服务 | `afsCustomerService` | `afterSales/customerService` | 客服受理、派单、审核及服务闭环 |
| 分组／顾客与预约（存储名保留） | `afsCustomer` | `afterSales/customer` | 运行导航按各视角放入“业务查询”或“业务办理”；共享购买记录与安装申请能力 |
| 分组／渠道与网点 | `afsNetwork` | `afterSales/network` | 代理商、门店、服务站和区域 |
| 分组／商品与服务（存储名保留） | `afsCatalog` | `afterSales/catalog` | 运行导航按视角放入“商品资料”“业务查询”或“配件管理” |
| 分组／服务资源 | `afsServiceResource` | `afterSales/serviceResource` | 服务人员、排班和质量 |
| 分组／配件库存 | `afsInventory` | `afterSales/inventory` | 多级库存和单据闭环 |
| 分组／防窜货 | `afsAntiDiversion` | `afterSales/antiDiversion` | 码查询、异常和规则 |
| 分组／会员运营 | `afsMemberOperation` | `afterSales/memberOperation` | 会员、标签、推送、评价和问卷 |
| 分组／数据中心 | `afsDataCenter` | `afterSales/dataCenter` | 报表、对账和数据任务 |

### 4.1 工作台

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 运营概览 | `afsDashboardOverview` | `afterSales/dashboard/overview` | A01 | 管理员、总部 |
| 客服工作台 | `afsDashboardCustomerService` | `afterSales/dashboard/customerService` | A01（与总部首页共用历史入口） | 管理员、客服主管、客服专员 |
| 服务站工作台 | `afsDashboardStation` | `afterSales/dashboard/serviceStation` | A02 | 管理员、服务站管理员 |
| 门店工作台 | `afsDashboardDealer` | `afterSales/dashboard/dealer` | D02 | 管理员、代理商管理员、门店店员 |

### 4.2 客户服务

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 服务受理 | `afsServiceIntake` | `afterSales/customerService/intake` | A17 | 管理员、客服主管、客服专员 |
| 服务工单 | `afsWorkOrder` | `afterSales/customerService/workOrder` | A18 | 管理员、总部、客服主管、客服专员、服务站管理员 |
| 派单调度 | `afsDispatch` | `afterSales/customerService/dispatch` | A19 | 管理员、客服主管、服务站管理员 |
| 异常工单 | `afsWorkOrderException` | `afterSales/customerService/exception` | A20 | 管理员、客服主管、客服专员、服务站管理员 |
| 完工审核 | `afsCompletionReview` | `afterSales/customerService/completionReview` | A21 | 管理员、客服主管；当前只进入客服作业视角 |
| 回访管理 | `afsFollowUp` | `afterSales/customerService/followUp` | A22 | 管理员、客服主管、客服专员 |
| 服务知识库 | `afsKnowledgeBase` | `afterSales/customerService/knowledgeBase` | A23 | 管理员、客服主管、客服专员、服务站管理员 |
| 投诉管理 | `afsComplaint` | `afterSales/customerService/complaint` | A24 | 管理员、客服主管、客服专员 |
| 服务结算 | `afsSettlement` | `afterSales/customerService/settlement` | A25 | 管理员 |

### 4.3 顾客与购买

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 顾客购买记录 | `afsCustomerArchive` | `afterSales/customer/customerArchive` | A15 | 管理员、总部、客服主管、客服专员 |
| 安装申请查询（上下文） | `afsAppointment` | `afterSales/customer/appointment` | A16 | 管理员、客服主管、客服专员、服务站管理员 |
| 购买登记 | `afsDealerRegistration` | `afterSales/customer/dealerRegistration` | D03、D04 | 管理员、代理商管理员、门店店员 |
| 顾客购买记录 | `afsDealerCustomer` | `afterSales/customer/dealerCustomer` | D07 | 管理员、代理商管理员、门店店员 |

“购买登记”页面内选择线下门店或虚拟门店登记类型。D05 顾客扫码填写和 D06 隐私签名属于该流程的隐藏页面；D01 沿用 Gaia 登录，并将授权门店选择实现为登录后业务上下文。门店在顾客购买记录内直接申请安装，不提供 D08 独立预约管理；A16 仅供客服／服务站通过服务工单关联跳转或历史直达访问。

### 4.4 渠道与网点

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 代理商管理 | `afsDealer` | `afterSales/network/dealer` | A03 | 管理员、总部 |
| 门店管理 | `afsStore` | `afterSales/network/store` | A04 | 管理员、总部 |
| 服务站管理 | `afsServiceStation` | `afterSales/network/serviceStation` | A06 | 管理员、总部 |
| 服务区域 | `afsServiceArea` | `afterSales/network/serviceArea` | A07 | 管理员、总部 |

### 4.5 商品与服务（存储域）

| 菜单名称 | 菜单代码 | path／页面目录 | 入口 ID | 建议角色 |
| --- | --- | --- | --- | --- |
| 商品分类 | `afsProductCategory` | `afterSales/catalog/category` | A08 | 管理员、总部 |
| 商品档案 | `afsProduct` | `afterSales/catalog/product` | A09、A11 | 管理员、总部、客服主管、客服专员 |
| 商品系列 | `afsProductSeries` | `afterSales/catalog/series` | A10 | 管理员、总部 |
| 配套品管理 | `afsProductBundle` | `afterSales/catalog/bundle` | A12 | 管理员、总部 |
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

A38 独立“安装码管理”于 2026-09-12 按用户要求恢复功能注册、路由及真实查询页，在总部／客服“业务查询”组展示；沿用既有菜单代码、路径和后端查询 API。购买登记仍负责生成安装码，该页面只提供授权范围内的查询与详情，不新增发码、改码或核销动作。见[恢复范围与标识关系核查](../specs/2026-09-12-安装码管理恢复与标识关系核查.md)。

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
| 字典管理 | `afsDictionary` | `afterSales/dataCenter/dictionary` | —（此前已合入注册；不增本次入口） | 管理员、总部 |
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
8. 同一功能跨视角展示时复用唯一 code、path 和页面，只在视角清单中引用到不同展示分组；不得因分组名称不同复制功能节点。视角授权、功能查看、操作权限和数据范围分别校验。
9. 展示顺序由工作视角清单维护，遵循高频任务优先、查询早于资料维护、维度先于主体、单据按业务发生顺序；同名共享分组在不同视角中保持一致。总部一级按运营管理、业务查询、渠道与网点、商品资料、配件管理排列。

## 7. 角色默认导航与授权来源

| 角色 | 工作视角 | 默认首页 | 功能数 |
| --- | --- | --- | ---: |
| 系统管理员 | 已有业务授权对应的视角 | 当前视角工作台；页头可切换视角 | 当前 41 个去重侧栏注册＋1 个上下文功能，实际业务逐项授权 |
| 总部管理／运营 | 总部运营 | 运营概览 | 当前目录 28 个去重注册；其中服务结算仅供另授的管理员待启用查看 |
| 客服主管 | 客服作业 | 客服工作台 | 最多 13 个侧栏功能＋1 个上下文入口 |
| 客服专员 | 客服作业 | 客服工作台 | 默认最多 11 个侧栏功能＋1 个上下文入口 |
| 服务站管理员 | 服务站作业 | 服务站工作台 | 最多 16 个侧栏功能＋1 个上下文入口 |
| 代理商管理员、店员 | 门店业务 | 门店工作台 | 各 3 个侧栏功能 |

正式导航取新鲜 `/api/sys/Module/tree` 的功能授权与隐藏视角授权项的交集，不读取登录页写死的 `roles: ['admin']` 推断管理员。5 个导航授权项见配置清单：`afsNavigationAdministrator` 与四个 `afsWorkspace*`；管理员授权使页头出现四视角切换器，四个岗位授权决定普通账号的视角，均不包含业务接口或按钮授权。前端不会凭管理员标记补出后端未授权的功能。

多角色账号合并功能授权，在当前视角下去重显示；普通业务账号按首个有效岗位视角进入，不展示管理员专属切换器。有效岗位导航授权可进入该视角首页外壳，数据与动作另按业务权限决定；没有业务模块时呈现空工作台，不回落到首个业务功能。直达某个有权功能时恢复包含该功能的视角，登录后保留合法深链；越权功能转入访问状态页。

总首页 `/` 直接呈现当前视角工作台；管理员从全局页头选择视角后，经离页检查进入对应固定首页，取消确认保留原表单。客服首页是视角入口，不向 `resolveAccess().features` 合成新模块或 API 权限，即使新 code 尚未分发也可通过有效客服视角授权进入。四首页复用 `views/dashboard/index.vue` 与已有资源 API，详见[四视角首页工作台](../specs/2026-09-12-四视角首页工作台.md)。选择器不改变后端身份或组织；当前按授权组织读取，账号到本站绑定及严格站级隔离待正式验收。

## 8. 原调研节点的调整说明

| 原调研名称或结构 | 调整后 | 调整原因 |
| --- | --- | --- |
| 管理后台系统、代理商系统 | 共用“售后服务”顶部菜单 | 两者已确认同属 `gaia-ui`，按角色分配子菜单；模块保持通用 SaaS 命名 |
| 主档管理 | 按岗位拆入“渠道与网点”“商品资料”“人员与资料”等分组 | 减少单组菜单数量，名称更贴近日常管理对象 |
| 售后网点管理 | 服务站管理 | 与需求和工单路由中的“服务站”术语统一 |
| 门店查询管理 | 并入门店管理 | 查询是门店管理的基础能力，不重复建菜单 |
| 商品图上传 | 并入商品档案 | 图片属于商品编辑流程 |
| 服务商品管理 | 已删除独立服务项目功能 | 当前产品不再维护独立服务项目菜单或页面 |
| 顾客信息管理 | 顾客购买记录 | 以购买记录承载顾客、商品实例和安装申请状态，避免“档案”误解为独立主档 |
| 登记顾客信息（线下/虚拟） | 购买登记中的类型/页签 | 共用字段、校验和提交闭环，避免重复菜单 |
| 顾客扫码填写、授权签字 | 购买登记隐藏流程页 | 属于流程步骤，不是日常导航入口 |
| 预约安装信息查询、预约安装操作 | 顾客购买记录／服务工单的安装申请上下文 | 发起与查询仍可达，但不在侧栏重复三套预约入口 |
| 安装码管理 | 2026-09-12 恢复总部／客服业务查询入口 | 继续沿用产品实例安装码查询，方便独立定位和查看关联购买信息；不据此承诺完整售后追溯已完成 |
| 标签管理单独成组 | 并入总部“会员运营” | 与会员档案、消息推送和产品问卷形成连续运营链路；标签用途仍支持会员、渠道和运营，不在“运营管理”重复展示 |
| 推送结果管理 | 消息推送结果页/页签 | 结果依赖推送任务，不需要独立菜单 |
| 问卷调查管理 | 拆为服务评价、产品问卷 | 区分首期工单评价与二期产品满意度调查 |
| 系统管理中的角色、权限、三类用户、业务配置、两类日志 | 蓝鲸数字全局系统能力承接 | 售后服务保持通用 SaaS 业务菜单，不重复建设系统配置入口 |
| Excel 导入导出 | 数据任务 | 统一承载异步任务、错误明细和文件生命周期 |

## 9. Gaia 菜单配置与分发

业务目录与角色规则统一见[后台菜单与角色权限手册](09-后台菜单与岗位权限矩阵.md)。独立子系统当前代码映射位于 `apps/after-sales/src/features/navigation/manifest.json`；48 个当前功能 code/path 和 5 个导航授权 code 由该清单集中维护。`afsDealerAppointment`、`afsDecorationCompany`、`afsServiceItem` 已从注册与路由删除；`afsInstallationCode` 已按本次明确要求恢复；旧生成脚本只用于既有 Gaia 节点核对，不得据此恢复已删除功能或 V2 全量侧栏。

保留[生成脚本](../../../frontend/gaia-ui/scripts/after-sales-menu-package.mjs)。在 `gaia-ui` 仓库中执行，输出位置按本次分发任务指定，例如：

```sh
node scripts/after-sales-menu-package.mjs /tmp/toto-menu-v2-review.json
```

1. 在目标环境的 `gaia-tenant` 权威菜单中按 code 对照，保留既有 ID；路径冲突先核实，不删除重建功能。不直接改运行库 `sys_module`。
2. 依父子关系注册缺失节点；解析真实 parentId、分类、排序及已存在“数码中心”的顺序，导航授权、流程项及 V3 规划功能保持隐藏。生产业务按验收开通，不通过“占位可见”表示开发进度。
3. 指定目标租户并合并本次模块分配，保留租户已有无关模块；经平台现有分发及回执链同步。现有 `/api/tenantSaasModule/saveTenantModuleOperation` 接口需真实租户 ID 和模块／操作 ID，不可直接提交清单中的 code。
4. 将角色模板绑定目标环境的实际角色 ID；管理员包含管理员导航授权和按需业务功能授权，其他岗位使用对应工作视角并按模板裁剪，已有非售后授权保持。功能查询 API 按已确认切片配套，写操作单独授权；A46～A53 在现有全局模块中配置，不新增重复菜单。
5. 关闭本地预览与临时 API 放行，用各角色真实账号验证菜单、直达、动作、租户及组织范围，再回写入口验收。

前端与清单生成脚本已更新；当前接口检测到旧版“本地菜单初始化”记录，不等于本次完成了权威注册。目标租户／环境尚待指定，尚未执行正式分发和角色写入。本地开发开关开启且旧菜单缺少导航项时，仅补导航预览标记，保留后端功能集合和 ID，不补未授权功能；页面明确标注“本地菜单预览”。
