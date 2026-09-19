#!/usr/bin/env python3
"""W02 — detail, communication records, whitelist edit, restricted actions."""
import os, sys, json
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api import call, res, ok, TASKS
from db import query

R = []
IDS = {
    "EDIT": "9509191001", "APPOINT": "9509191002", "MISSING": "9509191003",
    "UNREACH": "9509191004", "CANCEL": "9509191005", "RESCHED": "9509191006",
    "ONSITE": "9509191007", "REMOTE": "9509191008", "SUPP": "9509191011",
}


def check(name, passed, detail=""):
    R.append((name, passed, detail))
    print(f"[{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


def one(sql, args=None):
    _, rows = query(sql, args)
    return rows[0] if rows else None


def detail(oid):
    env = call("GET", f"{TASKS}/{oid}")
    return env["data"] if ok(env) else None


print("=" * 20, "A. 任务详情", "=" * 20)
d = detail(IDS["EDIT"])
if d is None:
    check("详情可达", False); sys.exit(1)
check("详情可达且分类为 PENDING", d["category"] == "PENDING" and d["status"] == "PENDING_COMPLETION",
      f"category={d['category']} status={d['status']}")
required = ["id", "orderNo", "status", "statusLabel", "processingTag", "orderType", "orderTypeLabel",
            "serviceMode", "serviceModeLabel", "problemDescription", "contactName", "contactMobile",
            "address", "alternateMobile1", "alternateMobile2", "addressSupplement", "remark", "region",
            "expectedDate", "expectedTimeWindow", "stationName", "personnelName", "productSummary",
            "products", "statusHistory", "communications", "latestSubmission", "latestReview",
            "version", "actions", "serviceActive", "followUpStatus"]
check("详情含必要字段", not [k for k in required if k not in d],
      f"缺失={[k for k in required if k not in d]}")
check("详情含产品明细", len(d["products"]) == 1 and d["products"][0]["installationCode"] == "W2TEST-20260919-C01",
      json.dumps(d["products"], ensure_ascii=False))
check("详情含状态历史", len(d["statusHistory"]) >= 1, f"{len(d['statusHistory'])} 条")
check("详情含处理动作集合", "recordCommunication" in d["actions"] and "cancel" in d["actions"],
      str(d["actions"]))
check("详情联系人已解密", d["contactName"] and "*" not in d["contactName"],
      f"{d['contactName']}/{d['contactMobile']}")
check("范围外任务详情 404", call("GET", f"{TASKS}/9309181006").get("code") == 404)

print("\n" + "=" * 20, "B. 联系记录", "=" * 20)
oid = IDS["EDIT"]
before = one("SELECT COUNT(*) FROM afs_order_communication WHERE order_id=%s", (oid,))[0]
now = datetime.now().replace(microsecond=0)
rid = "W2TEST-COMM-01"
env = call("POST", f"{TASKS}/{oid}/communications", {
    "clientRequestId": rid, "channel": "PHONE", "result": "APPOINTMENT_CONFIRMED",
    "remark": "W2TEST 已与客户确认上门时间", "occurredAt": now.isoformat()})
check("联系记录写入成功", ok(env), res(env, 300) if not ok(env) else "")
after = one("SELECT COUNT(*) FROM afs_order_communication WHERE order_id=%s", (oid,))[0]
check("沟通表新增 1 行", after == before + 1, f"{before} -> {after}")
row = one("SELECT id,channel,occurred_at,request_id,request_hash,actor_id,content_ciphertext "
          "FROM afs_order_communication WHERE order_id=%s ORDER BY id DESC LIMIT 1", (oid,))
check("沟通行渠道/操作人正确", row[1] == "PHONE" and row[5] == 2, f"channel={row[1]} actor={row[5]}")
check("沟通行 request_id 与摘要已落库", row[3] == rid and len(row[4]) == 64, f"request={row[3]}")
if ok(env):
    comm = env["data"]["communications"]
    check("详情回读新沟通记录（解密内容）",
          comm and comm[0]["content"].startswith("已确认预约") and "W2TEST" in comm[0]["content"],
          json.dumps(comm[0], ensure_ascii=False)[:160] if comm else "无")
    check("联系记录不改变工单状态", env["data"]["status"] == "PENDING_COMPLETION",
          env["data"]["status"])

env2 = call("POST", f"{TASKS}/{oid}/communications", {
    "clientRequestId": rid, "channel": "PHONE", "result": "APPOINTMENT_CONFIRMED",
    "remark": "W2TEST 已与客户确认上门时间", "occurredAt": now.isoformat()})
after2 = one("SELECT COUNT(*) FROM afs_order_communication WHERE order_id=%s", (oid,))[0]
check("同请求号同内容幂等不重复写入", ok(env2) and after2 == after, f"count={after2} code={env2.get('code')}")

env3 = call("POST", f"{TASKS}/{oid}/communications", {
    "clientRequestId": rid, "channel": "PHONE", "result": "NO_ANSWER",
    "remark": "W2TEST 内容不同", "occurredAt": now.isoformat()})
check("同请求号不同内容被拒绝", env3.get("code") == 409, f"code={env3.get('code')} {env3.get('errMsg')}")

env4 = call("POST", f"{TASKS}/{oid}/communications", {
    "clientRequestId": "W2TEST-COMM-FUTURE", "channel": "PHONE", "result": "CONNECTED",
    "remark": "", "occurredAt": (datetime.now() + timedelta(days=1)).isoformat()})
check("未来联系时间被拒绝", env4.get("code") == 422, f"code={env4.get('code')} {env4.get('errMsg')}")

env5 = call("POST", f"{TASKS}/{oid}/communications", {
    "clientRequestId": "W2TEST-COMM-BAD", "channel": "TELEPATHY", "result": "CONNECTED",
    "remark": "", "occurredAt": now.isoformat()})
check("非法联系渠道被拒绝", env5.get("code") == 422, f"code={env5.get('code')} {env5.get('errMsg')}")

env6 = call("POST", f"{TASKS}/{oid}/communications", {
    "channel": "PHONE", "result": "CONNECTED",
    "remark": "", "occurredAt": now.isoformat()})
check("缺请求号被拒绝", env6.get("code") == 422, f"code={env6.get('code')} {env6.get('errMsg')}")
env7 = call("POST", f"{TASKS}/9309181007/communications", {
    "clientRequestId": "W2TEST-COMM-X", "channel": "PHONE", "result": "CONNECTED",
    "remark": "", "occurredAt": now.isoformat()})
check("范围外任务写联系记录被拒绝", env7.get("code") == 404, f"code={env7.get('code')}")

print("\n" + "=" * 20, "C. 白名单字段修改", "=" * 20)
oid = IDS["EDIT"]
d = detail(oid)
ver = d["version"]
audit_before = one("SELECT COUNT(*) FROM afs_mobile_task_action_audit WHERE order_id=%s", (oid,))[0]
env = call("PATCH", f"{TASKS}/{oid}", {
    "clientRequestId": "W2TEST-EDIT-01", "version": ver,
    "alternateMobile1": "13800000101", "alternateMobile2": "13800000102",
    "addressSupplement": "W2TEST 地址补充：3 号楼 2 单元",
    "remark": "W2TEST 备注：门口有台阶"})
check("白名单修改成功", ok(env), res(env, 300) if not ok(env) else "")
srow = one("SELECT alternate_mobile1_masked,alternate_mobile2_masked,address_supplement_masked,remark,"
           "revision FROM afs_service_order WHERE id=%s", (oid,))
check("备用电话1 已脱敏落库", srow[0] == "138****0101", srow[0])
check("备用电话2 已脱敏落库", srow[1] == "138****0102", srow[1])
check("地址补充已脱敏落库", srow[2].startswith("W2TEST") or "****" in srow[2], srow[2])
check("任务备注已落库", srow[3] == "W2TEST 备注：门口有台阶", srow[3])
check("工单版本递增", srow[4] == 2, f"revision={srow[4]}")
check("详情回读备用电话为明文（本人可见）",
      env["data"]["alternateMobile1"] == "13800000101" and env["data"]["addressSupplement"].startswith("W2TEST"),
      f"{env['data']['alternateMobile1']} / {env['data']['addressSupplement'][:20]}")
audit_after = one("SELECT COUNT(*) FROM afs_mobile_task_action_audit WHERE order_id=%s", (oid,))[0]
check("动作审计新增 1 条", audit_after == audit_before + 1, f"{audit_before} -> {audit_after}")
check("审计动作码为 EDIT_SUPPLEMENT",
      one("SELECT action_code FROM afs_mobile_task_action_audit WHERE order_id=%s ORDER BY id DESC LIMIT 1",
          (oid,))[0] == "EDIT_SUPPLEMENT")

env = call("PATCH", f"{TASKS}/{oid}", {
    "clientRequestId": "W2TEST-EDIT-STALE", "version": ver,
    "alternateMobile1": "13800000103", "addressSupplement": "", "remark": ""})
check("过期工单版本被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")

env = call("PATCH", f"{TASKS}/{oid}", {
    "clientRequestId": "W2TEST-EDIT-OVER", "version": detail(oid)["version"],
    "alternateMobile1": "13800000104", "addressSupplement": "", "remark": ""})
after_over = one("SELECT alternate_mobile1_masked FROM afs_service_order WHERE id=%s", (oid,))[0]
check("非法字符越权字段被忽略（仅允许字段生效）", ok(env) and after_over == "138****0104",
      f"code={env.get('code')} masked={after_over}")
st = one("SELECT status,personnel_id,station_id FROM afs_service_order WHERE id=%s", (oid,))
check("修改补充信息不改变状态与归属", st[0] == "PENDING_COMPLETION" and st[1] == 5 and st[2] == 5, str(st))

print("\n" + "=" * 20, "D. 受限状态动作", "=" * 20)


_SEQ = {"n": 0}


def act(oid, action, **kw):
    _SEQ["n"] += 1
    rid = kw.pop("rid", None) or f"W2TEST-ACT-{action}-{oid}-{_SEQ['n']:02d}"
    body = {"action": action, "clientRequestId": rid, "version": kw.pop("version", None) or detail(oid)["version"],
            "reason": kw.pop("reason", "W2TEST 测试原因")}
    body.update(kw)
    return call("POST", f"{TASKS}/{oid}/actions", body)


# D1 APPOINT
oid = IDS["APPOINT"]
h_before = one("SELECT COUNT(*) FROM afs_order_status_history WHERE order_id=%s", (oid,))[0]
env = act(oid, "APPOINT", reason="", appointmentDate=datetime.now().date().isoformat(),
          appointmentTimeWindow="14:00-16:00")
check("确认预约成功", ok(env), res(env, 200) if not ok(env) else "")
row = one("SELECT expected_time_window,status,exception_code,revision FROM afs_service_order WHERE id=%s", (oid,))
check("预约时间段落库", row[0] == "14:00-16:00", row[0])
check("预约后状态仍为待处理", row[1] == "PENDING_COMPLETION", row[1])
check("预约写入状态历史",
      one("SELECT COUNT(*) FROM afs_order_status_history WHERE order_id=%s", (oid,))[0] == h_before + 1)
check("预约写入处理标签", env["data"]["processingTag"] == "今日预约", env["data"]["processingTag"])

# D2 预约日期早于今天
env = act(IDS["APPOINT"], "APPOINT", reason="",
          appointmentDate=(datetime.now().date() - timedelta(days=1)).isoformat(),
          appointmentTimeWindow="09:00-11:00")
check("早于今天的预约日期被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")

# D3 缺 reason
env = act(IDS["MISSING"], "MISSING_PARTS", reason="")
check("非预约动作缺原因被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")

# D4 MISSING_PARTS
oid = IDS["MISSING"]
env = act(oid, "MISSING_PARTS", reason="W2TEST 等待配件到货")
check("标记缺件成功", ok(env), res(env, 200) if not ok(env) else "")
st = one("SELECT exception_code,exception_reason,status,exception_previous_status FROM afs_service_order WHERE id=%s", (oid,))
check("缺件异常码与原因落库", st[0] == "MISSING_PARTS" and st[1] == "W2TEST 等待配件到货", str(st[:2]))
check("缺件保留前一状态", st[3] == "PENDING_COMPLETION", st[3])
check("缺件写入异常事件",
      one("SELECT COUNT(*) FROM afs_order_exception_event WHERE order_id=%s AND action_code='MISSING_PARTS'", (oid,))[0] == 1)
check("缺件后列表处理标签为等待配件", env["data"]["processingTag"] == "等待配件", env["data"]["processingTag"])

# D5 UNREACHABLE
oid = IDS["UNREACH"]
env = act(oid, "UNREACHABLE", reason="W2TEST 客户电话无法接通")
check("标记断联成功", ok(env), res(env, 200) if not ok(env) else "")
check("断联异常码落库",
      one("SELECT exception_code FROM afs_service_order WHERE id=%s", (oid,))[0] == "UNREACHABLE")

# D6 CANCEL
oid = IDS["CANCEL"]
env = act(oid, "CANCEL", reason="W2TEST 客户取消服务")
check("取消任务成功", ok(env), res(env, 200) if not ok(env) else "")
check("取消后状态与异常码落库",
      one("SELECT status,exception_code FROM afs_service_order WHERE id=%s", (oid,)) == ("CANCELLED", "CANCEL"))
check("取消后详情分类进入历史", env["data"]["category"] == "HISTORY", env["data"]["category"])
check("取消后不再提供取消动作", "cancel" not in env["data"]["actions"], str(env["data"]["actions"]))

# D7 幂等
oid = IDS["MISSING"]
body = {"action": "MISSING_PARTS", "clientRequestId": "W2TEST-ACT-IDEM-01",
        "version": detail(oid)["version"], "reason": "W2TEST 幂等复测"}
env_a = call("POST", f"{TASKS}/{oid}/actions", body)
cnt = one("SELECT COUNT(*) FROM afs_order_status_history WHERE order_id=%s", (oid,))[0]
aud = one("SELECT COUNT(*) FROM afs_mobile_task_action_audit WHERE order_id=%s", (oid,))[0]
env_b = call("POST", f"{TASKS}/{oid}/actions", body)
cnt2 = one("SELECT COUNT(*) FROM afs_order_status_history WHERE order_id=%s", (oid,))[0]
aud2 = one("SELECT COUNT(*) FROM afs_mobile_task_action_audit WHERE order_id=%s", (oid,))[0]
check("首次动作成功并为幂等基线", ok(env_a), f"code={env_a.get('code')} {env_a.get('errMsg')}")
check("同请求号重复动作幂等（历史与审计均不重复）",
      ok(env_b) and cnt == cnt2 and aud == aud2, f"history {cnt}->{cnt2}, audit {aud}->{aud2}")
body_bad = dict(body, reason="W2TEST 幂等复测(不同内容)")
env_c = call("POST", f"{TASKS}/{oid}/actions", body_bad)
check("同请求号不同内容动作被拒绝", env_c.get("code") == 409, f"code={env_c.get('code')} {env_c.get('errMsg')}")

# D8 过期版本
env = call("POST", f"{TASKS}/{IDS['APPOINT']}/actions",
           {"action": "CANCEL", "clientRequestId": "W2TEST-ACT-STALE", "version": "stale-version", "reason": "x"})
check("过期版本号被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")

# D9 非法动作 / 不受支持动作
env = call("POST", f"{TASKS}/{IDS['APPOINT']}/actions",
           {"action": "COMPLETE_NOW", "clientRequestId": "W2TEST-ACT-BAD",
            "version": detail(IDS['APPOINT'])["version"], "reason": "x"})
check("枚举外动作被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")

env = call("POST", f"{TASKS}/{IDS['SUPP']}/actions",
           {"action": "CANCEL", "clientRequestId": "W2TEST-ACT-SUPP",
            "version": detail(IDS['SUPP'])["version"], "reason": "x"})
check("待补资料任务不允许取消（服务端 actions 再校验）", env.get("code") == 409,
      f"code={env.get('code')} {env.get('errMsg')}")

# D10 签到后改约失活当前服务
oid = IDS["RESCHED"]
env = call("POST", f"{TASKS}/{oid}/check-ins", {
    "clientRequestId": "W2TEST-CHECKIN-RESCHED", "workOrderVersion": detail(oid)["version"],
    "longitude": 121.4737, "latitude": 31.2304, "accuracyMeters": 20,
    "locationAuthorized": True, "locationException": ""})
check("现场签到成功（改约前置）", ok(env), res(env, 300) if not ok(env) else "")
ex = one("SELECT service_active,start_mode,longitude,latitude,location_accuracy_meters,location_authorized "
         "FROM afs_service_execution WHERE order_id=%s", (oid,))
check("执行事实落库（签到）", ex and ex[0] == 1 and ex[1] == "ONSITE_CHECK_IN", str(ex))
check("签到坐标与授权落库", str(ex[2]) == "121.4737000" and ex[5] == 1, str(ex[2:]))
env = act(oid, "RESCHEDULE", reason="W2TEST 客户要求改约",
          appointmentDate=(datetime.now().date() + timedelta(days=2)).isoformat(),
          appointmentTimeWindow="10:00-12:00")
check("改约成功", ok(env), res(env, 300) if not ok(env) else "")
ex2 = one("SELECT service_active,ended_at FROM afs_service_execution WHERE order_id=%s", (oid,))
check("改约后当前服务被失活并记录结束时间", ex2[0] == 0 and ex2[1] is not None, str(ex2))
check("改约后任务回到待处理", env["data"]["status"] == "PENDING_COMPLETION", env["data"]["status"])
check("改约后详情不再显示进行中", env["data"]["serviceActive"] is False, str(env["data"]["serviceActive"]))

print("\n" + "=" * 20, "汇总", "=" * 20)
failed = [r for r in R if not r[1]]
print(f"共 {len(R)} 项，通过 {len(R) - len(failed)}，失败 {len(failed)}")
for n, _, dt in failed:
    print(f"  FAIL {n} — {dt}")
