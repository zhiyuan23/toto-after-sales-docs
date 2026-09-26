# 服务人员任务预约与排序研发证据

- 日期：2026-09-26；[对应契约](../../2026-09-18-服务人员小程序完整开发计划.md#task-priority-20260926)。
- 场景：正式 TaskPage、TaskCard、usePagination 和 taskAppointment 源码经过 Vue 编译器渲染；浏览器视口 390 × 844；接口、导航壳和业务数据为明确标记的隔离替身，不写入正式应用或数据库。
- 已核对：各分组、同日早晚顺序、今天／明天／具体日期、未确认期望、无日期、缺件旧预约标识；点击过时提醒仅显示对应任务，返回全部恢复列表；查询测试客户3只显示待确认任务；浏览器控制台 error 为 0。
- [列表首屏](task-list.png)；[过时筛选](overdue-filter.png)；[未确认期望](unconfirmed-appointment.png)。截图导航按钮图标由壳替身省略，不作为导航外观证据。
- 实施时工作区后端：`mvn -o -B -pl gaia-after-sales-api -am test -Dtest=ServicePersonnelTaskMapperTest,ServicePersonnelTaskAppServiceTest,ServicePersonnelTaskApiTest -Dsurefire.failIfNoSpecifiedTests=false`，30 项通过。
- 实施时工作区端侧：`pnpm check`，36／66／5／12 项通过；`pnpm build TOTO development` 微信构建通过；`pnpm dev TOTO` 已完成 `dist/dev/mp-weixin` 编译并进入监听，复用同一本机后端。
- 本机运行：受管启动器装配并启动 PID 21831；运行包任务 Mapper 与源码一致，SHA-256 `8b83fd4ce6d82050fdf4b9faf0cfff8e6d5afa4dbbe4e607c82c6895d26a8a29`；8080 健康检查通过。没有登录态的真实接口验收证据。
- 原型 worker.js 语法检查通过；本轮浏览器禁止 file 协议，未执行原型页面浏览器对照，未绕过限制。正式组件隔离渲染证据如上。
- 尚未验证：真实微信账号端到端、iOS／Android 真机、共享环境发布后业务验收。没有变更入口或验收计数。

- 提交前独立快照：从各仓暂存区导出，排除其他并行任务改动；后端 29 项（15／10／4）、端侧类型检查及 56 项单元测试通过。后端提交 `463520f`，小程序提交 `0d8566f`；未 push，真实账号／真机与共享验收仍待执行。
