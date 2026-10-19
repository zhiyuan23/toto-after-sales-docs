---
type: "llm-wiki-operation"
topic: "TOTO售后服务"
status: "active"
updated: "2026-10-19"
owner: "shared"
confidence: "medium"
belongs_to:
  - "kb:project:toto-after-sales-docs"
sources:
  - "2026-10-19 用户补充售后服务助手第三套账号；合并承载后台四角色，本轮仅预存配置，尚未开发。"
  - "2026-10-19 用户提供两套新小程序账号资料，替换两端 AppID、上传私钥及本机后端私密配置；不含共享发布。"
  - "本仓库既有文档：local-development.md；格式整理不表示重新验证业务与运行事实。"
tags:
  - "llm-wiki"
  - "TOTO"
  - "开发入口"
schema_version: "2"
id: "kb:project:toto-doc-207282be2a41e073"
created: "2026-09-07"
sensitivity: "internal"
---

# TOTO 全栈联调手册

本页维护跨仓运行顺序和验收入口。各仓库具体技术约定与命令以源码、配置及其 README 为准。2026-09-18 已将管理后台、消费者小程序和服务人员小程序收敛到同一个本地后端启动链；本页不声明真实业务联调已通过。

## macOS/Linux 本机前后端 + 测试数据库（2026-09-08）

本节的统一启动器和防重复 JVM 逻辑只适用于当前 macOS/Linux 本地工作区，脚本在 Windows 上会拒绝运行。Windows 同事仍使用自己的 Windows/IntelliJ 本地启动方式；下文的 `yarn dev:full`、`yarn dev:afs` 与 `start-local-backend.sh` 操作要求不作为 Windows 启动步骤。

本机售后管理前端 `http://127.0.0.1:9010/after-sales/#/`（用户明确要求时另启动 7004 主系统）、消费者小程序和服务人员小程序 → 同一个本机后端 `http://127.0.0.1:8080/api` → 用户指定的 MySQL 测试库。原 `10.1.1.53:8011` 是远程 HTTP 服务入口，不是数据库连接地址，本模式不经过该远程后端。

- 后端使用 `gaia-saas-proj/gaia-saas-web-jar`，已补入 `gaia-after-sales-api` 依赖。售后仓库当前也有独立 `gaia-after-sales-web`，但它不包含完整管理端基础能力，本模式仍由聚合宿主提供接口。
- 数据库凭据只保存在宿主 `.local/application.properties`，目录已忽略，文件权限为 `600`。不要提交、分享或把密码复制到前端环境变量。连接使用 TLS 加密；当前 `sslMode=REQUIRED` 不等同于已配置 CA 和服务器身份校验。
- 新版两端小程序及Web地址解析共用外部服务配置中的高德Web服务Key 和售后后端 `AmapReverseGeocodeClient`；消费者接口从结果取当前城市，服务人员地图逆解析接口取完整地址；现场签到只保存 GCJ-02 经纬度及精度／授权事实，不调用逆解析、不要求省市区和详细地址。后续需要签到位置地址时可由后端按已保存坐标调用公共客户端，解析结果不得自动覆盖工单地址。当前默认SERVER模式从后端私密文件读取Web服务Key，不进入小程序或前端制品；修改凭证须重启实际宿主，页面开关／模型保存后下一次调用生效。DATABASE网页凭证管理仅供未来运维显式启用，缺失不跨来源回退；升级边界见[外部配置指南](specs/2026-09-18-售后AI外部配置与部署指南.md)。
- Web 使用 `VITE_API_URL=http://127.0.0.1:8080/api/`；两个小程序的 `pnpm dev`／`pnpm dev:h5` 默认注入 `GAIA_API_BASE_URL=http://127.0.0.1:8080/api/api`。宿主部署 context 为 `/api`、控制器路径也以 `/api` 开头；小程序通用请求合并重复完整段后，实际请求仍为 `/api/api/...`。本机已有 `.env.development.local` 的旧 `/api` 基址需同步更新；Web 基址和代理规则独立，不能用单层 HTTP 200 判断接口存在。
- 售后认证／日志／配置的模块边界见[宿主隔离契约](specs/2026-10-17-售后宿主模块级隔离.md)：运行日志新增独立 `after-sales.log`，公共 `all.log`／`error.log` 格式保持；真实私密配置位置不变。
- Redis 使用独立本地端口 `16379`，不连接共享测试 Redis，也不占用已有的 `6379`。自动改表、业务启动初始化、日志消费者、租户同步订阅和通知已在本机配置中关闭。

2026-10-10 本机授权快照 15 秒超时排查：实际测试库连接曾被 Clash gVisor TUN 接管，即便策略为 DIRECT、系统代理有内网例外也仍走 `utun0`。经用户授权，仅将 `10.1.1.106/32` 加入 Clash Verge 的「虚拟网卡模式 → 排除自定义网段」，路由已改走 `en0`；授权复测成功但仍耗时 32.565 秒，物理网关亦有延迟抖动，故障尚未关闭。用户选择先保留诊断，待稳定内网连接后复测；详见[诊断与恢复方式](specs/2026-09-30-Web统一账号授权快照.md#local-authorization-timeout-20261010)。
- 本机与共享测试服务器连接同一测试库时，完工审核、自动派站／派人等任务会被各自活跃的后台执行器竞争领取；任务由本机接口创建，不保证由本机执行。修复此类任务后须核对所有共库执行实例的实际规则版本，本机重建成功不能替代共享发布。未经发布／协调授权，不停止其他实例或改写历史审核记录。2026-10-03 事实与处理见[无配件审核复验](specs/2026-10-01-完工智能与AI审核.md#shared-worker-version-check)。
- 当前新版AI分站／派人／完工审核／消费者助手统一读取后端私密配置中的 `gaia.after-sales.ai.api-key`，默认来源为 `SERVER`；更换凭证须重启实际宿主，网页只维护开关／模型和测试连接。加密表保留非敏感设置及历史密文，同库新版实例仍须使用同一私密加密主密钥。未升级共享包仍读取旧文件属性，2026-10-13缺失排查保留为历史记录；当前配置与上线方式见[外部配置指南](specs/2026-09-18-售后AI外部配置与部署指南.md)。
- 普通开发连接具有写权限，页面的保存、删除会真实影响共享测试库。正常功能开发所需的测试库迁移、对应菜单／操作权限和可追踪测试数据，已获持续授权；执行前必须确认当前连接的目标库、核对脚本影响与依赖、准备适用备份或回退方案，执行后回读并记入功能 Spec。清库、大范围破坏性或跨功能批量修改及生产库操作仍须单独明确授权；建议后续由 DBA 提供限定库权限的开发账号替代 root。

### 启动与断点调试

日常调试遵循[本地调试优先复用](AGENTS.md#本地调试优先复用)：先核对已有服务的项目、代码目录／工作树、地址、后端连接和健康状态，并确认本次修改已生效；满足条件时直接使用已有服务和页面，不重复执行启动命令。页面不可访问时先排查原因；不同角色验证可在独立浏览器会话中访问同一服务。

日常 Web 开发与验证在所需环境未启动时，默认在本仓库 `docs/toto` 或 `frontend/gaia-ui` 下运行：

```bash
yarn dev:afs
```

在 `http://127.0.0.1:9010/after-sales/#/` 独立入口完成页面、交互、菜单和权限验证，不启动 7004 主系统，不默认重复验证主系统 iframe 入口或角色勾选树。只有用户主动明确要求主系统验证时才扩大范围；菜单与权限变更仍需核对 Gaia 配置并验证子系统及真实接口的允许／拒绝行为。此规则不改变测试环境完整部署及发布后检查。

确认需要启动或重启后，只执行所需入口的一条命令：售后 Web 默认用 `yarn dev:afs`，只用某个小程序用其对应的 `pnpm dev` 命令；用户明确要求主系统验证时，才在 `frontend/gaia-ui` 使用 `yarn dev:full`。它们共用启动器与同一个 8080 后端；不要再叠加手工执行 `start-local-backend.sh` 或 `java -jar`。已有健康且源码版本一致的后端会被复用；源码变化时由启动器先停旧实例再启动新实例。部分服务已运行时，先核对启动器行为，只补齐缺失部分；需要保留前端而仅补齐后端时，可按下文手工入口单独启动，不能无谓重启整套环境。确需重启已有服务时先说明原因及对 Web／两端小程序的影响，按已有授权执行。

完整 Web 联调命令及行为说明：

```bash
yarn dev:full
```

该命令会先关闭上一轮仍占用 7004/9010 的本工作区 Vite 进程，再调用 `scripts/local-backend.mjs`。启动器对共享 `gaia-sys`、售后模块、聚合宿主的 POM 与 `src/main` 以及后端启动脚本计算内容指纹：8080 同时具备 Web／移动能力、属于本工作区受管运行包且指纹与当前源码一致时才复用；源码变化时会在跨项目启动锁内安全关闭旧 JVM、重新安装宿主依赖的 Gaia 系统模块与售后模块并装配宿主；端口属于其他程序时明确列出 PID 并拒绝强杀。若本机限制 `ps` 读取命令行，启动器会结合进程工作目录及其已打开的本工作区运行 JAR 校验归属，无法确认时仍拒绝自动关闭。最后启动 7004 主系统和 9010 售后子系统前端。后端首次装配通常需要约 1–2 分钟；本次目标测试库冷启动包含大量类扫描和售后主键水位核对，实际更久，启动探针等待上限已调为 12 分钟。出现“已就绪”日志后访问 `http://127.0.0.1:7004/`。共享 Redis 和后端独立常驻，`Ctrl+C` 只停止本次前端，不影响同时运行的两个小程序。该入口依赖当前跨仓目录结构以及本机 bash、JDK 21、Maven、Redis、lsof，仅支持 macOS/Linux。

启动器会在锁内检查本工作区超过 20 分钟、未监听 TCP 端口的旧运行 JAR：只有 JAR 文件名 PID、进程命令或已打开文件及工作目录全部匹配时才停止残留 JVM。本次拉起的新进程如果未能通过就绪检查，也会在核对进程和运行 JAR 后停止；记录成功状态时要求监听 PID 与本次启动 PID 一致。直接运行 `start-local-backend.sh` 时，若 8080 已被占用会在构建前和启动 JVM 前拒绝重复启动。VS Code 的 Java 语言服务不属于该后端启动链，不会被清理。

只运行售后子系统且尚未启动时，优先在本工作区 `docs/toto` 根目录执行：

```bash
yarn dev:afs
```

本目录命令只转发到 `frontend/gaia-ui` 的 `yarn dev:afs`；继续在 `frontend/gaia-ui` 根目录执行同名命令也保持有效。它使用同一个公共启动器确保 16379 Redis 和 8080 Gaia 聚合后端，然后只启动 9010 售后子系统，不启动 7004 主系统。9010 就绪后自动打开 `http://127.0.0.1:9010/after-sales/#/`。后端已由任一小程序启动时直接复用；由该命令启动后，再启动任一小程序也不会重复启动。

两个小程序分别在各自仓库执行下列命令；两条命令都先确保同一个 8080 后端，再启动对应微信或 H5 前端：

```bash
pnpm dev TOTO
pnpm dev:h5 TOTO
```

若后台、小程序同时启动，最先取得启动锁的项目负责拉起或更新后端，其他项目等待健康检查和源码指纹一致后复用。退出任一前端都不关闭共享后端。仅显式传入 HTTPS `GAIA_API_BASE_URL` 时按远端联调处理，不启动本地后端。

只有需要分别调试进程或补齐缺失服务、且确认对应端口未启动时，才使用下面的手工命令；完整启动和常规重启使用上面的统一入口。所有服务仅监听本机：

```bash
redis-server --bind 127.0.0.1 --port 16379 --protected-mode yes --save '' --appendonly no
```

在本工作区 `docs/toto` 下启动后端；脚本先清理并安装宿主依赖的 Gaia 系统模块与售后模块，再打包宿主，并将可执行 JAR 复制为 `.local/runtime/` 下的本次运行副本后启动，避免后续 Maven 打包覆盖 `target/gaia-web.jar` 时破坏运行中 JVM 的延迟类加载。这里只做构建并跳过测试，不代表业务测试通过：

```bash
bash scripts/start-local-backend.sh
```

本地后端每次运行的构建与控制台输出写到 `backend/gaia-saas-proj/.local/logs/shared-backend-<PID>.log`，单文件最多 16 MiB，保留最近 5 份已结束进程的日志。应用自己的 Logback 文件仍在 `.local/logs/gaia_saas/` 按大小滚动。启动失败时同时检查 `.local/logs/shared-backend-bootstrap.log`；旧版无上限的 `shared-backend.log` 不再使用。

在 `frontend/gaia-ui` 下启动前端；当前根项目和售后子项目均使用 Node 24.21.0；根项目使用 Yarn，子项目使用 pnpm：

```bash
yarn dev --host 127.0.0.1 --port 7004 --strictPort
# 根命令现在同时启动 9010 售后底座；仅主系统可用 yarn dev:main
```

`yarn dev` 分别读取主系统和售后子项目的工具配置；当前两者均固定 Node 24.21.0。启动器优先从当前进程、PATH、NVM、Volta 及 Homebrew 版本目录查找精确版本，只给对应子进程注入独立 PATH，不切换或改动全局默认 Node。首次使用前安装 `nvm install 24.21.0`；指定版本缺失时会明确失败。包管理器及锁文件继续分别维护。

后端断点调试：先停止占用 `8080` 的后端，在 VS Code 中打开 `gaia-saas-proj`，选择本机新增的 `TOTO 本地后端 · 测试数据库` 启动项。不要选择未加载 `.local/` 的旧启动项。断点入口与 JAR 启动二选一；修改售后模块后重新安装模块并重启宿主。前端页面变更由 Vite 热更新。

### 管理后台权限

2026-09-08 用户确认后端菜单功能已配置完成，前端本地菜单注入和后端白名单放行均已删除。本机 `.local/application.properties` 不再包含售后临时权限项；管理后台菜单、工作视角和 `/api/afterSales/**` 接口统一按 Gaia 模块／操作及其 `apiList` 配置校验。后续开发账号需要在正常角色权限中授权，不再通过本地用户名白名单绕过。

### 小程序 H5 的阶段性开发身份

小程序业务功能开发期优先编译为 H5 调试，真实微信登录与完整动态权限可延后到集成测试前接入。实施时为消费者端和服务人员端各准备一个固定开发用户，让业务数据分别在两个真实数据归属上流转。服务人员端已确认使用 `gaia-customer-service-uni`，业务账号仍须按身份与权限 Spec 建立。

- 开发身份应通过后端仅 development profile 开放的白名单适配器转换为正常会话或 Token，并赋予当前业务切片所需的最小固定开发权限集；H5 只选择约定别名，不传任意 `userId/tenantId/权限码`，不在源码或共享配置提交密码、Token 和数据库主键。
- 业务 API 从第一版就读取统一身份上下文，校验当前身份的固定开发权限集，并在后端执行租户、本人、门店和服务站范围约束。该通道只暂时替代真实登录和动态角色来源，不替代业务授权，也不允许用全局共享数据绕过归属。
- 开关默认关闭，只允许本地 H5 开发使用；测试、演示、微信和生产构建必须失败关闭。开始实现时应增加构建／配置检查，防止开发通道进入非本地产物。
- 固定身份不计真实登录或权限验收。进入集成测试或演示准备前，切换到真实登录和角色配置，补验未登录、会话失效、跨用户、跨角色和跨租户场景，然后删除或保持关闭开发通道。

消费者端固定身份已形成源码切片。仅在本机聚合宿主的忽略配置 `.local/application.properties` 中设置 `after-sales.consumer.dev-login.enabled=true`、`after-sales.consumer.dev-login.phone=<固定测试手机号>`，并提供消费者 PII 密钥后，运行 `pnpm dev:consumer:h5 TOTO`。当前本机启动脚本已向宿主传入单租户 ID `1001`，联调前仍须核对它与目标库租户一致。页面选择固定别名，经后端仅 `develop` profile、显式开关和本机请求限制的适配器取得正常消费者会话，再按该固定手机号完成绑定；后续页面仍调用本人真实 API。该命令不适用于微信、普通 H5、演示或生产构建。当前测试库已执行消费者身份／业务迁移；H5 固定别名仍须单独联调，不要把固定手机号或密钥写入仓库。

微信开发构建的临时身份使用真实 `uni.login` 和服务端 OpenID 校验。测试号码只配置在宿主本机忽略文件的 `after-sales.consumer.dev-wechat-phone.phone`，`enabled` 默认 `false`；先登录一次取得消费者登录响应的 `accountId`，精确填写 `after-sales.consumer.dev-wechat-phone.account-id`，再设 `enabled=true` 并重启后端。再次登录应得到 `phoneBound=true`、`phoneVerified=false`；该号码只作开发测试关联，不能作为微信验号、购买核验或服务资格证明。正式构建仍调用微信手机号授权。2026-09-20 当前测试库已执行两份消费者迁移，微信开发构建真实登录返回 `code=0`、账号 `2`；本机忽略配置仅对该账号启用测试号码。后端重启后 `/context` 返回 `phoneBound=true`、`phoneVerified=false` 和脱敏号码，数据库确认密文、`LOCAL_TEST` 来源与唯一账号；重复登录后仍只有一个账号。平台租户表尚无 `1001`，不能把本机单租户配置当作平台租户归属确认。

2026-09-20 用户要求先跳过隐私政策以联通主流程。本机忽略配置可设置 `after-sales.consumer.dev-policy-bypass.enabled=true`，同时以 `after-sales.consumer.dev-policy-bypass.account-id` 精确限定单一测试账号；只有后端 `develop` profile 且政策版本和正文都未配置时，`/mobile/consumer/privacy-policy` 才返回 `developmentBypass=true`，指定账号可完成 C05 测试申报。页面明确提示开发联调、不展示虚构条款；后端不写 `afs_consent_record`。其他账号、只配置版本或正文、非 `develop` 环境或开关关闭时仍拒绝申报；一旦配置完整政策，仍要求对应版本同意并写同意记录。测试申报仅为 `USER_REPORTED / PENDING / NOT_ASSESSED`，不构成购买核验或服务资格。此开关不能作为上线配置。

身份字段、账号创建方式、开发别名和开关名称在首个相关功能 Spec 中结合当时源码确定，不在本文档预造接口或配置项。完整约束见[小程序目录与页面路由设计](02-技术设计/04-小程序目录与页面路由设计.md#71-开发阶段的固定测试身份)。

### 本次验证与边界

- 2026-09-28 本机发现旧宿主 PID 95414 因 8080 已占用而启动失败，但 JVM 未退出且不再监听端口；当前 PID 23589 正常监听 8080。已停止旧 PID，确认当前 8080 仍正常监听；启动器增加受管残留 JVM 和本次失败启动清理、启动 PID 归属校验，直接启动脚本增加重复端口检查。`local-backend.test.mjs` 9 项、`bash -n` 和 `git diff --check` 通过；未为本次修复重启当前服务。
- 2026-09-23 本机消费者小程序 development 产物继续指向 `http://127.0.0.1:8080/api`。为使 C09／C16 与共享测试环境保持一致，受管后端启动脚本增加官方热线 `400-820-9787`、服务时间和微信客服开关启动参数。启动器识别并正常重启旧的本工作区后端，重新装配后 8080 双探针就绪；开发机直请求 `/api/api/afterSales/mobile/consumer/support-channels` 返回 HTTP 200、正确号码与中文时间。`bash -n`、启动器 7 项单测及微信开发者工具页面复测通过；真机拨号和真实客服会话仍待验收。
- 2026-09-21 `yarn dev:afs` 的后端归属确认在本机 `ps` 不可用时误判：8080 实际已由本工作区 JAR 启动，但启动器只读取 `ps` 命令行，因而拒绝记录运行状态。现在命令行无法读取时改用 `lsof` 核对监听进程的工作目录、已打开的运行 JAR 与 PID；目录或 PID 不符仍拒绝接管。7 项启动器测试通过；模拟 `ps` 不可用时复用了已运行的 8080 后端，完整 `yarn dev:afs` 随后启动 9010，售后入口与后端匿名接口均返回 HTTP 200。未据此认定登录后业务页面通过验收。
- 2026-09-20 `pnpm dev toto` 启动超时的实际原因是消费者本地身份组合测试的内存 Mapper 漏实现 `revokeSession`：启动脚本中的 Maven `testCompile` 先失败，JVM 并未进入启动阶段。补齐测试实现后，定向后端测试通过；原命令重新运行，8080 双探针就绪，微信 development 编译进入监听。微信开发者工具已打开 `dist/dev/mp-weixin` 并正常呈现正式首页和授权入口，未见应用 console error；平台预加载警告不计业务异常。公共启动器现监测装配进程提前退出，避免相同错误继续等满 240 秒。
- 同日 H5 浏览器冒烟发现本地 API 直连 8080 被跨端口限制，C09 页面误显示“网络连接异常”。消费者端与服务人员端的本地 H5 开发命令已同步启用 `/api` 代理；重启后 9527 代理返回真实客服渠道 `code=0`，页面显示“客服电话暂未配置／微信客服暂未开通”，无网络错误或控制台 error。两端 `pnpm verify` 通过。消费者上下文、购买记录与服务记录对无效会话返回业务 `4001`；隐私政策未配置返回 `503`。这些是启动、拒绝态及空配置证据，不代表真实账号与业务数据验收。
- 2026-09-19 修复 `pnpm dev TOTO` 只凭健康探针复用旧 JVM 的问题。公共启动器新增后端源码内容指纹、运行状态文件和受管进程身份校验；当前源码变化时只自动关闭 `gaia-saas-proj/.local/runtime/gaia-web-*.jar`，非本工作区进程仍拒绝处理。旧运行包没有状态文件时以运行包和源码时间作一次兼容判断，首次重建后统一使用内容指纹。
- 2026-09-18 三端本地开发统一调用 `scripts/local-backend.mjs`：Web、消费者小程序、服务人员小程序共同使用 16379 Redis 和 8080 聚合后端；小程序基址为 `http://127.0.0.1:8080/api`。启动锁避免并发重复装配，Web 与移动端双探针避免复用缺少移动接口或租户配置的旧实例；共享后端不再绑定任一前端生命周期。公共启动器 4 项规则测试、两端完整 `pnpm verify`、两次实际小程序短启动及一次 `yarn dev:full` 短启动通过；7004／9010 均返回 HTTP 200，停止三个前端监听后 8080 JVM 保持不变。
- 2026-09-20 `yarn dev:afs` 曾因消费者认证服务被宿主包装为 JDK 代理、Controller 按具体类注入而在 Spring 上下文初始化时退出，启动器随后报告 240 秒超时。消费者认证与购买服务改为声明业务接口并按接口注入后，代理装配回归测试通过；重新运行完整 `yarn dev:afs`，8080 双探针就绪，9010 入口返回 HTTP 200，消费者 `/context` 对无效会话返回预期 `4001`。本次未执行数据库迁移或业务写入。
- 2026-09-11 `yarn dev:afs` 增加售后入口就绪探测；9010 返回 HTTP 200 后自动用系统默认浏览器打开完整独立入口，不再依赖终端或 IDE 创建无地址标签。该行为只用于售后独立全栈命令，不改变 `yarn dev:full` 的双前端启动行为。
- 2026-09-15 修复 `yarn dev:afs` 对本项目临时后端运行包的归属误判：同时识别工作目录位于 `backend/gaia-saas-proj` 且以相对路径 `.local/runtime/gaia-web-*.jar` 或绝对路径启动的 JVM；其他目录、其他 JAR 和非项目进程仍拒绝自动关闭。使用本次触发误判的相对路径进程复验后，脚本正确清理旧后端，完成模块与宿主装配并启动 16379／8080／9010；售后入口返回 HTTP 200，匿名菜单探针返回预期 `4001`。
- 2026-09-11 商品权限接口 `503` 定位为共享测试库 `gaia_wh_init_wzy` 缺少 `afs_catalog_settings`。经用户明确授权，先停止两套当前工作区 Gaia 宿主，只读确认 V3 商品七表完整且配置／渠道五张补充表均不存在，再执行 `20260911_independent_business_data.sql`；6 条语句成功，五表完整，配置行为 `id=1, unique_model=0, unique_barcode=0`，未导入业务数据。随后 `yarn dev:afs` 重新装配并启动 8080／9010；匿名探针返回预期 `4001`，登录请求成功后商品系列页面加载出一条既有记录，请求日志未再出现缺表异常或对应 `503`。标准脚本重建 Redis 后再次启动环境时可能需要重新登录。
- 2026-09-10 修复 `yarn dev:afs` 的 `reportAppService` 注入冲突：售后报表服务改用独立 Bean 名称，避免旧模块 `CodeReportApi` 的同名 `@Resource` 字段误取售后实现，详见 [BUG-20260910-01](specs/2026-09-10-工单运营报表基础切片.md#bug-20260910-01报表服务名称导致聚合宿主启动失败)。注入回归及报表集成测试共 3 项通过；重新执行完整命令后，Redis、8080 后端及 9010 售后前端成功启动，后端约 71 秒就绪。独立入口 HTML 和 `src/main.ts` 均返回 HTTP 200，后端直连及 9010 代理的匿名菜单探针均返回预期 `4001`。未改动数据库、权限或全局代理策略，未执行业务写入和登录后报表验收。
- 2026-09-10 新增 `yarn dev:afs` 售后独立全栈入口：从 7004/9010、8080、16379 已运行状态重复执行，上一轮本项目进程被安全清理并重新启动；最终 16379 Redis、8080 Gaia 聚合后端、9010 售后前端监听，7004 未启动。独立登录页返回 HTTP 200，9010 `/api` 代理到宿主 `/api` context path 后返回预期匿名 `4001`。非本项目端口占用仍拒绝强杀。
- 2026-09-10 修复 `yarn dev:full` 打开后白页加载不结束：主系统 Vite 默认扫描仓库内全部 HTML，将售后子系统浏览器测试页纳入主系统依赖扫描，无法解析其 `virtual:app-loading`、`virtual:uno.css`，导致 `/src/main.ts` 请求持续等待。主 `vite.config.ts` 现显式设置 `optimizeDeps.entries: ['index.html']`，子系统与测试页仍由各自配置处理。修改后主、子入口脚本均返回 200（本机约 2ms／5ms），浏览器售后菜单及顾客登记页正常显示，无控制台 error；只验证启动与页面渲染，未提交业务数据。
- 2026-09-10 渠道与网点首版经授权完成共享测试库 5 表／2 列迁移及 6 个模块、10 项操作和超级管理员授权；重新装配并启动 Gaia 聚合宿主后，8080、7004、9010 均就绪，匿名接口返回预期 `4001`。当前登录账号下五个渠道与网点入口、家装公司／服务站／服务区域真实空列表以及家装公司／服务区域新增表单浏览器验证通过；未提交业务记录，编辑／启停、拒绝角色与跨租户仍待受控数据和账号。
- 2026-09-09 经用户明确授权，在 `gaia_wh_init_wzy` 先只读确认 8 张目标表均不存在，再依次执行 `20260909_product_series.sql`、`20260909_product_bundle.sql`、`20260909_service_item.sql`、`20260909_part.sql`、`20260909_service_station.sql`。共创建 8 张表，迁移后逐表计数均为 0，未写入业务数据。当前登录页面已验证配套品、商品系列、服务项目和配件档案返回空分页，原 `afs_product_bundle` 缺失导致的 `503` 消失；服务站页因当前账号无访问权限只验证到权限拒绝态。
- 2026-09-09 从四个端口均未监听的状态执行 `yarn dev:full`：Redis、售后模块安装、Gaia 聚合宿主装配及主／子前端均由同一命令成功启动；16379 返回 PONG，7004 主入口和统一售后入口均返回 HTTP 200，8080 菜单探针返回预期的 `4001 未登录`，后端约 90 秒输出“已就绪”。随后在 7004/9010 已被上一轮项目进程占用时再次执行，命令正确识别旧 PID、自动关闭两个旧 Vite 进程并重启，后端和 Redis 保持复用，四个入口复验正常。
- JDBC 已通过 TLS 连接目标 MySQL 8.4 测试库并执行只读 `SELECT DATABASE(), VERSION(), 1`；TablePlus 已打开同一库。
- 售后 API 本地安装、聚合宿主打包成功，JAR 中包含售后 core/API；未执行数据库集成测试。
- 首次启动验证额外设置数据库会话只读，日志确认自动改表关闭。后端成功启动，直连与前端代理的匿名菜单请求均返回 `4001 未登录`，前端页面返回 HTTP 200，独立 Redis 返回 PONG。
- 随后已停止只读验证进程并以正常读写配置重启；2026-09-08 10:25 日志确认启动成功（约 75 秒）、自动改表关闭，直连与前端代理再次返回预期的未登录响应。未执行业务写入验证。
- 未使用数据库 root 凭据登录业务系统；系统登录仍需独立业务账号。尚未验证登录、业务增删改、附件服务、外部系统或小程序；小程序配置未改动。
- 2026-09-08 曾使用当前登录账号 `00001` 验证管理后台临时授权；后端菜单配置完成后，该临时通道已删除，历史结果不再代表当前权限行为。
- 2026-09-08 临时通道删除后已重新装配并启动本地宿主：售后模块干净编译的 14 项测试通过，匿名售后接口返回 `4001 未登录`。管理端用当前账号 `00001` 完成拒绝侧验证，顶部不再显示“售后服务”，手动输入售后页面地址也不可进入；允许侧仍需使用已配置售后角色的账号验证。
- 经用户明确授权，已将 `20260908_catalog.sql` 执行到测试库 `gaia_wh_init_wzy`：迁移前确认 4 张目标表均不存在，迁移后确认 4 表及锁记录完整；与 Mapper 等价的只读查询成功返回分类 50 条、商品 4087 条，原缺表条件已消除。尚未执行业务写入，正式角色、租户和完整页面验收仍待后续处理。
- 以下旧章节保留通用工作流，涉及“尚未加入宿主”“只有普通 JAR”的描述为此前时点，本机接入状态以本节及当前源码为准；本次环境打通不计业务功能验收完成。

<a id="excel-consumer-recovery-20261014"></a>

### 2026-10-14 Excel 导出消费线程恢复与停止

本次工作区提交包含 `gaia-sys-tools-core` 的导出消费者修复：队列或导出处理异常后按1秒起步、最高60秒指数退避，成功轮次重置延迟；容器销毁时标记停止并中断消费线程，退出时清理线程引用，避免失败后持续空转及关闭后继续重试。原租户切换、用户上下文清理和队列处理规则保持，不新增失败任务重入队或自动补偿能力。

JDK21离线 Maven 编译及 `ExcelExportConsumerTest` 1项通过，覆盖队列异常不会立即空转、关闭能终止失败消费者；未重启共享服务，未验证真实导出队列故障与恢复，原始日志仅留本地临时目录。本地提交 `gaia-sys@2dc5cddf`（Committer：snow），归并[v0.23.84](03-开发管理/10-版本信息.md#v0-23-84)；未推送／部署。

## 1. 环境与命令入口

所有命令均在表中对应仓库根目录执行。两个前端的 Node 和包管理器不同，不在工作区强制统一版本。

| 仓库 | 已核对的工具约束 | 常用命令与说明 |
| --- | --- | --- |
| `gaia-after-sales` | JDK 21、Maven 3.9.x、Gaia 父 POM `3.5.0-SNAPSHOT` | `mvn -B -o verify`；缓存不全时配置好内部制品源后使用 `mvn -B verify` |
| `gaia-after-sales-uni` | Node `>=24.19.0 <25`，`.nvmrc` 为 `24.19.0`；pnpm `10.34.5` | `pnpm install --frozen-lockfile`；`pnpm tenant:check TOTO`；`pnpm dev TOTO` 或 `pnpm dev:h5 TOTO` |
| `gaia-ui` 主系统 | `package.json` 的 Volta 固定 Node `24.21.0`、Yarn `1.22.22`，有 `yarn.lock` | `yarn install --frozen-lockfile`；`yarn dev`；`yarn build`；根编排命令会为售后子项目选择其独立 Node |
| `gaia-ui/apps/after-sales` | Node `>=24.21.0 <25`，`.nvmrc`／Volta 固定 `24.21.0`；pnpm `10.8.1` | 子目录先 `nvm use` 再执行 `corepack pnpm --ignore-workspace ...`；或在根目录执行 `yarn after-sales:pnpm <命令>` |
| `gaia-saas-proj` | JDK 21、内部 Gaia 制品；Web JAR 为默认售后宿主 | 装配前提满足后执行 `mvn -B -pl gaia-saas-web-jar -am verify`；入口 `com.ehsure.gaia.WebApplication` |

开始任务时分别检查 Git 状态；管理后台同时检查 `git submodule status`，保留 `src/views/common` 的已有变化。私服认证使用开发者本机 Maven settings，不写入 POM。

### 小程序同一 Wi-Fi 真机调试

本机后端默认只监听 `127.0.0.1:8080`，手机无法访问电脑的回环地址。需要在 `backend/gaia-saas-proj/.local/application.properties` 将 `server.address` 设为 `0.0.0.0` 并重启后端；保持 Redis 仅监听回环地址。然后在消费者端和服务人员端各自未提交的 `.env.development.local` 设置 `GAIA_API_BASE_URL=http://<电脑局域网IP>:8080/api`，分别运行 `pnpm dev TOTO`。开发命令会识别本机网卡 IP，继续启动或复用共享后端。电脑 IP 变化时更新两处本地配置；手机与电脑须处于可互访的同一网络，电脑防火墙允许 8080 入站。微信开发者工具勾选“不校验合法域名”，手机预览时打开调试模式；体验版及正式版仍使用微信后台已配置的 HTTPS 合法域名。该地址只写入本地开发配置，不进入仓库或正式产物。

开发监听已统一关闭 Terser 压缩，并为 UniApp 子进程追加默认 2048MB 老生代堆预算；已有显式 `NODE_OPTIONS` 堆设置保留，单次微信／H5 构建仍压缩。启动参数需要重新启动对应小程序命令才生效，堆预算不代表整个 Node 进程只能占 2GB。详见[长时间编译排查](specs/2026-09-14-小程序通用底座整治.md#watch-memory-20261006)。

## 2. 真实联调的前置条件

以下事项在首次业务联调前核实并更新“当前状态”，未确认项不影响空骨架构建。

| 项目 | 获取或核实方式 | 当前状态 |
| --- | --- | --- |
| 业务身份与权限 | 经确认的功能 Spec；核对宿主会话拦截和 `gaia-sys` 权限配置 | 待确认售后身份、菜单、API 与资源权限 |
| TOTO 测试环境 | 从项目环境负责人获取配置；核对宿主实际加载的 profile、数据库和 Redis | 获取入口、测试数据源与可用性待确认 |
| 小程序 AppID 与接口地址 | 更新各端 `build/tenant/profiles/toto.ts`，后端配套独立私密凭证 | 2026-10-19 两端已切换新 AppID；test 接口仍为 `http://10.1.1.53:8011`，新凭证尚未同步到共享服务器，见下节 |
| 管理后台请求地址 | 核对 `gaia-ui` 的 Vite 代理、环境变量、请求封装和目标宿主上下文 | TOTO 联调地址待验证 |
| 测试身份和数据 | 准备可追踪的脱敏业务数据、不同权限身份及必要的跨租户测试条件 | 待需求确认后准备；账号获取方式待落实 |
| 数据结构与菜单交付 | 核对目标环境迁移、初始化与恢复机制，在功能 Spec 中明确动作 | 待首个相关功能确定 |

文档只记录配置项、配置文件位置与获取方式，不保存密码、令牌、私钥或完整环境配置。小程序 `VITE_` 与 profile 会进入客户端；本地覆盖方法见[小程序 README](../../mobile/gaia-after-sales-uni/README.md)。

两个小程序的微信上传私钥统一存放于本仓库已忽略的 `.local/wechat-ci/`，按 AppID 区分文件，目录权限为 `700`、私钥权限为 `600`。消费者端和服务人员端分别在各自已忽略的 `.env.upload.local` 中配置 `GAIA_APP_ENV=test` 与对应私钥的绝对路径；从对应小程序仓库运行 `pnpm upload` 默认打包并上传 TOTO 开发版本，可用 `pnpm upload --desc "本次修改说明"` 设置上传备注。实际上传需在微信平台版本管理中核验，内网测试地址构建的版本不能直接作为体验版或正式版使用。

### 两端新小程序账号配置（2026-10-19）

| 对应端 | 当前源码 AppID | 本机后端私密配置前缀 |
| --- | --- | --- |
| 消费者 `gaia-after-sales-uni` | `wx89fe2581ccada529` | `after-sales.consumer.wechat-app-id` / `wechat-app-secret` |
| 服务人员 `gaia-customer-service-uni` | `wx262113345e1e6d72` | `after-sales.mobile.wechat-app-id` / `wechat-app-secret` |

本次按用户提供资料替换各端 TOTO profile、既有配置断言、派生租户总览和人员端发布说明；端内显示名称、租户编码及接口地址保持。上传私钥按新 AppID 放入上述私密目录，各端 `.env.upload.local` 已指向对应文件；两份私钥格式校验通过。本机后端四项账号凭证仅写入 `gaia-saas-proj/.local/application.properties`，该文件及私钥权限为 `600`，旧配置在本仓库忽略的 `.local/wechat-account-switch-20261019/` 中备份。

研发验证：两端 `pnpm verify` 均通过，包含完整 check 与微信/H5 development 构建；生成的 `project.config.json` 和 `tenant-build.json` 均为各端新 AppID。两端正式上传辅助入口 `check` 通过，确认新私钥可读取、CI 依赖可加载；此预检未调用微信上传接口，不证明新账号的上传权限、IP 白名单或 AppSecret 在线有效。另已回读确认四项后端凭证与用户提供资料一致、上传私钥与原文件一致、密钥未进入代码差异及两端构建产物；项目文档校验246份通过。原始验证日志只留本机忽略目录。

本轮未重启现有共享本机后端，运行进程仍须重启才会加载新凭证；未更新共享测试服务器或上传微信开发版。当前 test 构建仍连接共享测试服务器，因此完成服务端凭证同步前不能据此认定新 AppID 的真实微信登录可用。原 AppID 的微信绑定不在本次迁移范围；新应用下的既有账号识别、服务人员重新绑定及真机登录另需验证。本次为账号配置替换，不改变业务入口或验收计数。

### 第三个小程序：售后服务助手预留配置（2026-10-19）

用户确认第三个小程序“售后服务助手”合并承载后台总部运营、客服作业、服务站作业、门店业务四个角色视角，账号 AppID 为 `wx6246e026fb0bb208`。这是独立于消费者、服务人员端的第三个小程序，当前尚无对应工程与业务实现；角色、权限及数据范围仍按后续确认的功能契约实施，不能因账号预配置视为已开放。

| 配置 | 保存位置与用途 |
| --- | --- |
| AppID / AppSecret | 宿主 `gaia-saas-proj/.local/application.properties` 中预留 `after-sales.service-assistant.wechat-app-id` 与 `after-sales.service-assistant.wechat-app-secret`；目前无运行代码读取这两项 |
| 上传私钥 | 本文档仓库 `.local/wechat-ci/private.wx6246e026fb0bb208.key` |
| 上传配置 | 本文档仓库 `.local/wechat-ci/service-assistant.upload.env`，包含 `GAIA_APP_ENV=test`、`WECHAT_APP_ID`、私钥绝对路径与默认 `WECHAT_CI_ROBOT=1`；供后续工程接入时使用，现有两端上传脚本不读取该文件 |

三份账号资料已落在项目自己的配置与私密目录，日常使用不依赖最初接收资料的临时文件夹。AppSecret、私钥及上传配置均不进入 Git 或交付网页；私密文件权限 `600`，私钥目录权限 `700`。原配置备份位于忽略的 `.local/wechat-account-switch-20261019/assistant-*/`。

新增私钥格式、来源一致性、三套账号对应关系、已有两端凭证保持及 Git 忽略检查通过；本次只预存第三套配置，不新增工程、登录接口、角色功能或部署上传入口，也不将第三个小程序加入现有两个小程序的自动发布流程。没有第三端构建或在线凭证验证；既有双端源码未在本续轮修改，无需重复此前完整构建。共享服务器、现有进程及业务验收状态保持，后续启用时须接入真实配置读取并另做构建、登录与权限验证。

## 3. 后端修改如何进入运行宿主

当前售后Core／API已装配进Gaia的WAR及可执行Jar宿主，日常本机入口为统一启动器。售后仓库另有`gaia-after-sales-web`运行外壳；未来独立运行宿主仍需准备Gaia认证、租户、数据源和日志装配，不表示已经完成独立部署。

1. 在功能 Spec 中确认 `api`、`xcx-api` 的实际使用范围；首次接入时在宿主根 POM 配置对应版本/依赖管理，并在 `gaia-saas-web-jar/pom.xml` 引入所需模块。
2. 在售后仓库执行 `mvn -B install`，将父子制品一起安装到本机 Maven 仓库。它包含 verify 阶段；同一份源码已成功 install 时无需重复 verify。只做文档修改不需要 install。
3. 在宿主执行 `mvn -B -pl gaia-saas-web-jar -am verify`，再按已核实的测试环境配置启动或重启 `WebApplication`。其他独立 Gaia 仓库不在该 Reactor 内，缺失的依赖仍需单独取得。
4. 核对运行中实际依赖的售后版本、包扫描、拦截器和租户上下文，再请求功能 Spec 中的接口并从页面验收。

公共地图实现已精确恢复为远端master；售后需求不得再改其默认Key、取值写法或新增主系统必填配置。若本地此前装配过售后修改的公共库，先在`backend/gaia-sys`验证并安装已恢复的`gaia-sys-tools-core`，再安装售后和装配宿主。此前追加的本机`gd.map.key`已撤销，私密配置与追加前原字节一致，售后原配置保留。AI默认endpoint／model由售后Core持有，不需在宿主复制。最新[master原样与零差异证据](specs/2026-10-17-售后宿主模块级隔离.md#8-主系统地图精确保持master原样2026-10-17最终确认)及[未来独立宿主配置](specs/2026-10-17-售后宿主模块级隔离.md#63-将来独立部署的配置契约)分别维护；8080未重启。

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
| 小程序共享启动链、配置或样式 | 上述适用检查及 `pnpm build [<TENANT>]`、`pnpm build:h5 [<TENANT>]`（租户默认 `TOTO`、环境默认 `test`）；需验证其他环境时显式执行 `pnpm build <TENANT> <ENV>`，并检查页面表现 |
| 小程序依赖或锁文件 | 冻结安装及 `pnpm run audit`，兼容性变化增加双端构建；当前审计限制见小程序质量文档，不自动接受风险 |
| 售后子系统页面/API | 使用 `apps/after-sales` 现有 lint、typecheck、相关测试及 build 命令，默认通过 `yarn dev:afs` 在独立入口验证页面、交互及权限；不启动主系统 |
| 用户明确要求的主系统维护／验证 | 按实际改动执行主系统非修复 ESLint、相关测试及构建；需要页面联调时在 `frontend/gaia-ui` 使用 `yarn dev:full` |
| 宿主装配或配置 | 定向 Maven verify、依赖和扫描检查；在已确认测试环境验证启动与真实接口，按风险检查权限和租户隔离 |

小程序完整本地验证可使用 `pnpm verify`；它不包含真实依赖审计，需要时另跑 `pnpm run audit`。管理后台的 `lint-fix` 会修改源码，不作为只读检查。相关仓库均执行 `git diff --check`。

完成时把命令、环境、日期、实际结果及未验证项记录到功能 Spec。环境受阻时准确记录阻塞和已完成的独立检查，不把跳过项标为通过。

## 新增接口的运行版本检查（2026-09-08）

商品权限接口曾因 8080 仍运行旧进程而返回 `code=500`；日志实际为 `NoResourceFoundException: No static resource api/afterSales/catalog/permissions`。前端热更新、Maven install 或宿主重新打包均不会替换运行中 JVM 已加载的代码。修改后端后按上面的脚本重新装配并重启，再从已登录页面触发请求验证 Controller 映射及返回结果。匿名请求返回 `4001` 不足以确认接口存在。

真实宿主还包含事务 AOP 与 Shiro 的额外代理链；分类/商品应用服务现按业务接口注入，隔离集成测试已加入相同代理组合，避免只构建成功而启动失败。自动改表与初始化仍保持关闭，此类运行修复不包含共享库迁移或角色授权。

## 售后菜单 V2 正式配置（2026-09-08）

前端不再读取 `VITE_ENABLE_AFTER_SALES_LOCAL_MENU`，也不会创建或补齐售后菜单。登录后直接使用 `/api/sys/Module/tree?categoryCode=pc_web` 返回的售后功能和导航授权项；账号没有同时获得有效工作视角与功能时，顶部不显示“售后服务”，未授权的工作视角和直达路径同样不可用。“系统管理员”下拉项要求后端返回 `afsNavigationAdministrator`，其全菜单视图只投影当前账号实际获授的功能节点。

## 售后独立前端底座（2026-09-08）

`gaia-ui/apps/after-sales` 已建立单包独立工程。当前 Gaia 主系统固定 Node 24.21.0 / Yarn 1.22.22，售后子项目固定 Node 24.21.0 LTS / pnpm 10.8.1；各自安装依赖：

```bash
# gaia-ui 根目录
yarn install --frozen-lockfile
node scripts/frontends/after-sales.mjs install --frozen-lockfile
```

根目录的 `after-sales.mjs` 会读取子项目 `.nvmrc`，使用 Node 24.21.0 和子项目 `packageManager` 执行命令，不改变根进程 Node。直接进入子目录执行时，先运行 `nvm use`，再使用 `corepack pnpm --ignore-workspace ...`；不要在 Gaia 根目录创建 pnpm workspace 或替换 yarn.lock。

日常开发默认在 gaia-ui 根目录或本仓库运行 `yarn dev:afs`，启动售后子系统及其本地 Redis、Gaia 聚合后端，直接访问 `http://127.0.0.1:9010/after-sales/#/`。用户明确要求主系统验证时，可在 gaia-ui 根目录运行 `yarn dev:full`；已有 `yarn dev` 同时启动主应用 7004 和子应用 9010，`yarn dev:main` 只启动主系统。从主系统进入时由主系统链接携带 `entry=main`。子项目可通过根目录 `yarn after-sales:pnpm dev|typecheck|test|build` 独立执行，也可在子目录 `nvm use` 后运行对应 Corepack 命令；这些命令只启动或验证售后前端。新子系统首页不依赖后端，也不包含临时身份。

原 `yarn build`、`production`、`factory`、`production:saas`、`factory:saas` 现在顺序以各自配置的 Node 24.21.0 构建主项目和子项目并组装根 `dist/after-sales/`；子系统统一使用 production 环境和同域相对 API，主项目模式保持原样。`yarn verify:dist` 校验合并产物。`push.sh` 的子项目冻结安装也使用同一 Node 24 编排入口，构建失败会中止；上传和发布仍需单独授权。

验证通过：子系统冻结安装、typecheck、production build、仓库外隔离构建、31 项底座测试、原主构建、统一 production:saas、静态产物校验、双服务访问、HMR 和 SIGINT 清理。Chrome 售后入口的品牌、布局及控制台验证通过。原 legacy 页面和主路由无修改。

本次浏览器主应用请求本机 8080 返回 ECONNREFUSED，真实登录／legacy 菜单页面依赖后端启动后另验；不要将主入口 HTTP 200 或构建通过等同于真实业务联调。Gaia 会话、权限、业务页面迁移、iframe 和三模式切换尚未实现。详细来源、命令与边界见[子系统 README](../../frontend/gaia-ui/apps/after-sales/README.md)和[改造方案实施记录](02-技术设计/07-gaia-ui售后子系统独立前端改造方案.md#14-第一阶段实施与验证2026-09-08)。

补充本地启动核验：用户开启 VPN 后，按原脚本启动独立 Redis 16379 并重新装配后端，两次 Maven 构建通过，未修改本地代理或数据库配置。现有数据库 TCP 端口可达，但 JDBC 握手持续返回 EOF（未收到 MySQL 响应），后端 8080 未成功监听；已停止本次失败启动，避免持续重试。主／子前端仍按原配置运行，legacy 登录页面验收仍受后端连接阻塞。未改动后端已有 `.gitignore`、宿主 POM 或本机配置。

### 2026-09-10 全部修改提交时的依赖文件边界

按用户“提交所有修改”的要求，保留 `gaia-ui` 根目录已有的 `pnpm-lock.yaml` 和 `pnpm-workspace.yaml`。其中 `allowBuilds` 仍含 `set this to true or false` 占位值，尚未确定依赖构建脚本授权，也未验证根目录 pnpm 冻结安装；不能据此认定主系统已经迁移到 pnpm。主系统继续以已有 Yarn 命令为运行依据，售后子系统仍使用自身依赖目录；本次前端测试、类型检查和生产构建均在子系统已有安装上完成。后续启用根目录 pnpm 前，需要明确构建脚本策略并独立验证安装。

## 项目与仓库入口

路径相对于 `Gaia/`；完整职责和改动边界见[仓库与系统关系](00-项目资料/02-仓库与系统关系.md)。

### 团队首次拉取：保持多仓独立，只统一目录

TOTO 使用“一个项目目录、多个独立 Git 仓库”的工作区方式，不把业务仓库合并为 monorepo，也不移动其他蓝鲸项目正在使用的仓库。每位开发者为 TOTO 单独检出一套工作目录，特别是 `gaia-saas-proj` 必须使用 TOTO 独立检出，避免分支、本地配置和构建产物影响其他项目。

```text
Gaia/
├── docs/
│   └── toto/                       # 本文档仓库，也是工作区入口
├── backend/
│   ├── gaia-after-sales/           # 售后领域与 API
│   └── gaia-saas-proj/             # TOTO 独立检出的聚合运行宿主
├── frontend/
│   └── gaia-ui/                    # apps/after-sales Web 子系统
└── mobile/
    ├── gaia-after-sales-uni/       # 消费者小程序与 H5
    └── gaia-customer-service-uni/  # 服务人员端本地仓库，共同底座已建立
```

同事首次准备工作区时，先拉取本仓库，再运行安全、可重复执行的初始化脚本：

```bash
mkdir -p Gaia/docs
git clone https://github.com/zhiyuan23/toto-after-sales-docs.git Gaia/docs/toto
cd Gaia/docs/toto
bash scripts/bootstrap-workspace.sh
```

脚本只拉取缺失仓库，不会对已有仓库执行 `pull`、切换分支或覆盖本地修改。后端和 Web 默认使用当前 TOTO 业务开发分支，需要更换时通过 `TOTO_WORK_BRANCH` 指定。两个现有小程序仓库已于 2026-09-28 将 `origin` 切到个人 GitHub（HTTPS）；Codeup 地址、GitHub SSH 地址、可直接发给 Codex 的双向切换指令及检查步骤统一见[小程序远程地址留存与恢复](00-项目资料/02-仓库与系统关系.md#小程序远程地址留存与恢复)。每位同事的远程配置需在自己的工作区执行，修改文档不会自动切换本机远程；切换不自动提交或推送。

新工作区拉取小程序前，先确认所选平台已有目标分支。2026-09-28 GitHub 只读验证成功但尚无分支，本地代码未推送，暂不能通过 GitHub 克隆取得业务代码。具备目标分支后，可按文档地址显式配置消费者仓库初始化（以下从 `docs/toto` 执行）：

```bash
TOTO_AFTER_SALES_UNI_REPO_URL='https://github.com/zhiyuan23/gaia-after-sales-uni.git' \
TOTO_AFTER_SALES_UNI_BRANCH='feature/20260907_蓝鲸售后服务_志远_喆宇' \
bash scripts/bootstrap-workspace.sh
```

初始化脚本尚不自动检出服务人员仓库；目标分支存在且本地目录不存在时可单独检出：

```bash
git clone --branch 'feature/20260907_蓝鲸售后服务_志远_喆宇' \
  https://github.com/zhiyuan23/gaia-customer-service-uni.git ../../mobile/gaia-customer-service-uni
```

使用 Codeup 时将上述 URL 替换为仓库关系文档中对应 Codeup 地址，并先核对分支。两个小程序底座和公共配置机制的变更仍须同步修改并分别验证。

仓库齐备后，在本目录执行 `yarn dev:afs` 即可启动 TOTO 售后 Web、聚合后端和本地 Redis；该命令只转发到 `frontend/gaia-ui` 的同名启动器，不复制启动逻辑。也可以继续从 `frontend/gaia-ui` 执行原命令。完整环境要求和调试方式见[本地开发与联调](local-development.md)。

| 仓库 | 职责 | 入口 |
| --- | --- | --- |
| `gaia-after-sales` | 售后领域、管理端 API、小程序 API | [开发说明](../../backend/gaia-after-sales/docs/catalog-development.md) |
| `gaia-after-sales-uni` | 原 TOTO 售后小程序与 H5 | [README](../../mobile/gaia-after-sales-uni/README.md) |
| `gaia-ui` | 同仓的售后独立子系统 `apps/after-sales`，复用 Gaia 认证、菜单、权限与租户体系；主系统旧售后页面仅作 legacy 保留 | [子系统 README](../../frontend/gaia-ui/apps/after-sales/README.md) |
| `gaia-saas-proj` | 聚合并运行售后 API | [POM](../../backend/gaia-saas-proj/pom.xml) |
| `gaia-customer-service-uni` | “TOTO客服助手”服务人员独立小程序 | 共同底座已从消费者端复制并配置独立 AppID；真实身份和 W01～W16 业务待 Spec 实施 |

`gaia-ui/src/views/common` 是受保护的公共子仓库，未经单独明确授权不得修改或提交。`gaia-saas-proj` 可按已确认 Spec 修改，但不得自动提交。菜单、权限和租户平台按需复用 `gaia-sys`、`gaia-tenant`；售后业务主数据自有，出库与追溯只按另行确认的外部接口契约接入，不直接引用主系统业务表或默认同步。


### 2026-10-17公共源码原样与售后功能分支

`backend/gaia-sys`当前使用本地`feature/20260907_蓝鲸售后服务_志远_喆宇`，从最新远端master创建；当前没有公共源码差异。原master的4条售后开发提交保留在`codex/backup-gaia-sys-master-before-isolation-20261017`，本地master已与远端master对齐，不将备份分支安装为运行依赖。复现本轮装配先构建／安装该远端原样的SYS、工具及日志制品，再安装售后API/Core，最后装配宿主；已运行8080仍是旧制品，不把新构建当作已加载。

宿主WAR／Jar的公共配置去掉可选售后导入块后必须与远端master逐字一致；Cookie、数据源、Redis及连接池按环境在私密覆盖文件维护。原Windows售后分支中的`gaia_local_token`、Redis库5等不再是源码默认值；切换运行配置前核对环境覆盖，不改公共默认值来解决单一子系统问题。本机既有私密文件保持，未重启或迁移共享环境。领域审计默认false归`AfterSalesAuditSupport`，外部配置仍可覆盖。来源及验证见[全面整改](specs/2026-10-17-售后宿主模块级隔离.md#9-主系统保持远端master原样的全面整改2026-10-17)。
