# 服务人员小程序 W01／W02／W04 真实链路验证夹具

2026-09-19 用于验证「服务人员小程序已开发的任务功能能否完整跑通」的一次性可用、可复用的验证台。
本目录只含验证脚本，不含业务代码；不属于产品交付物。

## 结论速览

| 切片 | 结果 | 说明 |
| --- | --- | --- |
| W01 任务列表／详情（只读） | 42 / 42 通过 | 四分类、二级筛选、同源计数、关键词、分页、跨范围 404、失效会话 4001 |
| W02 联系记录／白名单／受限动作 | 62 / 62 通过 | 掩码读写、版本冲突、枚举与状态门禁、幂等、审计 |
| W04 履约闭环 | 104 / 105 通过 | 唯一失败为刻意植入的服务端缺陷探针 |
| 端侧运行时结构校验 | 65 / 65 通过 | `src/types/task.ts` 的 `isServiceTask*` 系列校验器 |

## 前置条件

- 本地聚合后端在 `http://127.0.0.1:8080`（context-path `/api`），移动端路由前缀 `/api/afterSales/mobile/service-personnel/...`
- Redis 在 `127.0.0.1:16379`（`GaiaIdGenerator` 的 `ID_KE_afs_*` 计数器）
- 测试库 `gaia_wh_init_wzy` 可连（见 `db.py` 内的连接参数）
- Python venv：`/Users/snow/.workbuddy/binaries/python/envs/default/bin/python`（需 `pymysql`）

数据库凭据不写入仓库，运行前先导出环境变量（`db.py` 会校验缺失并明确报错）：

```zsh
export AFS_DB_HOST=10.1.1.106
export AFS_DB_PORT=3306
export AFS_DB_USER=root
export AFS_DB_PASSWORD=<口令>
export AFS_DB_NAME=gaia_wh_init_wzy
```

## 运行顺序（务必按序）

```zsh
PY=/Users/snow/.workbuddy/binaries/python/envs/default/bin/python
cd <本目录>

$PY new_session.py       # 插入专用移动会话行并写出 session.json（token 当日有效）
$PY fixture_w2.py        # 重建 W2TEST-20260919-* 夹具（先清后建）
$PY calibrate_seq.py     # 校准 Redis 主键计数器到各表 max(id)
$PY t_w01.py             # W01 只读校验
$PY t_w02.py             # W02 写动作校验（依赖夹具）
$PY t_w04.py             # W04 履约校验（依赖夹具）
$PY sweep_w04.py         # 收尾跨表一致性对账
```

或直接用 `run_w01_w02.sh`／`run_w04.sh`（各自已包含夹具重建与序列校准）。

> `session.json` 不入库（见 `.gitignore`），每次需重新生成。
> 端侧契约校验需另备：把服务人员端 `src/types/task.ts` 全文 + 校验主体拼成一个 `.mts` 后用 node 运行。

## 三条必须遵守的纪律（都是踩过的坑）

1. **每轮验证前必须重跑夹具。** `fixture_w2.py` 会先清空 `9509191xxx` 区间再重建。若沿用上轮数据，草稿 revision、幂等请求号、执行事实都会残留，产生大量假失败。
2. **库存单据链路必须一起清理。** `afs_part_inventory_document` 有唯一键 `uk_..._request`（`document_type` + `client_request_id`），`consumeParts` 的 `client_request_id` 由「工单号 + 请求号」派生。夹具若只删工单不删单据，下次完工提交会撞唯一键，报 `503 数据操作未完成`——这不是业务缺陷，是夹具漏清。本目录夹具已包含单据／明细／流水／历史四表。
3. **手工种数据必须校准主键序列。** `GaiaIdGenerator` 以 Redis 计数器发号，计数器小于该表 `max(id)` 时会 fail-closed 抛 503「售后业务主键序列未同步」。夹具用固定高段 ID（`950919xxxx`），所以种完数据必须跑 `calibrate_seq.py`。反过来，如果业务后台停过机或手工插过 ID，也用这个脚本对齐。

## 已知缺陷（验证中发现的真实问题）

`DEF-20260919-01`：同工单用**不同**请求号重复调用现场签到／远程开始接口时，服务端没有「已有活动执行」的前置判断，`startService` 的 `ON DUPLICATE KEY UPDATE` 会覆盖 `started_at`、清空 `ended_at`、`revision+1` 并追加第二条动作审计。端侧签到后已隐藏 `checkIn` 动作，服务端未同等拒绝。
同一请求号的重复调用已被幂等回放正确拦截，完工提交也有请求号回放保护，因此仅签到／远程开始受影响。

## 清理

```zsh
$PY fixture_w2.py --cleanup   # 清空本夹具全部数据（29 条删除语句，区间固定为 9509191xxx）
```

会话行单独清理（表 `afs_service_personnel_session`，验证插入的行 `id=8`）。
清理前请确认该区间没有其他人在用。
