# gaia-ui 售后子系统独立前端改造方案

- 版本：V1.2
- 更新日期：2026-09-08
- 文档状态：第一阶段独立底座及统一运行／构建已实施验证；Gaia 会话、权限、业务迁移和三模式接入未实施
- 适用范围：`gaia-ui` 主系统、售后服务 Web 子系统、PC SaaS 前端构建与部署
- 关联文档：[gaia-ui 目录与菜单设计](03-gaia-ui目录与菜单设计.md)、[售后服务 UI 样式规范](05-gaia-ui售后服务UI样式规范.md)、[本地开发与联调](../local-development.md)

本文确定将售后服务 Web 功能从 `gaia-ui` 主 SPA 中迁移为同仓库独立前端子系统的目标架构，并在迁移期保留 `legacy`、`embedded`、`standalone` 三种确定性展示模式。子系统只复用 `gaoge-compass` 的前端工程底座、布局和通用 UI 能力，不引入其登录、JWT、RBAC、后端 API、业务页面或数据库模型。

当前生产源码仍位于 `gaia-ui/src/views/afterSales/`，运行时仍使用 Gaia 动态路由。本文后续章节描述完整目标状态。2026-09-08 已完成独立静态底座和统一运行／构建，详见第 13 节；尚未迁移业务、接入会话权限或上线。

## 1. 改造目标与结论

### 1.1 目标

1. 保持 `gaia-ui` 现有根目录和主项目技术栈不变，在仓库内新增 `apps/after-sales/`。
2. 主系统与售后子系统作为两个独立 SPA 运行，避免 Vue、Vite、Router、状态管理和全局样式版本互相影响。
3. 用户从 Gaia 顶部“售后服务”菜单进入当前旧页面、同域内嵌页面或独立二级路径 `/after-sales/`，具体由唯一展示模式配置决定，不在 URL 中传递 Token 或权限信息。
4. 子系统继续使用 Gaia 当前登录会话、租户上下文、菜单权限、操作权限和售后领域 API。
5. 本地保留一条命令同时启动两个前端；构建时分别生成两个产物，最终组装为一个 `dist` 和一个部署包。
6. 现有 PC SaaS 的 Tomcat `ROOT`、`api.war`、域名、证书和 `/api` 后端部署方式保持不变。

### 1.2 核心结论

| 项目 | 方案 |
| --- | --- |
| 代码仓库 | 继续使用一个 `gaia-ui` 仓库 |
| 应用形态 | 主系统和售后子系统为两个独立 SPA |
| 页面集成 | 支持 `legacy` 当前页面、`embedded` 同域 iframe 内嵌、`standalone` 完整页面跳转三种模式 |
| 新功能源码 | 以售后子系统为唯一新实现；`embedded` 与 `standalone` 复用同一页面和 API Client |
| 访问路径 | 主系统 `/`；售后子系统 `/after-sales/`；后端 `/api/` |
| 登录 | 复用 Gaia 同域 Shiro 会话，不使用 Compass JWT |
| 权限 | Gaia 后端为唯一权威；子系统启动后重新获取并校验 |
| 本地运行 | 根目录一条命令并行启动两个 Vite 服务 |
| 构建 | 主、子项目分别构建，使用各自依赖和锁文件 |
| 发布 | 将两个构建结果组装为一个根 `dist`，沿用一个前端部署包 |
| 生产容器 | 继续解压到 Tomcat `webapps/ROOT` |

## 2. 架构边界

### 2.1 从 gaoge-compass 复用的内容

- 前端工程组织方式和 TypeScript 基线。
- 应用布局、导航外壳和适用于售后系统的通用组件。
- Pinia 基础结构、路由注册框架和请求封装框架。
- 主题变量、通用样式以及确有需要的 Vite 插件配置。
- 404、403、空状态、加载状态等通用前端能力。

第一阶段按用户确认采用“完整复制 Admin 基线后做减法”：只复制已跟踪源码和必要配置，排除依赖、产物、缓存与环境秘密，再删除业务、认证和后端耦合。保留原布局与通用能力，不重新手写框架。

### 2.2 明确不复用的内容

- Compass 登录页和 `auth/admin/login`。
- `localStorage.token`、Bearer JWT 和 Compass 用户会话模型。
- Compass Resource RBAC、`auth/permission` 和 `admin/navigation`。
- Compass 的 Nest API、Prisma、数据库表和权限种子。
- 商品、订单、仓储、财务、分析等 Compass 业务页面。
- 与售后无关的图表、富文本、图标全集、埋点和版权配置。
- 未经筛选的 `@gaoge/shared-types`、`@gaoge/shared-constants` 业务依赖。

### 2.3 技术隔离原则

主系统与子系统各自加载独立 HTML、JavaScript 和 CSS。主系统继续使用当前 Vue 3.2、Vite 2、Vue Router 4 和 Vuex 4；子系统可使用 Compass 底座的 Vue 3.5、Vite 8、Vue Router 5 和 Pinia 3。

两个应用不互相导入源码包或运行时实例，不共享 Vue、Router、Element Plus、状态容器和全局 CSS。`embedded` 模式也仍由子系统自己的 HTML 和运行时渲染，只是通过受控的同域 iframe 放入 Gaia 内容区。跨应用只共享稳定的 HTTP 接口、同域会话、经过定义的导航 URL，以及不包含身份和权限数据的有限页面协作消息。

## 3. 目标源码目录

改造后建议目录如下：

```text
gaia-ui/
├── package.json                         # 主项目命令入口；保留 Yarn 1 构建链
├── yarn.lock                            # 主项目依赖锁
├── vite.config.ts                       # 主项目 Vite 2 配置及本地子系统代理
├── src/
│   ├── api/                             # Gaia 主系统 API
│   ├── router/                          # 主系统动态菜单和三种展示模式选择
│   ├── layout/                          # 顶部菜单；按模式进入旧页面、内嵌页或子系统
│   └── views/
│       └── afterSales/
│           ├── ...                      # legacy 当前页面；最终形态确认前保留
│           └── embed/
│               └── index.vue           # embedded 唯一通用 iframe 容器
├── scripts/
│   └── frontends/
│       ├── dev.mjs                      # 并行启动主、子前端
│       ├── build.mjs                    # 按模式分别构建并组装产物
│       └── verify-dist.mjs              # 校验部署目录、入口和资源引用
└── apps/
    └── after-sales/
        ├── package.json                 # 子系统 pnpm 命令和依赖
        ├── pnpm-lock.yaml               # 子系统独立锁文件
        ├── pnpm-workspace.yaml          # 仅确需内部 packages 时保留
        ├── .npmrc                       # pnpm 行为约束
        ├── .nvmrc                       # Node 22
        ├── vite.config.ts               # base=/after-sales/
        ├── index.html
        ├── public/
        └── src/
            ├── main.ts
            ├── app/
            │   ├── router/              # Hash 路由、embed 路由和本地页面注册表
            │   ├── stores/              # Pinia；不保存 Gaia Token
            │   ├── presentation.ts      # legacy/embedded/standalone 展示契约
            │   └── layouts/
            │       ├── StandaloneLayout.vue
            │       └── EmbeddedLayout.vue
            ├── adapters/
            │   └── gaia/
            │       ├── session.ts       # Gaia 会话状态和失效处理
            │       ├── navigation.ts    # Gaia 菜单树到子系统路由的投影
            │       └── permission.ts    # 页面、操作和领域权限适配
            ├── api/
            │   └── afterSales/           # 继续调用 /api/afterSales/**
            ├── components/              # 按需迁移的通用组件
            ├── styles/                  # 子系统自己的主题与 reset
            └── views/                   # 售后页面和隐藏流程页
```

默认不在 `gaia-ui` 根目录建立 pnpm workspace，避免 pnpm 接管主项目依赖和锁文件。若子系统确实需要多个内部包，只在 `apps/after-sales/` 内建立嵌套 workspace；更小的共享类型和常量优先直接放入子系统源码。

## 4. 运行方案

### 4.1 生产访问关系

```text
浏览器
├── https://<统一域名>/
│       └── gaia-ui 主系统
├── https://<统一域名>/after-sales/#/
│       └── 售后子系统
└── https://<统一域名>/api/**
        └── 现有 Gaia SaaS 后端
```

子系统默认使用 Hash 路由，例如：

```text
/after-sales/#/dashboard/overview
/after-sales/#/catalog/product
```

Hash 之后的路径不发送给服务器，因此当前 Tomcat 静态资源部署不需要增加 History fallback。子系统 Vite 配置使用：

```ts
export default defineConfig({
  base: '/after-sales/'
})
```

如果未来改为 History 路由，必须同步为 `/after-sales/*` 增加回退到 `/after-sales/index.html` 的网关或容器规则；未配置前不得切换。

### 4.2 三种展示模式

展示模式使用一个集中配置，不允许在各菜单和业务页面中散落独立判断：

```ts
type AfterSalesMode = 'legacy' | 'embedded' | 'standalone'
```

| 模式 | 页面来源 | Gaia 外壳 | 主要用途 |
| --- | --- | --- | --- |
| `legacy` | 当前 `src/views/afterSales/` 页面 | 保留 | 迁移期基线和现有成果回退 |
| `embedded` | `apps/after-sales/` 子系统页面 | 保留 | 在 Gaia 菜单和内容区中展示子系统功能 |
| `standalone` | `apps/after-sales/` 子系统页面 | 不保留 | 独立售后子系统正式形态 |

三种模式的请求关系如下：

```text
legacy
└── Gaia 菜单 -> 当前 Gaia 售后页面 -> 同一 Gaia 售后 API

embedded
└── Gaia 菜单 -> 通用 iframe 容器
                  └── /after-sales/#/embed/<业务路由> -> 同一子系统页面 -> 同一 Gaia 售后 API

standalone
└── Gaia 顶部入口 -> /after-sales/#/<业务路由> -> 同一子系统页面 -> 同一 Gaia 售后 API
```

`embedded` 不是第三套业务实现，而是子系统的展示模式。子系统通过 `EmbeddedLayout` 隐藏自己的顶部栏、侧栏和面包屑，只渲染业务内容；普通业务功能只在子系统实现一次，同时供 `embedded` 和 `standalone` 使用。

迁移开发期默认使用 `legacy`，确保当前菜单和已开发功能不受影响。子系统功能达到验收条件后，再按演示或发布目标切换为 `embedded` 或 `standalone`。模式配置只决定展示入口，不参与任何权限判断。

`embedded` 需要一次性完成以下基础适配：

- 主系统提供一个通用 iframe 容器，根据当前已授权菜单生成子系统路由。
- 子系统提供通用 `EmbeddedLayout`，统一处理外壳隐藏、内容高度、边距和滚动。
- 父子页面只允许通过受控的同域 URL 和必要的 `postMessage` 同步标题或导航状态；禁止传递 Token、租户 ID、角色和权限列表。
- 校验实际响应头和 CSP 允许同域嵌入，不允许 iframe 加载任意外部来源。
- 打印、下载、打开新窗口、全屏、跨页流程、需要覆盖整个浏览器窗口的弹窗和浏览器返回键需要专项验收；能在公共布局或桥接层处理的，不在每个页面重复实现。

### 4.3 本地一条命令启动

对开发人员保留原入口：

```bash
yarn dev
```

根脚本内部并行启动：

```text
主系统 Vite 2       http://127.0.0.1:7004/
售后子系统 Vite 8    http://127.0.0.1:9010/after-sales/
```

主系统 Vite 将 `/after-sales/` 代理到子系统端口，将 `/api` 继续代理到 Gaia 后端。浏览器始终从主系统地址访问：

```text
http://127.0.0.1:7004/
http://127.0.0.1:7004/after-sales/#/
```

这样本地也保持同源，会话 Cookie、API 地址和生产一致。运行脚本应满足：

- 任意一个 Vite 进程启动失败时整条命令失败。
- `Ctrl+C` 能结束两个子进程，不留下孤儿进程。
- 日志带 `gaia-ui`、`after-sales` 前缀。
- 子系统未安装依赖时给出明确提示，不在每次启动时隐式更新锁文件。

建议保留以下定向命令用于排错：

```text
yarn dev                 # 同时运行主系统和子系统
yarn dev:main            # 只运行主系统
yarn dev:after-sales     # 只运行售后子系统
```

## 5. 登录、权限与租户

### 5.1 登录会话

顶部菜单按集中配置选择展示方式：

```ts
if (mode === 'legacy') router.push('/afterSales')
if (mode === 'embedded') router.push('/afterSales/<业务路由>')
if (mode === 'standalone') window.location.assign('/after-sales/#/<业务路由>')
```

不在 URL、Hash、localStorage 或 `postMessage` 中传递 Token、租户 ID、角色和权限列表。同域独立访问和同域 iframe 请求都会自动携带 Gaia 会话 Cookie；子系统进入后通过 Gaia 接口确认当前会话。

子系统必须删除 Compass 的 Bearer Token 请求头和通用 `token/account/avatar/role` 本地存储。确需持久化的纯前端偏好使用 `afterSales:` 前缀，例如 `afterSales:theme`。权限和租户信息不得以本地存储值作为授权依据。

### 5.2 权限来源

权限继续以 Gaia 后端为唯一权威：

1. 主系统调用 `/api/sys/Module/tree?categoryCode=pc_web`，无有效售后授权时不显示顶部入口。
2. 已授权用户按当前模式进入旧页面、同域 iframe 或独立子系统。
3. `embedded` 和 `standalone` 模式下，子系统启动后重新获取 Gaia 菜单树、当前用户操作权限及售后领域权限。
4. 子系统从菜单树中提取 `afterSales` 子树，只将已授权且已在本地注册的页面加入路由和侧栏。
5. 页面和按钮按 Gaia 权限结果显示；后端 API 继续执行最终授权、租户和数据范围校验。
6. 未登录、会话失效、无权限和多因子状态按照 Gaia 当前错误码统一处理，不沿用 Compass 的 401 逻辑。

### 5.3 主系统菜单改造

主系统仍使用 Gaia 返回的 `afterSales` 菜单节点判断顶部入口是否可见，并按模式确定目标：

- `legacy`：保持当前行为，将售后菜单解析为 `src/views/afterSales/**/index.vue`。
- `embedded`：保留 Gaia 顶部和侧边菜单，将已授权业务路由映射到唯一 `AfterSalesEmbed` 容器；容器加载 `/after-sales/#/embed/<业务路由>`。
- `standalone`：将售后根节点作为外部子应用入口，跳转 `/after-sales/#/<业务路由>`，不再查找主系统售后页面组件。

同一次运行中每个售后入口必须由唯一模式确定，不得随机进入新旧页面。最终形态确认前保留 `legacy` 页面；确认后再决定冻结、删除或继续保留，不在子系统开发初期提前移除现有成果。

### 5.4 统一接口契约与并行兼容

三种模式共用同一套 Gaia 后端接口，不建设或同步两套后端。后续每个售后功能只维护一份接口契约，至少明确请求和响应 DTO、分页与排序、状态枚举、错误码、菜单和操作权限、租户及业务数据范围、幂等和并发规则。

在 `legacy` 与新子系统并行期间，后端变更必须同时兼容当前页面和子系统页面：优先新增字段，不随意删除、重命名或改变既有字段语义；确需破坏性调整时使用显式版本或临时适配层。新业务页面以子系统为唯一实现，不以人工复制页面作为长期同步方式。

## 6. 构建方案

### 6.1 命令兼容原则

对外保留 gaia-ui 当前命令名称：

```text
yarn build
yarn production
yarn factory
yarn production:saas
yarn factory:saas
```

每个公开命令由根目录 Node 脚本编排两次独立构建。内部可以增加带 `:main` 后缀的主系统命令，避免脚本递归调用公开命令。示意如下：

```json
{
  "scripts": {
    "dev": "node scripts/frontends/dev.mjs",
    "dev:main": "vite --force",
    "dev:after-sales": "pnpm --dir apps/after-sales dev",
    "build": "node scripts/frontends/build.mjs build",
    "build:main": "node --max_old_space_size=6144 ./node_modules/vite/bin/vite.js build",
    "production:saas": "node scripts/frontends/build.mjs productionSAAS",
    "production:saas:main": "node --max_old_space_size=6144 ./node_modules/vite/bin/vite.js build --mode productionSAAS"
  }
}
```

以上为目标结构示意。第一阶段已覆盖五种主构建模式，各自保留原 `*:main`；子系统当前无租户差异，五种入口统一构建子系统 `production`，不将主项目模式名称透传为子系统环境。子系统不得直接读取主项目不相关的环境变量；双方共同使用的 API 相对路径应保持 `/api`。

### 6.2 依赖安装

构建机分别执行：

```bash
yarn install --frozen-lockfile
pnpm --dir apps/after-sales install --frozen-lockfile
```

两套依赖、缓存和锁文件互不覆盖。当前 gaia-ui 已固定 Node 22.23.1 和 Yarn 1.22.22，子系统也采用 Node 22，通常不需要切换 Node；pnpm 版本由子系统 `packageManager` 或 Corepack 固定。

生产服务器只接收静态产物，不安装 Yarn、pnpm 或 `node_modules`。

### 6.3 构建与组装顺序

统一构建流程：

```text
1. 清理本次受控的临时构建目录
2. 构建 gaia-ui 主系统
   └── 输出 gaia-ui/dist/
3. 构建售后子系统
   └── 输出 gaia-ui/apps/after-sales/dist/
4. 将子系统产物复制到 gaia-ui/dist/after-sales/
5. 校验入口和静态资源引用
6. 将根 dist 制作为现有部署包
```

必须先完成主系统构建，再复制子系统产物，因为主系统 Vite 会清理根 `dist`。任意一次安装、构建或校验失败都应使总命令失败，不得留下看似完整的可发布包。

## 7. 构建产物目录

### 7.1 两个独立构建结果

构建过程中存在两个产物：

```text
gaia-ui/
├── dist/                               # 主系统构建结果，随后作为组装目录
│   ├── index.html
│   ├── assets/
│   └── ...
└── apps/
    └── after-sales/
        └── dist/                       # 子系统独立构建结果
            ├── index.html
            ├── assets/
            └── ...
```

### 7.2 组装后的唯一发布目录

```text
gaia-ui/dist/
├── index.html                          # Gaia 主系统入口
├── assets/                             # Gaia 主系统带 Hash 的静态资源
├── favicon.ico                         # 主系统公共资源示例
└── after-sales/
    ├── index.html                      # 售后子系统入口
    ├── assets/                         # 售后子系统带 Hash 的静态资源
    └── ...                             # 子系统 public 资源
```

主、子系统的资源目录物理隔离，可以出现相同文件名，不会互相覆盖。子系统生成的资源引用必须带 `/after-sales/` 前缀，不能错误指向主系统 `/assets/`。

## 8. 部署目录与发布流程

### 8.1 部署后的 Tomcat 目录

沿用当前 PC SaaS 部署结构：

```text
<TOMCAT_HOME>/webapps/
├── ROOT/
│   ├── index.html                      # Gaia 主系统
│   ├── assets/
│   └── after-sales/
│       ├── index.html                  # 售后子系统
│       └── assets/
└── api.war                             # 现有 Gaia SaaS 后端
```

请求映射：

```text
/                         -> ROOT/index.html
/assets/**                -> ROOT/assets/**
/after-sales/             -> ROOT/after-sales/index.html
/after-sales/assets/**    -> ROOT/after-sales/assets/**
/api/**                   -> api.war
```

采用 Hash 路由时，不要求调整 Tomcat 或外层网关的 SPA 回退规则。部署前仍需在实际环境确认外层网关没有拒绝、改写或占用 `/after-sales/`。

### 8.2 发布包

内部虽然执行两次前端构建，对部署平台仍只交付一个包：

```text
ROOT.tar.gz
└── ROOT/
    ├── index.html
    ├── assets/
    └── after-sales/
```

现有 `push.sh` 中 `dist -> ROOT -> ROOT.tar.gz` 的后半段可以继续使用；需要调整的是前置安装和构建阶段：增加子系统 pnpm 冻结安装，并确保 `yarn production:saas` 已输出组装完成的根 `dist`。

后端 `api.war`、数据库、Redis、HTTPS 证书和域名部署均不因本改造发生变化。

## 9. 对其他租户和性能的影响

没有售后菜单权限的租户不会进入 `/after-sales/`，浏览器也不应请求其 JavaScript、CSS 和图片。因此：

- 主系统首屏下载体积原则上只增加极小的菜单跳转代码。
- 子系统依赖不会进入主系统 Bundle。
- 服务器、镜像或发布包会增加一份子系统静态文件，但共享 SaaS 部署只存储一份，不按租户重复存储。
- 当前完整 Compass Admin 产物约 11 MB；只搬前端底座并清除无关模块后应显著小于该值，准确增量以首次正式构建统计为准。

发布验收应使用一个无售后授权租户检查 Network，确认没有预加载 `/after-sales/` 资源。

## 10. 改造实施顺序

### 阶段一：建立独立工程

1. 保持 `legacy` 为默认模式，不修改当前售后菜单和已开发功能。
2. 新建 `apps/after-sales/`，固定 Node、pnpm 和 Vite 版本。
3. 完整复制 Compass Admin 基线后受控删减，保留应用外壳、组件和样式，清除登录、权限和业务依赖。
4. 配置 `/after-sales/` Base、Hash Router 和相对 `/api` 请求。
5. 解决或本地化必要的 `workspace:*` 类型和常量，不扩大到 Gaia 根 workspace。

### 阶段二：接入 Gaia

1. 实现 Gaia 会话、菜单、操作权限和领域权限适配器。
2. 接入 Gaia 统一的未登录、会话失效、无权限和多因子处理。
3. 迁移售后页面、API 和必要通用组件。
4. 建立菜单 code 到子系统本地路由组件的白名单注册表；未知 code 失败关闭。

### 阶段三：增加双展示入口

1. 建立唯一展示模式配置和主系统菜单路由策略。
2. 增加 `AfterSalesEmbed` 通用容器和子系统 `EmbeddedLayout`，不为每个功能复制 iframe 容器。
3. 验证 `embedded` 和 `standalone` 使用同一子系统页面、API Client 和权限适配器。
4. 保持 `legacy` 可切换；确认最终形态后再决定旧页面去留。

### 阶段四：统一运行和构建

1. 增加本地双服务启动脚本和 `/after-sales/` 开发代理。
2. 将五种现有构建模式接入统一编排脚本。
3. 调整构建机或 `push.sh`，分别冻结安装 Yarn、pnpm 依赖。
4. 增加产物组装和结构校验，仍输出根 `dist`。

### 阶段五：发布与回退验证

1. 部署一个包含 `/after-sales/` 的完整前端包。
2. 分别验证 `legacy`、`embedded`、`standalone` 的路由、API、登录返回、刷新和静态资源。
3. 用允许和拒绝账号验证三种模式下的菜单、直达 URL、按钮、API、数据范围和租户隔离。
4. 验证 iframe 的滚动、弹窗、下载、打印、返回键和 CSP。
5. 确认旧版完整前端包可整体回退，不混用新主系统与旧子系统产物。

## 11. 必要验收清单

### 11.1 构建与产物

- 主项目和子项目分别执行冻结安装成功。
- `yarn dev` 能同时启动两个项目，退出时无残留进程。
- 五种根构建命令的模式映射正确，任一子构建失败时整体失败。
- `dist/index.html`、`dist/after-sales/index.html` 均存在。
- 子系统 HTML、JS、CSS 和公共资源只引用 `/after-sales/` 下的静态文件。
- 发布包不包含 `node_modules`、源码、开发环境配置或密钥。

### 11.2 路由与导航

- `legacy` 模式继续进入当前 `src/views/afterSales` 页面。
- `embedded` 模式保留 Gaia 菜单，只在内容区加载 `/after-sales/#/embed/<业务路由>`。
- `standalone` 模式从 Gaia 顶部入口进入 `/after-sales/#/<业务路由>`。
- 子系统内部导航、刷新、复制深层链接和返回主系统正常。
- 未授权用户不显示售后顶部入口。
- 未授权用户直接输入子系统 URL 时得到无权限结果，不能进入业务页面。
- 模式切换由单一配置决定，不在菜单和页面内散落分支。
- `embedded` 与 `standalone` 使用同一业务页面，不存在第二份 iframe 业务实现。
- iframe 高度、滚动、弹窗、下载、打印、全屏、返回键和 CSP 按适用范围验收。

### 11.3 登录、权限和租户

- 已登录用户进入子系统无须二次登录。
- URL、Storage 和请求参数中不存在前端传递的用户权限与租户身份。
- 会话失效后按 Gaia 规则返回主系统登录流程。
- 页面、按钮和 API 的允许／拒绝账号结果一致。
- 修改或撤销权限后，后端接口立即拒绝旧权限操作。
- 跨租户、跨门店、跨服务站和越权直调均由后端拒绝。

### 11.4 部署与性能

- 当前 Tomcat `ROOT` 部署方式可直接提供 `/after-sales/` 静态资源。
- 实际外层网关不会改写或阻断 `/after-sales/`。
- 无售后权限租户加载主系统时不请求子系统资源。
- 记录改造前后根发布包大小、主系统首屏资源和子系统首次加载资源。
- 新版整体发布和旧版整体回退均验证成功。

## 12. 风险与控制

| 风险 | 控制措施 |
| --- | --- |
| Compass 业务依赖被整包带入 | 只迁移前端底座，按依赖白名单审核 |
| 主、子系统 Token 或 Storage 冲突 | 不保存 Compass Token；本地键统一使用 `afterSales:` 前缀 |
| 主系统构建清空子系统产物 | 先构建主系统，最后复制子系统到根 `dist` |
| 子系统资源错误引用根 `/assets` | 固定 Vite `base=/after-sales/`，构建后自动校验 |
| 刷新深层路由 404 | 首版使用 Hash Router |
| 菜单可见但接口越权 | 前端只负责体验，后端继续作为最终授权边界 |
| 动态菜单进入错误展示形态 | 使用唯一 `legacy/embedded/standalone` 配置集中选择路由策略 |
| 新旧页面并存造成结果不一致 | `legacy` 作为迁移基线冻结；新功能只在子系统实现；后端接口保持并行兼容 |
| iframe 出现双滚动、布局或浏览器能力异常 | 由通用容器和 `EmbeddedLayout` 一次适配，并专项验收打印、下载、全屏等能力 |
| iframe 被 CSP 或响应头阻止 | 发布前验证同域嵌入策略，只允许受控的 `/after-sales/` 来源 |
| 子系统构建失败却发布旧残留 | 构建前清理受控目录，失败即终止，并校验产物生成时间 |
| 发布包增大 | 清理无关 Compass 模块；无权限租户不预加载子系统资源 |

## 13. 不在本方案内的事项

- 不建设新的售后后端服务或独立认证中心。
- 不改变 Gaia Shiro、租户上下文、菜单配置和 API 权限的权威地位。
- 不引入 qiankun 或运行时模块联邦；iframe 只用于受控同域的 `embedded` 备选展示模式，不加载任意外部系统。
- 不为 `embedded` 和 `standalone` 人工复制两份新业务页面；二者必须复用同一子系统实现。
- 不要求主、子项目统一 Vue、Vite、Router、状态管理或包管理器版本。
- 不将内部两个前端构建结果分别发布为两个独立线上版本。
- 不在本方案阶段改变售后业务范围、菜单 code、角色规则和数据范围规则。

## 13. 第一阶段实施与验证（2026-09-08）

本次授权范围为独立底座抽离，同时提前完成第 10 节的统一运行／构建工作。其余目标章节中的会话、权限、业务迁移、embedded 和三模式均未实施，也不代表已发布。

- 来源 `gaoge-compass` 分支 `main`，HEAD `ac0dd29103eedb2ec23278d7d152ae6833c37e4f`，工作区干净；相对缓存 upstream ahead 1 / behind 1，未 fetch、checkout 或 reset。来源全程只读。
- 目标 Gaia HEAD `a96dedec20b9c1ec7405cf3ff8e3a16e4d142f5e`，开始时工作区干净；公共子模块仍为 `3e210c97deb8064e596adbf3d5c2c60671cb7477`。未提交或推送。
- 新增 `apps/after-sales/` 单包工程和 `scripts/frontends/` 编排／校验；根仅修改 package scripts、Vite 售后代理和 push.sh 前置安装及失败即停。现有 `src/views/afterSales`、主菜单／路由、主布局、`src/views/common` 和 yarn.lock 均未修改。
- 保留原 Admin Layout、Pinia 基础 Store、UI / CRUD / display / 参数化上传、composables、主题、UnoCSS、SVG / Iconify、403 / 404 / reload 和加载／空状态。删除全部来源 ERP 页面／API、登录用户状态、服务端导航、共享业务包、认证协议、mock 与埋点。
- 新入口 `/after-sales/#/` 仅有“售后服务”首页。品牌统一蓝鲸数字，Logo 和 favicon 从 Gaia Logo 复制；内部 `.gaoge-form` / `--gaoge-form-control-height` 和指南针图标标识保留，具体见[子系统 README](../../../frontend/gaia-ui/apps/after-sales/README.md)。
- Node 22.23.1、pnpm 10.8.1；独立冻结锁文件。为 SVG 插件补齐其漏声明的 fast-glob，仓库外 `/tmp` 隔离副本冻结安装与 typecheck + production build 通过，确认不依赖主 node_modules。

| 验证 | 实际结果 |
| --- | --- |
| 子系统安装、冻结安装、typecheck、production build | 通过；本机使用 Node 22.23.1 和 Corepack 固定 pnpm |
| 保留底座测试 | 31 项通过（菜单、主题、图标、日期、表格动作） |
| 原主项目构建 | `yarn build:main` 通过 |
| 根统一构建 | `yarn production:saas` 通过；其他四种保留原模式映射，未逐一完整构建 |
| 产物校验 | 根入口、售后入口和 HTML 静态引用通过；缺失文件、错误 Base 和路径越界的校验测试通过 |
| 统一开发与 HMR | 7004 主入口、代理售后入口、9010 售后入口、favicon 和浏览器提示 CSS 均为 200；两端 HMR connected |
| 进程退出 | SIGINT 返回 130 且 7004 / 9010 均释放；9010 端口冲突返回 1 并清理 7004 主服务 |
| 浏览器售后底座 | Logo、名称、完整布局、唯一售后入口通过；冷启动控制台无警告／错误；Network 原域名过滤 0 / 208 |
| legacy 保持 | 源码／主路由／公共子模块无差异、主构建通过；本机 8080 后端拒绝连接，真实登录菜单页面验收未完成 |

实际产物为根 `dist/index.html`、`dist/assets/` 和 `dist/after-sales/{index.html,assets/,brand-logo.png}`。子系统约 4.0 MiB，整个根 dist 约 67 MiB，均不含 node_modules。保留的大型通用 UI chunk 和主项目原有编译提示未作为错误隐藏。

本次未执行 push.sh 后半段上传、生产部署、业务写入或权限配置。Windows cmd/taskkill 分支已实现，尚未 Windows 实机验证。此结果不增加业务功能完成数，不表示售后会话或三模式已接入。

补充本地启动核验：用户开启 VPN 后，按原脚本启动独立 Redis 16379 并重新装配后端，两次 Maven 构建通过，未修改本地代理或数据库配置。现有数据库 TCP 端口可达，但 JDBC 握手持续返回 EOF（未收到 MySQL 响应），后端 8080 未成功监听；已停止本次失败启动，避免持续重试。主／子前端仍按原配置运行，legacy 登录页面验收仍受后端连接阻塞。未改动后端已有 `.gitignore`、宿主 POM 或本机配置。

启动体验修正：已移除子系统浏览器推荐提示 HTML、IE 检测及 browser_upgrade 资源，避免刷新时闪现；保留加载动画。子系统构建与根产物校验通过，浏览器要求及未验收的最低版本边界记录在子系统 README。

品牌调整：按用户指定图片下载为子系统 `public/brand-logo.png`，页面 Logo 与 favicon 共用同一同域静态资源，不运行时依赖测试域名。子系统名称及首页浏览器标题统一“蓝鲸数字售后服务”，业务菜单仍为“售后服务”；已调整标题区宽度，完整名称横向展示。子系统构建和合并产物资源校验通过，Chrome 页面 Logo 加载正常。

### 2026-09-08 补充：子系统菜单沿用主系统授权

用户确认子系统必须依据主系统登录账号的角色权限展示菜单，取代第一阶段公开静态首页：

- 独立保存已确认的49项功能与4个岗位工作视角、管理员导航入口，不跨应用导入源码。菜单名称与分组由前端规划清单定义；可见性来自当前登录账号的后端 `/api/sys/Module/tree`，不读取角色模板作为授权。
- 同源入口 `/after-sales/` 复用主系统 `localStorage.token` 与原始 Authorization 请求头，每次路由导航重新获取授权；校验售后根、功能和视角的 code/path，过滤停用/隐藏菜单、空分组。管理员导航权限不替代功能权限。未授权直达、未登录、接口失败均关闭菜单；跨标签页更换账号或退出时清空菜单并重载。
- 首页提供已授权的工作视角选择与功能入口，各功能使用独立路由和“待接入”页面；服务结算保留“待启用”。仅完成导航与访问控制，不代表业务切片验收/开放，不修改正式菜单、角色或租户数据。
- 应从与主系统同一主机名和端口的7004统一入口进入；9010为内部开发服务，不作为共享登录态入口。后端、数据库、本地启动配置保持原方式。
- 验证：39项测试、类型检查和生产构建通过；本地真实接口不可用时关闭菜单并显示重试入口。使用独立9012测试服务验证菜单布局与授权差异，测试数据不进入应用代码或正式后端。真实账号授权联调仍受本地后端数据库连接问题阻塞，不能以隔离验证替代。

### 当前临时设置：关闭子系统菜单权限

用户随后要求临时关闭子系统权限。`apps/after-sales/.env` 已设 `VITE_APP_MENU_PERMISSION=false`：跳过登录/Module/tree和前端路由授权，展示49项规划菜单，管理员导航名称改为“全部功能”。保留正式授权实现，值改回 true 并重启/重新构建即可恢复；缺省值为启用。此配置不修改后端、数据库、主系统或 API 权限。已通过39项测试、类型检查、生产构建及浏览器实际全菜单显示验证。

### 子系统菜单层级、图标与导航模式

用户确认子系统不再显示重复的“售后服务”一级菜单。菜单数据直接使用工作台、客户服务等分组为第一层，默认 `head` 顶部导航，默认展示工具栏导航模式切换按钮；可切换单侧栏且保留分组。49项功能和全部工作视角分组配置本地打包的统一 Lucide 图标，首页入口与标签同步使用。浏览器核验顶部重复菜单消失、功能图标显示、两种模式切换正常；39项现有测试、类型检查、构建及合并产物校验通过。临时关闭菜单权限配置保持不变。

### 商品分类/商品档案接入

两个原主系统功能已迁入子系统真实路由，业务字段、校验、API与版本规则复用，视觉装配使用子系统已有原生组件和composables。根据用户明确要求，不复制commonV2。新增同源登录请求适配，业务接口权限保持后端判定；菜单全量预览不等于业务放行。46项测试、构建和既有H2后端接口/浏览器隔离验证通过；后端源码与配置未修改，正式MySQL连接仍受握手EOF阻塞。详细证据见商品/分类首版Spec第11节。
