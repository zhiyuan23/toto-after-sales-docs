#!/usr/bin/env python3
"""W01 — task list: categories, counts, filters, search, pagination, scope."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api import call, res, ok, TASKS
from db import query

PERSONNEL, STATION = 5, 5
results = []


def check(name, passed, detail=""):
    results.append((name, passed, detail))
    print(f"[{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


CATEGORY_SQL = """
SELECT
  CASE
    WHEN o.status='PENDING_COMPLETION' AND COALESCE((
      SELECT cr.decision FROM afs_completion_review cr WHERE cr.order_id=o.id
      ORDER BY cr.reviewed_at DESC,cr.id DESC LIMIT 1),'')='REJECT' THEN 'SUPPLEMENT'
    WHEN o.status='PENDING_REVIEW' THEN 'REVIEW'
    WHEN o.status IN ('COMPLETED','PENDING_FOLLOW_UP','CLOSED','CANCELLED','PENDING_HANDOVER') THEN 'HISTORY'
    ELSE 'PENDING'
  END category, o.order_no, o.id, o.expected_date, o.exception_code, o.status
FROM afs_service_order o
WHERE o.personnel_id=%s AND o.station_id=%s AND o.status IN
  ('PENDING_COMPLETION','APPOINTED','MISSING_PARTS','RESCHEDULED','UNREACHABLE',
   'PENDING_REVIEW','COMPLETED','PENDING_FOLLOW_UP','CLOSED','CANCELLED','PENDING_HANDOVER')
"""

_, rows = query(CATEGORY_SQL, (PERSONNEL, STATION))
db_all = [dict(zip(["category", "order_no", "id", "expected_date", "exception_code", "status"], r)) for r in rows]
active_ids = {str(r[0]) for r in query(
    "SELECT order_id FROM afs_service_execution WHERE service_active=1")[1]}
db_list = {c: sorted(r["order_no"] for r in db_all if r["category"] == c) for c in
           ("PENDING", "SUPPLEMENT", "REVIEW", "HISTORY")}
db_list["PENDING"] = sorted(r["order_no"] for r in db_all
                            if r["category"] == "PENDING" and str(r["id"]) not in active_ids)

print("=== 数据库侧可见范围基线 ===")
for c, names in db_list.items():
    print(f"  {c}: {len(names)} -> {names}")
print(f"  当前服务(currentServices): {sorted(active_ids)}")

# --- 1. 四分类逐类查询 ---
api_by_cat = {}
for cat in ("PENDING", "SUPPLEMENT", "REVIEW", "HISTORY"):
    env = call("GET", f"{TASKS}?page=1&pageSize=50&category={cat}")
    if not ok(env):
        check(f"列表 {cat}", False, res(env, 300)); continue
    data = env["data"]
    api_by_cat[cat] = data
    names = sorted(r["orderNo"] for r in data["rows"])
    check(f"列表 {cat} 与库内范围一致", names == db_list[cat],
          f"api={names} db={db_list[cat]}")
    check(f"列表 {cat} total 与行数一致", data["records"] == len(data["rows"]),
          f"total={data['records']} rows={len(data['rows'])}")

# --- 2. 分类计数同源 / 四分类互斥合计 ---
counts = api_by_cat["PENDING"]["categoryCounts"]
check("categoryCounts 四键齐全", set(counts) == {"PENDING", "SUPPLEMENT", "REVIEW", "HISTORY"}, str(counts))
for cat in counts:
    expected = api_by_cat[cat]["records"] + (len(api_by_cat[cat]["currentServices"]) if cat == "PENDING" else 0)
    check(f"categoryCounts[{cat}] == 列表 total(+当前服务)",
          counts[cat] == expected, f"counts={counts[cat]} 期望={expected}")
sum_list = sum(len(v) for v in db_list.values()) + len(active_ids)
check("四分类合计 + 当前服务 == 可见任务总数",
      sum(counts.values()) == sum_list, f"counts合计={sum(counts.values())} 库内={sum_list}")

# --- 3. 二级筛选 TODAY / MISSING_PARTS ---
today_env = call("GET", f"{TASKS}?page=1&pageSize=50&category=PENDING&secondaryFilter=TODAY")
today_db = sorted(r["order_no"] for r in db_all
                  if r["category"] == "PENDING" and str(r["id"]) not in active_ids
                  and str(r["expected_date"]) == __import__("datetime").date.today().isoformat())
got = sorted(r["orderNo"] for r in today_env["data"]["rows"]) if ok(today_env) else []
check("二级筛选 TODAY 与库内一致", got == today_db, f"api={got} db={today_db}")

mp_env = call("GET", f"{TASKS}?page=1&pageSize=50&category=PENDING&secondaryFilter=MISSING_PARTS")
mp_db = sorted(r["order_no"] for r in db_all
               if r["category"] == "PENDING" and str(r["id"]) not in active_ids
               and r["exception_code"] == "MISSING_PARTS")
got = sorted(r["orderNo"] for r in mp_env["data"]["rows"]) if ok(mp_env) else []
check("二级筛选 MISSING_PARTS 与库内一致", got == mp_db, f"api={got} db={mp_db}")

sc = api_by_cat["PENDING"]["secondaryCounts"]
print(f"  secondaryCounts = {sc}")
check("secondaryCounts.TODAY == 待处理(今日预约) + 进行中(今日)",
      sc["TODAY"] == len(today_db) + len([i for i in active_ids
        if any(r['id'] == int(i) and str(r['expected_date']) == __import__("datetime").date.today().isoformat()
               for r in db_all)]), f"api={sc['TODAY']}")

# --- 4. 关键词搜索 ---
for kw, expect in (("G3TEST-20260918-TODAY", ["G3TEST-20260918-TODAY"]),
                   ("UITEST-20260919-ONSITE", ["UITEST-20260919-ONSITE"])):
    env = call("GET", f"{TASKS}?page=1&pageSize=50&category=PENDING&keyword={kw}")
    got = sorted(r["orderNo"] for r in env["data"]["rows"]) if ok(env) else []
    check(f"关键词搜索 {kw}", got == expect, f"api={got}")

env = call("GET", f"{TASKS}?page=1&pageSize=50&category=HISTORY&keyword=G3TEST-20260918-HISTORY")
got = sorted(r["orderNo"] for r in env["data"]["rows"]) if ok(env) else []
check("历史分类关键词搜索", got == ["G3TEST-20260918-HISTORY"], f"api={got}")

env = call("GET", f"{TASKS}?page=1&pageSize=50&category=PENDING&keyword=ZZZ-NO-SUCH-TASK")
check("搜索无结果返回空列表", ok(env) and env["data"]["records"] == 0 and env["data"]["rows"] == [],
      f"total={env['data']['records'] if ok(env) else env}")

# --- 5. 分页 ---
p1 = call("GET", f"{TASKS}?page=1&pageSize=1&category=PENDING")
p2 = call("GET", f"{TASKS}?page=2&pageSize=1&category=PENDING")
if ok(p1) and ok(p2):
    check("分页 pageSize=1 返回单行", len(p1["data"]["rows"]) == 1 and len(p2["data"]["rows"]) == 1,
          f"p1={len(p1['data']['rows'])} p2={len(p2['data']['rows'])}")
    check("分页不同页数据不同", p1["data"]["rows"][0]["orderNo"] != p2["data"]["rows"][0]["orderNo"],
          f"{p1['data']['rows'][0]['orderNo']} vs {p2['data']['rows'][0]['orderNo']}")
    check("分页 total 稳定", p1["data"]["records"] == p2["data"]["records"],
          f"{p1['data']['records']} / {p2['data']['records']}")

# --- 6. 当前服务（currentServices）与列表去重 ---
cs = api_by_cat["PENDING"]["currentServices"]
cs_ids = sorted(r["id"] for r in cs)
check("currentServices 与 afs_service_execution 事实一致", set(cs_ids) == active_ids,
      f"api={cs_ids} db={sorted(active_ids)}")
listed = {r["id"] for r in api_by_cat["PENDING"]["rows"]}
check("当前服务未在列表中重复出现", not (listed & set(cs_ids)), f"交集={listed & set(cs_ids)}")
for r in cs:
    check(f"当前服务 {r['orderNo']} 带 continueService/saveDraft/submitCompletion",
          {"continueService", "saveDraft", "verifyProductCode", "submitCompletion"} <= set(r["actions"]),
          str(r["actions"]))

# --- 7. 数据范围负向 ---
neg = {"9309181006": "同站其他人员", "9309181007": "当前人员其他站点", "9309181008": "未正式分配"}
for cat in ("PENDING", "SUPPLEMENT", "REVIEW", "HISTORY"):
    env = call("GET", f"{TASKS}?page=1&pageSize=100&category={cat}")
    ids = {r["id"] for r in env["data"]["rows"]} if ok(env) else set()
    leaked = set(neg) & ids
    check(f"负向任务未出现在 {cat} 分类", not leaked, f"泄漏={leaked or '无'}")
for oid, label in neg.items():
    env = call("GET", f"{TASKS}/{oid}")
    check(f"直达详情 {label} 被拒绝", env.get("code") == 404,
          f"code={env.get('code')} errMsg={env.get('errMsg')}")

# --- 8. 非法参数与鉴权 ---
env = call("GET", f"{TASKS}?page=1&pageSize=10&category=BOGUS")
check("非法分类被拒绝", env.get("code") != 0, f"code={env.get('code')} errMsg={env.get('errMsg')}")
env = call("GET", f"{TASKS}?page=1&pageSize=10&secondaryFilter=BOGUS")
check("非法二级筛选被拒绝", env.get("code") != 0, f"code={env.get('code')} errMsg={env.get('errMsg')}")
env = call("GET", TASKS, token="forged-token-000000000000")
check("会话失效被拒绝", env.get("code") == 4001, f"code={env.get('code')} errMsg={env.get('errMsg')}")
env = call("GET", f"{TASKS}/999999999")
check("不存在的任务返回 404", env.get("code") == 404, f"code={env.get('code')}")

# --- 9. 列表行字段完整性 ---
row = api_by_cat["PENDING"]["rows"][0]
required = ["id", "orderNo", "category", "status", "statusLabel", "orderTypeLabel", "serviceModeLabel",
            "contactName", "contactMobile", "address", "expectedDate", "expectedTimeWindow",
            "productSummary", "stationName", "personnelName", "actions", "revision", "serviceActive"]
missing = [k for k in required if k not in row]
check("列表行含必要字段", not missing, f"缺失={missing}")
check("列表行联系人/地址已解密（非掩码占位）",
      row["contactName"] and "*" not in row["contactName"],
      f"contactName={row['contactName']} mobile={row['contactMobile']}")
check("列表行返回版本号", bool(row["version"]), f"version={row['version'][:24]}…")

print("\n=== 汇总 ===")
failed = [r for r in results if not r[1]]
print(f"共 {len(results)} 项，通过 {len(results) - len(failed)}，失败 {len(failed)}")
for name, _, detail in failed:
    print(f"  FAIL {name} — {detail}")
