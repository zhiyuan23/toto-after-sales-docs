# TOTO 全栈联调手册

本页维护跨仓运行顺序和验收入口。各仓库具体技术约定与命令以源码、配置及其 README 为准。2026-09-06 已核对文档和脚本；本页不声明真实业务联调已通过。

## 1. 环境与命令入口

所有命令均在表中对应仓库根目录执行。两个前端的 Node 和包管理器不同，不在工作区强制统一版本。

| 仓库 | 已核对的工具约束 | 常用命令与说明 |
| --- | --- | --- |
| `gaia-after-sales` | JDK 21、Maven 3.9.x、Gaia 父 POM `3.5.0-SNAPSHOT` | `mvn -B -o verify`；缓存不全时配置好内部制品源后使用 `mvn -B verify` |
| `gaia-after-sales-uni` | Node `>=24.19.0 <25`，`.nvmrc` 为 `24.19.0`；pnpm `10.34.5` | `pnpm install --frozen-lockfile`；`pnpm tenant:check TOTO`；`pnpm dev TOTO` 或 `pnpm dev:h5 TOTO` |
| `gaia-ui` | `package.json` 的 Volta 固定 Node `22.23.1`、Yarn `1.22.22`，有 `yarn.lock` | `yarn install --frozen-lockfile`；`yarn dev`；`yarn build`。本次仅核对入口，未重新安装或启动 |
| `gaia-saas-proj` | JDK 21、内部 Gaia 制品；Web JAR 为默认售后宿主 | 装配前提满足后执行 `mvn -B -pl gaia-saas-web-jar -am verify`；入口 `com.ehsure.gaia.WebApplication` |

开始任务时分别检查 Git 状态；管理后台同时检查 `git submodule status`，保留 `src/views/common` 的已有变化。私服认证使用开发者本机 Maven settings，不写入 POM。

## 2. 真实联调的前置条件

以下事项在首次业务联调前核实并更新“当前状态”，未确认项不影响空骨架构建。

| 项目 | 获取或核实方式 | 当前状态 |
| --- | --- | --- |
| 业务身份与权限 | 经确认的功能 Spec；核对宿主会话拦截和 `gaia-sys` 权限配置 | 待确认售后身份、菜单、API 与资源权限 |
| TOTO 测试环境 | 从项目环境负责人获取配置；核对宿主实际加载的 profile、数据库和 Redis | 获取入口、测试数据源与可用性待确认 |
| 小程序 AppID 与接口地址 | 从项目及微信平台配置负责人确认，更新 `build/tenant/profiles/toto.ts` | 当前 `touristappid`、`https://example.invalid/` 和租户编码仍为占位 |
| 管理后台请求地址 | 核对 `gaia-ui` 的 Vite 代理、环境变量、请求封装和目标宿主上下文 | TOTO 联调地址待验证 |
| 测试身份和数据 | 准备可追踪的脱敏业务数据、不同权限身份及必要的跨租户测试条件 | 待需求确认后准备；账号获取方式待落实 |
| 数据结构与菜单交付 | 核对目标环境迁移、初始化与恢复机制，在功能 Spec 中明确动作 | 待首个相关功能确定 |

文档只记录配置项、配置文件位置与获取方式，不保存密码、令牌、私钥或完整环境配置。小程序 `VITE_` 与 profile 会进入客户端；本地覆盖方法见[小程序 README](../../mobile/gaia-after-sales-uni/README.md)。

## 3. 后端修改如何进入运行宿主

本节适用于已确认需要接入宿主的功能；当前售后工程只有普通 JAR，没有启动类和真实 API，也尚未加入宿主依赖。

1. 在功能 Spec 中确认 `api`、`xcx-api` 的实际使用范围；首次接入时在宿主根 POM 配置对应版本/依赖管理，并在 `gaia-saas-web-jar/pom.xml` 引入所需模块。
2. 在售后仓库执行 `mvn -B install`，将父子制品一起安装到本机 Maven 仓库。它包含 verify 阶段；同一份源码已成功 install 时无需重复 verify。只做文档修改不需要 install。
3. 在宿主执行 `mvn -B -pl gaia-saas-web-jar -am verify`，再按已核实的测试环境配置启动或重启 `WebApplication`。其他独立 Gaia 仓库不在该 Reactor 内，缺失的依赖仍需单独取得。
4. 核对运行中实际依赖的售后版本、包扫描、拦截器和租户上下文，再请求功能 Spec 中的接口并从页面验收。

仅重启宿主不会自动使用售后仓库未安装的新源码。连续修改可以集中安装一次；如果只修改页面，不需要安装后端制品。

宿主当前打包目标可在 `gaia-saas-web-jar/pom.xml` 核对；具体启动参数、测试 profile 和健康检查 URL 在首次真实联调时结合当前配置确认后补入本页。不要直接沿用历史环境参数。最终 URL 需同时核对前端 base URL/代理、Servlet context path 和 Controller mapping，避免漏加或重复添加 `/api`。

## 4. 页面与接口联调

- 管理后台：核对菜单组件路径与 `src/views/afterSales` 实际页面一致；同时验证按钮和后端 API/资源权限。测试菜单的配置动作应属于已确认范围。
- 小程序：API 模块使用通用请求内核及相对路径，核对 profile 的域名和 `x-tenant`。响应包装、会话头、失效处理以确认后的售后契约为准，不从其他小程序直接复制身份模型。
- Mock：标明字段、状态和异常来自哪个契约；记录未接通部分，不作为真实数据、权限或租户验证证据。
- 微信：H5 成功不能替代微信开发者工具、合法域名及真机验证；按功能风险验证授权、上传等平台行为。普通构建不会自动上传或发布。

## 5. 按改动选择验证

| 改动范围 | 必要检查 |
| --- | --- |
| 仅文档、说明入口 | 链接和命令对照、规则一致性；仓库内文件执行 `git diff --check`，工作区文档单独核对差异及空白；通常无需构建 |
| 售后后端源码或 POM | `mvn -B verify`（可离线），按业务规则和权限风险补充测试；需要宿主联调时按第 3 节执行 install |
| 小程序源码 | `pnpm type-check`、`pnpm eslint`、`pnpm stylelint`；业务逻辑按风险运行相关测试 |
| 小程序租户、请求、产物或发布脚本 | 在源码检查基础上运行 `pnpm test:tenant`、`pnpm tenant:catalog:check` |
| 小程序共享启动链、配置或样式 | 上述适用检查及 `pnpm build TOTO`、`pnpm build:h5 TOTO`，检查页面表现 |
| 小程序依赖或锁文件 | 冻结安装及 `pnpm run audit`，兼容性变化增加双端构建；当前审计限制见小程序质量文档，不自动接受风险 |
| 管理后台页面/API | 对修改文件执行非修复 ESLint（如 `yarn exec eslint src/views/afterSales/具体页面.vue`），执行 `yarn build` 和相关页面/权限验收；当前没有现成独立 type-check/test 脚本 |
| 宿主装配或配置 | 定向 Maven verify、依赖和扫描检查；在已确认测试环境验证启动与真实接口，按风险检查权限和租户隔离 |

小程序完整本地验证可使用 `pnpm verify`；它不包含真实依赖审计，需要时另跑 `pnpm run audit`。管理后台的 `lint-fix` 会修改源码，不作为只读检查。相关仓库均执行 `git diff --check`。

完成时把命令、环境、日期、实际结果及未验证项记录到功能 Spec。环境受阻时准确记录阻塞和已完成的独立检查，不把跳过项标为通过。
