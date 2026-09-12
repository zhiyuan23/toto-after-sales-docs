# Gaia 菜单角色按钮权限接入调研

- 调研日期：2026-09-08
- 调研范围：`E:\workspace\gaia-ui\src\views\afterSales`、`E:\workspace\gaia-ui` 动态路由与权限代码、`E:\workspace\gaia-saas-proj` 运行宿主及本地 Maven 依赖中的 `gaia-sys` 菜单权限实现。
- 当前结论：售后服务可以接入 Gaia 既有用户、角色、菜单、按钮和 API 权限体系；关键不是顶部具体位置，而是在 `pc_web` 菜单树中建立 `afterSales` 一级菜单节点，并把所有可见菜单、隐藏页面、按钮操作和 API 列表同步授权到角色。

## 1. 结论摘要

1. `gaia-ui` 生产菜单来源是 `/api/sys/Module/tree?categoryCode=pc_web`，不是 `src/views/afterSales` 下的本地清单。只要后端返回 `afterSales` 一级节点，前端会把它作为一级导航显示；横向导航放不下时进入 `...` 折叠区，这是 Element Plus `ellipsis` 的布局行为，不影响权限语义。
2. 当前 `afterSales` 已有页面骨架和本地开发注入清单，适合生成后端菜单初始化数据，但这些本地注入节点使用负数 ID，不能被 Gaia 角色页面分配，也不能作为生产权限数据。
3. Gaia 菜单可见性由 `sys_module`、`sys_role_module`、`sys_user_role` 联合决定；按钮由 `sys_module_operation`、`sys_role_operation` 决定；API 权限由菜单和按钮的 `api_list` 字段配合 `ApiPermissionCheckInterceptor` 决定。
4. 售后可见页面必须配置祖先链路权限：角色不能只拿叶子菜单，还要拿 `afterSales` 根节点和中间分组，否则前端树可能无法形成完整一级菜单。
5. 自定义售后页面建议 `relationModelId` 保持空。`gaia-ui` 对带 `relationModelId` 的菜单会改写到 `designTemplate?modeName=...`，这适合动态建模页面，不适合 `src/views/afterSales/**/index.vue` 这些手写页面。
6. 按钮权限需要补一层前端约定。现有 `v-auth` 主要按 `{ relationModelId, authority }` 查询按钮权限，而售后自定义菜单更适合按 `sysModuleCode + operationCode` 查询；虽然路由初始化已经把无 `relationModelId` 的按钮按 `sysModuleCode` 入库，但指令本身还没有直接支持 `moduleCode` 参数。
7. API 权限是否真正拦截取决于目标环境的 `permission.api.check` 配置。当前源码已注册拦截器到 `/api/**`，但扫描到的演示配置里 `permission.api.check=true` 是注释状态；生产或测试环境上线前必须明确该开关。

## 2. 前端现状

### 2.1 动态菜单加载链路

`E:\workspace\gaia-ui\src\router\backEnd.ts` 中 `initBackEndControlRoutes()` 执行以下动作：

1. 调用 `menuApi.getMenuAdmin({ categoryCode: 'pc_web' })`，接口定义在 `E:\workspace\gaia-ui\src\api\menu\index.ts`，实际请求 `/api/sys/Module/tree`。
2. 在开发环境且 `VITE_ENABLE_AFTER_SALES_LOCAL_MENU=true` 时调用 `injectLocalAfterSalesMenu()` 注入售后本地菜单。
3. 调用 `/api/sysModuleOperation/getCurrentUserOperationList` 拉取当前用户按钮操作，把按钮权限存入 `store.state.requestOldRoutes.buttons`。
4. 将每个后端菜单节点转换成 Vue Router route：`path` 变为 `/${obj.path}`，`component` 变为 `${obj.path}/index.vue`，`meta.isHide` 来自 `obj.isHide === 1`。

因此后端菜单节点的 `path` 必须满足：

```text
sys_module.path = afterSales/customerService/workOrder
前端路由       = /afterSales/customerService/workOrder
组件文件       = E:\workspace\gaia-ui\src\views\afterSales\customerService\workOrder\index.vue
```

当前 `src/views/afterSales` 已经存在 root、分组和功能页的 `index.vue` 骨架，绝大多数页面是 `<FeaturePage code="...">` 的轻量包装。

### 2.2 顶部位置与折叠行为

`E:\workspace\gaia-ui\src\layout\navBars\breadcrumb\index.vue` 使用 Element Plus 横向菜单：

```vue
<el-menu ellipsis mode="horizontal">
```

一级菜单来自 `store.state.routesList.routesList` 过滤后的顶层 route。点击一级菜单后，会把它的 children 写入 `store.menu.twoList`，左侧菜单再显示对应的二级分组和功能菜单。

截图里的 `...` 是横向菜单宽度不足时的折叠菜单，不是权限菜单类型。因此售后服务只需要是 `pc_web` 下的一级节点；它在顶栏固定位置、靠后位置或 `...` 折叠区中，都不改变权限方案。具体顺序由 `sys_module.ordinal` 控制。

### 2.3 本地硬编码清单

`E:\workspace\gaia-ui\src\views\afterSales\shared\constants\menu-manifest.mjs` 声明：

- 根节点：`code=afterSales`，`name=售后服务`，`path=afterSales`。
- 10 个业务分组：工作台、客户服务、顾客与预约、渠道与网点、商品与服务、服务资源、配件库存、防窜货、会员运营、数据中心。
- 功能页清单：`AFTER_SALES_FEATURES`，例如 `afsWorkOrder` 对应 `afterSales/customerService/workOrder`。
- 隐藏页清单：`AFTER_SALES_HIDDEN_ENTRIES`，例如顾客登记流程中的扫码填写、隐私签名。
- 外部能力：角色与权限、用户管理、业务配置、日志审计被标记为 `AFTER_SALES_EXTERNAL_CAPABILITIES`，目标是 Gaia 全局页面。

同目录下 `local-development-menu.mjs` 会把这些清单模拟成后端菜单树，但文件备注明确写着“仅用于本地 development 页面预览，不代表后端菜单授权”。`.env.development` 当前打开了 `VITE_ENABLE_AFTER_SALES_LOCAL_MENU=true`，这会让开发环境即使后端未配置菜单也能看到售后入口。

## 3. 后端权限链路

### 3.1 菜单树

`gaia-saas-proj` 运行 jar 中包含 `gaia-sys-api-3.0-SNAPSHOT.jar` 和 `gaia-sys-core-3.0-SNAPSHOT.jar`。字节码确认：

- `com.ehsure.gaia.sys.SysModuleApi` 提供 `/api/sys/Module/tree`、`/api/sys/Module/listEnableModuleAndOperationByCategoryCode`、`/api/sys/Module/importAuthModule` 等能力。
- `/api/sys/Module/tree` 读取当前登录用户，再按 `categoryCode` 调用 `getTreeModuleByUserId(...)`。

3.0 mapper 中 `getTreeModuleByUserId` 的核心关系是：

```text
sys_module
  -> sys_role_module
  -> sys_role
  -> sys_user_role
  -> sys_user
```

查询条件包含 `sys_module.enable = 1`、当前用户 ID、可选 `sub_system_code` 和 `category_code`，并按 `sys_module.ordinal` 排序。这说明菜单是否出现，最终取决于当前用户的角色是否被分配到对应 `sys_module`。

### 3.2 角色授权

`com.ehsure.gaia.sys.SysRoleApi` 提供：

- `/api/sysAuthRole/listAssignModuleIdsOperationIdsById`
- `/api/sysAuthRole/getByIdAndCategoryCode`
- `/api/sysAuthRole/updateWithConfirm`

前端角色维护页 `E:\workspace\gaia-ui\src\views\role\roleAdd.vue` 会调用 `/api/sys/Module/listEnableModuleAndOperationByCategoryCode?categoryCode=pc_web` 获取菜单和按钮树，保存时把选中的菜单 ID 和按钮 ID 分别放入 `moduleIds`、`operationIds`，再调用 `/api/sysAuthRole/updateWithConfirm`。

这条链路可以直接用于售后菜单授权。需要注意：角色授权页里树节点半选和全选都会被收集，售后初始化后应检查角色是否包含完整祖先节点。

### 3.3 按钮权限

`com.ehsure.gaia.sys.SysModuleOperationApi` 提供 `/api/sysModuleOperation/getCurrentUserOperationList`。3.0 mapper 中按钮查询关系是：

```text
sys_module_operation
  -> sys_role_operation
  -> sys_user_role
  -> sys_module
```

返回字段包含 `sysModuleCode`、`relationModelId`、`relationModelCode` 等。`gaia-ui` 初始化按钮权限时：

- 如果按钮有 `relationModelId`，按 `relationModelId` 建 key。
- 如果按钮没有 `relationModelId`，按 `sysModuleCode` 建 key。

这对售后自定义页面是有利的：售后按钮可以按 `sysModuleCode=afsWorkOrder`、`code=create/edit/delete/export/...` 配置。但现有 `v-auth` 指令只读取 `binding.value.relationModelId`，没有显式支持 `moduleCode`，所以售后页面要么暂时手写读取 `requestOldRoutes.buttons[menuCode]`，要么扩展 `v-auth` 支持 `{ moduleCode, authority }`。

### 3.4 API 权限

`E:\workspace\gaia-saas-proj\gaia-saas-web-jar\src\main\java\com\ehsure\gaia\config\WebConfig.java` 已注册：

```java
registry.addInterceptor(apiPermissionCheckInterceptor).addPathPatterns("/api/**")
```

`ApiPermissionCheckInterceptor` 字节码显示：

1. `needCheckApiPermission=false` 时直接放行。
2. 开启后，先从所有 `sys_module.api_list` 和 `sys_module_operation.api_list` 收集“需要权限控制的接口集合”。
3. 若当前请求路径命中受控集合，再读取当前用户已授权菜单与按钮的 `api_list`。
4. 使用 `AntPathMatcher` 对请求 path 做匹配，并校验 HTTP Method。`api_list` 单项可以是 `METHOD$/api/xxx/**`，也可以省略 method 作为 `ALL`。
5. 未匹配时返回业务错误，不再进入 Controller。

当前扫描到 `gaia-saas-web\src\main\resources_SAAS_演示_上海_SAAS_WEB\application.properties` 中 `#permission.api.check=true` 被注释；目标环境如果没有打开该开关，`api_list` 不会形成后端 HTTP 拦截。即便打开，也仍需对数据范围、组织范围、租户范围做业务层校验。

## 4. 售后菜单推荐配置

### 4.1 根节点

售后服务作为一级菜单即可，不要求固定排在截图中的某个位置。推荐根节点：

| 字段 | 推荐值 | 说明 |
| --- | --- | --- |
| `categoryCode` | `pc_web` | 与 `gaia-ui` 当前动态菜单请求一致 |
| `code` | `afterSales` | 权限锚点，必须稳定 |
| `name` | `售后服务` 或 `TOTO 售后服务` | 显示名可按租户品牌口径定，但不要影响 code |
| `path` | `afterSales` | 对应 `src/views/afterSales/index.vue` |
| `parentId` | `-1` | 一级菜单 |
| `parentCode` | 空 | 一级菜单无父编码 |
| `enable` | `1` | 启用后才会被查询 |
| `isHide` | `0` | 一级入口可见 |
| `type` | `1` | 按现有可见菜单处理 |
| `relationModelId` | 空 | 避免被前端改写到 `designTemplate` |
| `ordinal` | 按期望顺序设置 | 只影响顶栏/折叠中的排序 |

### 4.2 分组与功能菜单

建议以 `menu-manifest.mjs` 作为初始化清单来源：

1. 先写入 `afterSales` 根节点。
2. 写入 10 个分组节点，父级为 `afterSales`。
3. 写入功能节点，父级为对应分组，`code` 使用 `afs...`，`path` 使用 `afterSales/...`。
4. 服务结算等范围未确认功能可先 `isHide=1` 或不授权给生产角色。
5. 隐藏流程页如果要支持刷新、直接访问、标签页和鉴权，应写入 `sys_module`，设置 `isHide=1`，并只授权给能进入父流程的角色。

可见页面当前至少应覆盖实际存在的 `src/views/afterSales/**/index.vue`，避免后端菜单返回了前端不存在的 path。旧知识库中的“系统配置/afsSettings”与当前 manifest 不一致：当前前端没有 `afterSales/settings` 页面，而是把角色、用户、配置、日志作为 Gaia 全局能力。建议优先复用 Gaia 全局系统管理页面；只有确认要做售后专属配置门户时，再单独补 `afsSettings` 节点和页面。

### 4.3 角色授权

角色授权应按“祖先 + 叶子”一次性处理：

- 总部/系统类角色：授权 `afterSales` 根节点、所需业务分组、所需功能菜单。
- 客服角色：授权工作台、客户服务、顾客与预约、必要商品与服务、评价和报表。
- 服务站角色：授权服务站工作台、工单处理、顾客预约、服务资源、配件库存、评价和报表。
- 代理商/门店角色：授权 `afterSales`、工作台、门店工作台、顾客登记、门店顾客、门店预约。

不要只给叶子菜单授权。如果角色拥有 `afsWorkOrder` 但没有 `afterSales` 和 `afsCustomerService`，后端树即使查到叶子，也可能无法在前端形成稳定导航。

### 4.4 按钮与 API

建议每个功能菜单按业务实际能力配置按钮操作：

| 按钮 code | 含义 | 常见 API 绑定示例 |
| --- | --- | --- |
| `create` | 新增 | `POST$/api/after-sales/**/create` 或具体接口 |
| `edit` | 编辑 | `PUT$/api/after-sales/**` |
| `delete` | 删除 | `DELETE$/api/after-sales/**` |
| `detail` | 查看详情 | `GET$/api/after-sales/**/detail` |
| `export` | 导出 | `GET$/api/after-sales/**/export` |
| `import` | 导入 | `POST$/api/after-sales/**/import` |
| `audit` | 审核 | 具体审核接口 |
| `dispatch` | 派单 | 具体派单接口 |
| `close` | 关闭/取消 | 具体状态流转接口 |

按钮是否显示由前端控制，接口是否可调用由后端控制。两者必须绑定同一批 `sys_module_operation` 和 `sys_role_operation`，并把关键接口写入 `api_list`。若 API 权限拦截未开启，仍需要在售后后端服务中按角色、组织、门店和租户做业务校验。

## 5. 当前问题清单

| 问题 | 影响 | 建议 |
| --- | --- | --- |
| 售后菜单现在主要靠本地注入 | 角色管理页看不到这些节点，生产用户无法按角色分配 | 将 manifest 转成 `sys_module` 初始化数据 |
| `.env.development` 开启本地菜单 | 开发环境容易误以为后端权限已配置 | 联调权限时关闭 `VITE_ENABLE_AFTER_SALES_LOCAL_MENU` 再验收 |
| 按钮指令偏向 `relationModelId` | 售后自定义页面不能直接优雅使用 `v-auth` | 扩展指令支持 `{ moduleCode, authority }`，或封装售后 `useAfterSalesAuth(menuCode)` |
| `api_list` 开关不明确 | 可能出现接口无后端拦截，或开启后误拦售后接口 | 上线前确认 `permission.api.check`，并为菜单/按钮补齐 API 列表 |
| 旧菜单设计与实际 manifest 存在“系统配置”差异 | 可能重复建设角色、用户、日志页面 | 优先复用 Gaia 全局页面，是否补售后设置分组需业务确认 |
| 隐藏流程页若不入树 | 刷新、直接访问和权限校验不稳定 | 对需要独立路由的隐藏页建 `isHide=1` 模块 |
| 只授权叶子不授权祖先 | 一级菜单或侧栏树可能缺失 | 角色授权必须包含 root、group、feature 全链路 |
| 误填 `relationModelId` | 前端路由会被改到 `designTemplate` | 手写售后页面保持 `relationModelId=null` |
| 菜单接口与业务数据范围不是一回事 | 用户看到页面后仍可能越权查数据 | 后端接口按租户、组织、门店、服务站继续做数据范围 |

## 6. 推荐实施方案

### 方案 A：通过 Gaia 菜单/角色页面手工配置

适合少量试点或先验证链路。

1. 在菜单管理中新增 `afterSales` 一级菜单和分组、功能菜单。
2. 在按钮操作管理中给每个功能菜单添加按钮 code 和 `api_list`。
3. 在角色管理中按角色勾选菜单和按钮。
4. 关闭本地菜单注入后，用不同角色账号验证菜单、按钮和接口。

优点是改动小、容易回滚；缺点是节点多，手工容易漏祖先、漏按钮、漏 API。

### 方案 B：生成幂等初始化数据或导入包

适合正式接入。

1. 以 `menu-manifest.mjs` 为输入生成 `auth_module_button.json` 或 SQL/初始化脚本。
2. 使用稳定 `code`、`path`、`parentCode`、`uniqueIdentifier` 实现幂等。
3. 先在开发/测试租户导入，通过后再同步生产。
4. 将默认角色授权纳入脚本或初始化流程，至少包含系统管理员、总部、客服、服务站、门店五类角色模板。

后端已有 `/api/sys/Module/importAuthModule` 和 `/api/sys/moduleButtonOperation/updateModuleAndButton` 一类能力，但它们会写菜单、按钮和角色授权数据。使用前必须在目标环境验证入参格式、租户边界、回滚方案和重复导入行为。

### 方案 C：前端保留本地注入，仅用于开发

适合业务页面早期并行开发，不适合上线。

1. `VITE_ENABLE_AFTER_SALES_LOCAL_MENU=true` 仅保留在本地开发。
2. 联调、测试、生产全部依赖后端菜单树。
3. 本地注入发现后端已存在 `afterSales` 会自动跳过，避免重复显示。

## 7. 验证清单

上线或联调前至少验证：

1. 管理员账号访问 `/api/sys/Module/tree?categoryCode=pc_web` 能返回 `afterSales` 根节点、分组、功能菜单和必要隐藏节点。
2. 普通角色只返回授权范围内的售后菜单；未授权角色完全看不到 `afterSales`。
3. 角色拥有叶子菜单时，也拥有 `afterSales` 和对应分组节点。
4. 关闭 `VITE_ENABLE_AFTER_SALES_LOCAL_MENU` 后，前端仍能显示后端配置的售后一级菜单。
5. 顶栏宽度不足时售后入口进入 `...`，点击后仍能正确加载左侧二级菜单。
6. 每个后端菜单 `path` 都能在 `E:\workspace\gaia-ui\src\views\<path>\index.vue` 找到组件。
7. `isHide=1` 的隐藏流程页不显示在菜单，但直接访问、刷新、返回和标签页行为正常。
8. 按钮权限接口返回售后按钮，前端能按功能菜单 code 控制按钮显示。
9. 未授权按钮对应的后端 API 不能调用；若 `permission.api.check` 未开启，则业务 Controller/Service 中必须有等价权限校验。
10. 多租户、跨门店、跨服务站、总部/客服/门店混合角色场景下，菜单权限和数据范围一致。

## 8. 后续落地建议

1. 先把 `menu-manifest.mjs` 转成一份可审阅的菜单初始化清单，字段包括 `code`、`name`、`path`、`parentCode`、`categoryCode`、`type`、`isHide`、`ordinal`。
2. 为首批真实业务切片定义按钮矩阵和 API 矩阵，不一次性给所有建设中页面开放按钮。
3. 在 `gaia-ui` 增加售后按钮权限读取封装，或小改 `v-auth` 兼容 `{ moduleCode, authority }`。
4. 角色页面确认后，先用“系统管理员、总部、客服、服务站、门店”五类账号做最小验收。
5. 旧菜单设计中的“系统配置”与当前 manifest 的全局能力口径需要单独决策；默认不复制 Gaia 角色、用户、日志页面。
