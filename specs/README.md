---
type: "llm-wiki-project-spec"
topic: "TOTO售后服务"
status: "active"
updated: "2026-10-22"
owner: "shared"
confidence: "medium"
belongs_to:
  - "kb:project:toto-after-sales-docs"
sources:
  - "本仓库既有文档：specs/README.md；格式整理不表示重新验证业务与运行事实。"
tags:
  - "llm-wiki"
  - "TOTO"
  - "specs"
schema_version: "2"
id: "kb:project:toto-doc-00b1d791c652b7d6"
created: "2026-10-22"
sensitivity: "internal"
---

# 功能 Spec 导航与生成规则

Spec 按主要业务归属维护，一份契约保留一个主位置；已完成开发的 Spec 仍是有效契约，不因完成而移入归档。更新功能时先检索已有 Spec，避免同一规则多份维护。

- [01-基础资料与服务网络](01-基础资料与服务网络/)
- [02-商品注册消费者与会员](02-商品注册消费者与会员/)
- [03-服务工单与调度](03-服务工单与调度/)
- [04-服务履约配件与费用](04-服务履约配件与费用/)
- [05-平台集成与公共能力](05-平台集成与公共能力/)
- [06-测试验证与数据操作](06-测试验证与数据操作/)
- [assets](assets/)
- [evidence](evidence/)
- [sql](sql/)
- [support](support/)

<a id="spec-generation"></a>

## AI 新建与更新规则

1. 按功能名或需求编号先检索对应分类；已有契约优先原位更新。跨分类功能以主要业务规则归属为主，只保留一份 Spec，其他页面直接引用。
2. 确需新建时必须显式选分类：`node scripts/create-spec.mjs --category 03 --name 工单功能名称`。可用 `--date YYYY-MM-DD` 指定文档日期；默认北京时间当天。工具不会覆盖同名文件。
3. 分类定义只在仓库根目录 `.spec-layout.json` 登记，生成器、文件头工具与校验共用。根目录只允许本导航和 `_template.md`；不能新建功能文档或临时 plans 目录。
4. 保留 `YYYY-MM-DD-功能名.md` 命名；新建生成独立 ID，移动已有页面保留 ID、来源、确认状态和证据。只因移动不升级业务状态。
5. 配套图片、验证证据、SQL 和支持材料分别归 `assets/`、`evidence/`、`sql/`、`support/`，主 Spec 从所属分类以 `../evidence/...` 等相对路径直接引用；实施计划与主 Spec 放在同一分类，不另起根级 `plans/`。
6. 完成后运行 `node scripts/validate-knowledge-base.mjs --kb-root .`（或 `npm run docs:check`）；完整工作区可加 `--strict-workspace-links`。已安装的本仓库 pre-commit Hook 同步运行布局和知识校验。校验会报错并退出失败，不能用改分类配置或放宽例外来绕过错误。

| 分类 | 主要归属 |
| --- | --- |
| 01-基础资料与服务网络 | 商品、服务项目、渠道门店、网点、服务资源、行政区域等主档规则 |
| 02-商品注册消费者与会员 | 购买／注册、安装标识、消费者产品、会员画像、保修权益及消费者业务入口 |
| 03-服务工单与调度 | 服务申请、工单状态、受理／派单、排班、调度与回访 |
| 04-服务履约配件与费用 | 现场履约、完工审核、配件库存及领退调拨、盘点、评价和收费 |
| 05-平台集成与公共能力 | 认证／权限、共同 UI 底座、多语言、通知、AI／外部接口、运维与公共技术能力 |
| 06-测试验证与数据操作 | 专项回归、测试／演示数据、迁移执行、清理和环境验证记录 |

[模板](_template.md) · [AI 执行规范](../03-开发管理/00-开发与文档规范/01-AI开发执行规范.md) · [知识维护规范](../03-开发管理/00-开发与文档规范/03-LLM-Wiki文档维护规范.md)
