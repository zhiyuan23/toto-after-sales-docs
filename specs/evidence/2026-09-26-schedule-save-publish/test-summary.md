# 排班交互与保存发布：提交验证摘要

日期：2026-09-26。适用范围：工作台服务站上下文、排班操作与紧凑选择、日期快捷范围、三类服务顺序及新建默认值、工作台快捷入口、保存即发布及独立发布按钮移除。研发验证不替代业务验收。

代码提交：Web `51aa9587`，后端 `33dbac9`。两仓提交时文档影响 Hook 通过，本文档随关联项目文档单独提交；未推送、未部署。

## 可复现检查与结果

| 范围 | 命令／检查 | 结果 |
| --- | --- | --- |
| Web 最终源码 | 根仓 `yarn after-sales:pnpm check` | lint、依赖、应用及测试类型、i18n 通过；344 项，315 通过、29 项既有失败，与移除按钮前失败集合完全一致 |
| 后端保存发布 | Java 21，`mvn -B -o -pl gaia-after-sales-api -am test -Dtest=ScheduleImmediatePublishIntegrationTest,ScheduleWeekIntegrationTest -Dsurefire.failIfNoSpecifiedTests=false` | 新增 8 项及原排班 7 项，共 15 项通过 |
| 后端扩大回归 | 同命令单独指定 `CatalogIntegrationTest`，与修改前 HEAD 归档目录对照 | 同 12 项既有失败（3 failures、9 errors），失败名称集合相同 |
| Web 生产编译／体积 | `yarn after-sales:pnpm exec vite build --mode production`；`yarn after-sales:pnpm exec node scripts/check-bundle-size.mjs` | 保存发布实现编译通过，219 个 JS/CSS 产物通过；随后移除按钮仅复跑完整 check 与页面核对，未再编译 |
| 页面 | 9017 内存 API 隔离夹具 | 新建／编辑／批量单次提交、失败保留与重试、站点权限、紧凑已选人数与快捷日期状态通过；最后独立发布按钮数量 0 |
| 文档 | `node scripts/check-doc-impact.mjs --staged --all`；三仓 `git diff --check` | 提交前执行；保留既有业务验收边界，无推送／部署 |

## 前端既有失败名称

- `a busy form blocks leaving the dashboard for another business page`
- `a busy form refuses perspective switching without clearing tabs`
- `a later route guard failure restores the original perspective and preserves tabs for retry`
- `a pending external form confirmation keeps the current view and tabs until its rejection`
- `a rejected navigation preserves tabs and allows retry after reporting the error`
- `accepted work perspective switching applies the new view only after the form agrees`
- `business create and edit forms use the shared dialog shell`
- `cancelled work perspective switching leaves the current home and form mounted`
- `catalog uploads use the official Gaia access and download addresses`
- `category detail shows readable ancestry and never exposes a raw parent ID as its name`
- `customer-service dispatch keeps station assignment while station page is wired for personnel assignment`
- `editable controls in shared business form dialogs provide placeholders`
- `installation code API permission is independent from purchase record permission and missing grants fail closed`
- `installation code list failure exposes retry without repeating successful permission requests`
- `installation code page retries permission initialization before requesting business data`
- `installation code search, paging and reset query once and preserve the applied keyword`
- `inventory stock range uses a complete non-clearable select instead of a switch`
- `inventory tabs only expose readable views and keep the active view in the route`
- `network master lists prioritize names and operational context`
- `page tabs use the shared lightweight visual hierarchy`
- `raw view dialogs are limited to reviewed non-standard interaction models`
- `real payloads whitelist fields and preserve false filters and optimistic versions`
- `redirecting a perspective switch to access status does not clear old tabs`
- `repeated switch commands while confirmation is pending commit only the first destination`
- `returning to the root home through the Logo path does not clear same-view tabs`
- `same-route query updates also respect cancellation without replacing the form`
- `selecting the current perspective leaves all tabs intact`
- `tests/catalog-state.test.ts`
- `tests/i18n.test.ts`

## 后端扩大回归既有失败名称

- `CatalogIntegrationTest.concurrentInventoryConsumptionNeverCreatesNegativeBalance`
- `CatalogIntegrationTest.exactProductRelationsArePagedAndReturnOnlyTheirOwnQuantityAndStringIds`
- `CatalogIntegrationTest.inventoryDocumentsKeepBalancesLedgerAndTransitionsConsistent`
- `CatalogIntegrationTest.inventoryRejectsIllegalRoutesStaleActionsAndUnauthorisedWrites`
- `CatalogIntegrationTest.networkOwnedMastersPersistAuditRelationsAndOptimisticVersions`
- `CatalogIntegrationTest.ownCatalogDoesNotReadOrWriteSameIdMainMasters`
- `CatalogIntegrationTest.partsSupportSafeMetadataAndApplicableProductAssociations`
- `CatalogIntegrationTest.scheduleGenerationPublishingAndDailyCoverageAreEnforced`
- `CatalogIntegrationTest.serviceResourcePermissionsTenantBoundaryAndAuditRollbackAreEnforced`
- `CatalogIntegrationTest.serviceResourcesKeepPersonnelAvailabilityAndQualityFactsSeparate`
- `CatalogIntegrationTest.serviceStationHttpUsesStringIdsAndExplicitPermissions`
- `CatalogIntegrationTest.serviceStationsSupportNarrowLifecycleAuditAndTenantBoundary`

主要已有原因：部分组织夹具不可访问、库存策略表缺失以及目录夹具计数／ID 断言失配。本次未扩大修复范围。

## 草稿清理证据

用户明确授权清理上线前测试草稿。目标 `gaia_wh_init_wzy`：23 条草稿备份后事务删除，提交后回读 0；103 条已发布记录逐字段一致，审计历史未改。恢复文件在忽略目录 `.local/backups/20260926-schedule-draft-cleanup/restore-drafts.sql`，权限 600；SHA-256 `acfc5a500cf9c2fd4df5fb424fd0bf9e8837facd814637d5f24f601190d1f3a3`。恢复前须检查排班唯一键无新增冲突。备份不进入 Git。

## 证据保留边界

项目 Git 保留功能契约、验证结论、复现命令、已有失败列表以及 5 张代表性截图。原始日志、被替代截图与测试载荷移至本机忽略目录 `.local/evidence-archive/20260926-schedule/`，带文件大小和 SHA-256 清单，可按需追溯；团队理解结果不依赖该本机目录。没有永久删除文件，也没有同步外部知识库。此为本次提交整理方式，不改变其他项目证据或建立新的全局规则。
