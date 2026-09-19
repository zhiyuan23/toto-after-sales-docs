#!/usr/bin/env python3
"""W04 — check-in/remote start, resumable draft, product code, completion, progress, supplement."""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api import call, res, ok, TASKS
from db import query

R = []
O = {"ONSITE": "9509191007", "REMOTE": "9509191008", "A": "9509191009", "B": "9509191010",
     "SUPP": "9509191011", "EDIT": "9509191001"}
CODE = {"ONSITE": "W2TEST-20260919-C07", "REMOTE": "W2TEST-20260919-C08", "SUPP": "W2TEST-20260919-C11"}
EV = {"site": ["https://example.invalid/w2test/site-1.jpg", "https://example.invalid/w2test/site-2.jpg"],
      "nameplate": ["https://example.invalid/w2test/nameplate-1.jpg"],
      "comm": ["https://example.invalid/w2test/chat-1.png"],
      "confirm": ["https://example.invalid/w2test/sign-1.png"]}


def check(name, passed, detail=""):
    R.append((name, passed, detail))
    print(f"[{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


def one(sql, args=None):
    _, rows = query(sql, args)
    return rows[0] if rows else None


def detail(oid):
    env = call("GET", f"{TASKS}/{oid}")
    return env["data"] if ok(env) else None


def ver(oid):
    return detail(oid)["version"]


def draft(oid):
    env = call("GET", f"{TASKS}/{oid}/draft")
    return env


def body_draft(oid, d_ver, **kw):
    b = {"clientRequestId": f"W2TEST-DRAFT-{len(R)}", "workOrderVersion": ver(oid),
         "draftVersion": d_ver, "currentStep": "SERVICE", "diagnosis": "", "serviceResult": "",
         "usageType": "NONE", "parts": [], "productCode": "", "rfidCode": "",
         "productDifferenceNote": "", "customerConfirmation": "", "customerConfirmationNote": "",
         "siteEvidence": [], "nameplateEvidence": [], "communicationEvidence": [], "confirmationEvidence": []}
    b.update(kw)
    return b


print("=" * 18, "1. 开始服务前草稿门禁", "=" * 18)
oid = O["ONSITE"]
env = draft(oid)
check("开始前草稿可读且为空版本", ok(env) and env["data"]["revision"] == 0 and env["data"]["currentStep"] == "SERVICE",
      f"code={env.get('code')} rev={env['data']['revision'] if ok(env) else '-'}")
check("空草稿版本号可用", bool(env["data"]["version"]), env["data"]["version"][:20] + "…" if ok(env) else "")
env = call("PUT", f"{TASKS}/{oid}/draft", body_draft(oid, env["data"]["version"], diagnosis="开始前写入"))
check("未开始服务时保存草稿被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")
check("被拒绝后草稿表无记录", one("SELECT COUNT(*) FROM afs_service_task_draft WHERE order_id=%s", (oid,))[0] == 0)

print("\n" + "=" * 18, "2. 现场签到", "=" * 18)
env = call("POST", f"{TASKS}/{oid}/check-ins", {
    "clientRequestId": "W2TEST-CI-01", "workOrderVersion": ver(oid),
    "longitude": None, "latitude": None, "accuracyMeters": None,
    "locationAuthorized": False, "locationException": ""})
check("无定位且无到达说明被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
env = call("POST", f"{TASKS}/{oid}/check-ins", {
    "clientRequestId": "W2TEST-CI-02", "workOrderVersion": ver(oid),
    "longitude": 121.47, "latitude": None, "accuracyMeters": 10,
    "locationAuthorized": True, "locationException": ""})
check("定位授权但坐标不完整被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
env = call("POST", f"{TASKS}/{oid}/check-ins", {
    "clientRequestId": "W2TEST-CI-03", "workOrderVersion": ver(oid),
    "longitude": 300, "latitude": 31.23, "accuracyMeters": 10,
    "locationAuthorized": True, "locationException": ""})
check("经度越界被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
check("三次拒绝均未建立执行事实",
      one("SELECT COUNT(*) FROM afs_service_execution WHERE order_id=%s", (oid,))[0] == 0)

env = call("POST", f"{TASKS}/{oid}/check-ins", {
    "clientRequestId": "W2TEST-CI-OK", "workOrderVersion": ver(oid),
    "longitude": 121.473701, "latitude": 31.230416, "accuracyMeters": 18,
    "locationAuthorized": True, "locationException": ""})
check("现场签到成功", ok(env), res(env, 300) if not ok(env) else "")
ex = one("SELECT personnel_id,station_id,service_active,start_mode,current_step,longitude,latitude,"
         "location_accuracy_meters,location_authorized,started_at,ended_at FROM afs_service_execution WHERE order_id=%s", (oid,))
check("执行事实：人员/站点/模式/时间正确",
      ex and ex[0] == 5 and ex[1] == 5 and ex[2] == 1 and ex[3] == "ONSITE_CHECK_IN" and ex[4] == "SERVICE" and ex[9] and not ex[10],
      str(ex))
check("执行事实：坐标与授权落库",
      str(ex[5]) == "121.4737010" and str(ex[6]) == "31.2304160" and ex[7] == 18 and ex[8] == 1,
      f"lon={ex[5]} lat={ex[6]} acc={ex[7]} auth={ex[8]}")
check("签到写入动作审计",
      one("SELECT action_code FROM afs_mobile_task_action_audit WHERE order_id=%s ORDER BY id DESC LIMIT 1", (oid,))[0] == "ONSITE_CHECK_IN")
check("签到后详情显示进行中与步骤", env["data"]["serviceActive"] is True and env["data"]["currentServiceStep"] == "SERVICE",
      f"active={env['data']['serviceActive']} step={env['data']['currentServiceStep']}")
check("签到后列表 currentServices 置顶本单",
      oid in [r["id"] for r in call("GET", f"{TASKS}?category=PENDING&pageSize=50")["data"]["currentServices"]])
check("签到后详情不再提供 checkIn 动作", "checkIn" not in env["data"]["actions"], str(env["data"]["actions"]))
env2 = call("POST", f"{TASKS}/{oid}/check-ins", {
    "clientRequestId": "W2TEST-CI-AGAIN", "workOrderVersion": env["data"]["version"],
    "longitude": 121.473701, "latitude": 31.230416, "accuracyMeters": 18,
    "locationAuthorized": True, "locationException": ""})
check("[缺陷探针] 重复签到被拒绝（客户端已隐藏该动作，服务端应同样拒绝）",
      env2.get("code") == 409, f"code={env2.get('code')} {env2.get('errMsg') or '重复签到被接受并重置开始时间'}")
if env2.get("code") == 0:
    again = one("SELECT started_at,current_step FROM afs_service_execution WHERE order_id=%s", (oid,))
    print(f"    └ 观察：重复签到后 started_at={again[0]} current_step={again[1]}；"
          f"审计条数={one('SELECT COUNT(*) FROM afs_mobile_task_action_audit WHERE order_id=%s', (oid,))[0]}")

print("\n" + "=" * 18, "3. 远程开始服务", "=" * 18)
roid = O["REMOTE"]
env = call("POST", f"{TASKS}/{roid}/check-ins", {
    "clientRequestId": "W2TEST-CI-REMOTE", "workOrderVersion": ver(roid),
    "longitude": 121.47, "latitude": 31.23, "accuracyMeters": 10,
    "locationAuthorized": True, "locationException": ""})
check("远程任务不接受现场签到", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")
env = call("POST", f"{TASKS}/{roid}/remote-starts", {
    "clientRequestId": "W2TEST-RS-01", "workOrderVersion": ver(roid),
    "longitude": 121.47, "latitude": 31.23, "accuracyMeters": 10,
    "locationAuthorized": True, "locationException": ""})
check("远程开始不得携带现场定位", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
env = call("POST", f"{TASKS}/{roid}/remote-starts", {
    "clientRequestId": "W2TEST-RS-OK", "workOrderVersion": ver(roid),
    "longitude": None, "latitude": None, "accuracyMeters": None,
    "locationAuthorized": False, "locationException": ""})
check("远程开始服务成功", ok(env), res(env, 300) if not ok(env) else "")
rex = one("SELECT service_active,start_mode,longitude,latitude,location_authorized,location_exception "
          "FROM afs_service_execution WHERE order_id=%s", (roid,))
check("远程执行事实不产生伪签到", rex[0] == 1 and rex[1] == "REMOTE_START" and rex[2] is None and rex[3] is None,
      str(rex))
env = call("POST", f"{TASKS}/{O['EDIT']}/remote-starts", {
    "clientRequestId": "W2TEST-RS-ONSITE", "workOrderVersion": ver(O['EDIT']),
    "longitude": None, "latitude": None, "accuracyMeters": None,
    "locationAuthorized": False, "locationException": ""})
check("上门任务不接受远程开始", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")

print("\n" + "=" * 18, "4. 草稿读写与校验（现场）", "=" * 18)
oid = O["ONSITE"]
env = draft(oid)
d_ver = env["data"]["version"]
env = call("PUT", f"{TASKS}/{oid}/draft", body_draft(oid, d_ver, diagnosis="检测：进水阀异常",
                                                     usageType="NONE", parts=[{"partId": "2", "quantity": 1}]))
check("未使用配件却填耗用明细被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
env = call("PUT", f"{TASKS}/{oid}/draft", body_draft(oid, d_ver, diagnosis="检测：进水阀异常",
                                                     usageType="PARTS", parts=[]))
check("使用配件却无耗用明细被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
env = call("PUT", f"{TASKS}/{oid}/draft", body_draft(oid, d_ver, diagnosis="检测",
                                                     usageType="PARTS", parts=[{"partId": "999999", "quantity": 1}]))
check("不存在或停用配件被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
env = call("PUT", f"{TASKS}/{oid}/draft", body_draft(oid, d_ver, diagnosis="检测",
                                                     siteEvidence=["not-a-url"]))
check("非法证据引用格式被拒绍".replace("拒绍", "拒绝"), env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
env = call("PUT", f"{TASKS}/{oid}/draft", body_draft(oid, d_ver, diagnosis="检测：进水阀异常，需更换连接件",
                                                     serviceResult="更换排水连接件并试水正常",
                                                     usageType="PARTS", parts=[{"partId": "2", "quantity": 1}],
                                                     productCode=CODE["ONSITE"], currentStep="EVIDENCE"))
check("草稿保存成功（含配件耗用）", ok(env), res(env, 300) if not ok(env) else "")
check("草稿版本递增到 1", env["data"]["revision"] == 1, f"revision={env['data']['revision']}")
check("草稿内容回读一致",
      env["data"]["diagnosis"] == "检测：进水阀异常，需更换连接件"
      and env["data"]["parts"] and env["data"]["parts"][0]["partId"] == "2",
      json.dumps(env["data"]["parts"], ensure_ascii=False))
check("草稿配件明细落库", one("SELECT quantity FROM afs_service_task_draft_part WHERE order_id=%s AND part_id=2", (oid,))[0] == 1)
check("执行事实步骤同步为 EVIDENCE",
      one("SELECT current_step FROM afs_service_execution WHERE order_id=%s", (oid,))[0] == "EVIDENCE")
check("草稿保存写入动作审计",
      one("SELECT COUNT(*) FROM afs_mobile_task_action_audit WHERE order_id=%s AND action_code='SAVE_DRAFT'", (oid,))[0] == 1)
d1 = env["data"]["version"]
env = call("PUT", f"{TASKS}/{oid}/draft", body_draft(oid, d_ver, diagnosis="过期草稿版本"))
check("过期草稿版本被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")
old_wo = ver(oid)
call("PATCH", f"{TASKS}/{oid}", {"clientRequestId": "W2TEST-EDIT-W04", "version": old_wo,
                                 "alternateMobile1": "", "addressSupplement": "", "remark": "W2TEST 并发修改"})
env = call("PUT", f"{TASKS}/{oid}/draft", {"clientRequestId": "W2TEST-DRAFT-STALE", "workOrderVersion": old_wo,
                                           "draftVersion": d1, "currentStep": "EVIDENCE", "diagnosis": "x",
                                           "serviceResult": "", "usageType": "NONE", "parts": [],
                                           "productCode": "", "rfidCode": "", "productDifferenceNote": "",
                                           "customerConfirmation": "", "customerConfirmationNote": "",
                                           "siteEvidence": [], "nameplateEvidence": [],
                                           "communicationEvidence": [], "confirmationEvidence": []})
check("过期工单版本保存草稿被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")
same = body_draft(oid, d1, diagnosis="检测：进水阀异常，需更换连接件",
                  serviceResult="更换排水连接件并试水正常", usageType="PARTS",
                  parts=[{"partId": "2", "quantity": 1}], productCode=CODE["ONSITE"], currentStep="EVIDENCE")
same["clientRequestId"] = "W2TEST-DRAFT-IDEM"
env_a = call("PUT", f"{TASKS}/{oid}/draft", same)
rev_a = one("SELECT revision FROM afs_service_task_draft WHERE order_id=%s", (oid,))[0]
env_b = call("PUT", f"{TASKS}/{oid}/draft", same)
rev_b = one("SELECT revision FROM afs_service_task_draft WHERE order_id=%s", (oid,))[0]
check("同请求号同内容保存草稿幂等", ok(env_b) and rev_a == rev_b, f"revision {rev_a} -> {rev_b}")

print("\n" + "=" * 18, "5. 草稿隔离", "=" * 18)
for key, note in (("A", "A 单草稿"), ("B", "B 单草稿")):
    t = O[key]
    call("POST", f"{TASKS}/{t}/check-ins", {
        "clientRequestId": f"W2TEST-CI-{key}", "workOrderVersion": ver(t),
        "longitude": 121.4, "latitude": 31.2, "accuracyMeters": 12,
        "locationAuthorized": True, "locationException": ""})
    dv = draft(t)["data"]["version"]
    e = call("PUT", f"{TASKS}/{t}/draft", body_draft(t, dv, diagnosis=note, serviceResult=note + "结果"))
    check(f"{key} 单草稿保存成功", ok(e), res(e, 200) if not ok(e) else "")
da = draft(O["A"])["data"]["diagnosis"]
db_ = draft(O["B"])["data"]["diagnosis"]
do = draft(O["ONSITE"])["data"]["diagnosis"]
check("三张工单草稿互不串写",
      da == "A 单草稿" and db_ == "B 单草稿" and do.startswith("检测：进水阀异常"),
      f"A={da} B={db_} ONSITE={do[:16]}")
check("草稿表按工单独立 3 行",
      one("SELECT COUNT(*) FROM afs_service_task_draft WHERE order_id IN (%s,%s,%s)",
          (O["A"], O["B"], O["ONSITE"]))[0] == 3)

print("\n" + "=" * 18, "6. 产品码校验", "=" * 18)
env = call("POST", f"{TASKS}/{O['ONSITE']}/product-code-verifications", {"code": CODE["ONSITE"], "source": "SCAN"})
check("本单产品码校验匹配", ok(env) and env["data"]["matched"] is True, res(env, 200) if ok(env) else str(env))
check("匹配时返回产品名", ok(env) and bool(env["data"]["productName"]),
      env["data"].get("productName", "") if ok(env) else "")
env = call("POST", f"{TASKS}/{O['ONSITE']}/product-code-verifications", {"code": "W2TEST-NO-SUCH-CODE", "source": "MANUAL"})
check("不存在产品码返回不匹配（非报错）", ok(env) and env["data"]["matched"] is False, res(env, 200) if ok(env) else str(env))
env = call("POST", f"{TASKS}/{O['ONSITE']}/product-code-verifications", {"code": CODE["REMOTE"], "source": "MANUAL"})
check("他单产品码判为不匹配", ok(env) and env["data"]["matched"] is False, res(env, 200) if ok(env) else str(env))
env = call("POST", f"{TASKS}/{O['ONSITE']}/product-code-verifications", {"code": "", "source": "MANUAL"})
check("空产品码被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
env = call("POST", f"{TASKS}/9309181006/product-code-verifications", {"code": CODE["ONSITE"], "source": "SCAN"})
check("范围外工单产品码校验被拒绝", env.get("code") == 404, f"code={env.get('code')}")
env = call("POST", f"{TASKS}/{O['ONSITE']}/product-code-verifications", {"code": CODE["ONSITE"], "source": "TELEPATHY"})
check("非法产品码来源被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")

print("\n" + "=" * 18, "7. 现场完工提交", "=" * 18)
oid = O["ONSITE"]
env = call("POST", f"{TASKS}/{oid}/completion-submissions", {
    "clientRequestId": "W2TEST-SUB-EMPTY", "workOrderVersion": ver(oid), "draftVersion": "bogus"})
check("过期草稿版本提交被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")
dv = draft(oid)["data"]["version"]
base = body_draft(oid, dv, diagnosis="检测：进水阀异常，需更换连接件", serviceResult="更换排水连接件并试水正常",
                  usageType="PARTS", parts=[{"partId": "2", "quantity": 1}],
                  productCode=CODE["ONSITE"], currentStep="REVIEW")
base["clientRequestId"] = "W2TEST-DRAFT-PARTIAL"
call("PUT", f"{TASKS}/{oid}/draft", base)
dv = draft(oid)["data"]["version"]
env = call("POST", f"{TASKS}/{oid}/completion-submissions", {
    "clientRequestId": "W2TEST-SUB-01", "workOrderVersion": ver(oid), "draftVersion": dv})
check("缺客户确认时提交被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
dv = draft(oid)["data"]["version"]
full = body_draft(oid, dv, diagnosis="检测：进水阀异常，需更换连接件", serviceResult="更换排水连接件并试水正常",
                  usageType="PARTS", parts=[{"partId": "2", "quantity": 999}],
                  productCode=CODE["ONSITE"], currentStep="REVIEW",
                  customerConfirmation="CONFIRMED", customerConfirmationNote="客户现场确认完成",
                  siteEvidence=EV["site"], nameplateEvidence=EV["nameplate"],
                  communicationEvidence=EV["comm"], confirmationEvidence=EV["confirm"])
full["clientRequestId"] = "W2TEST-DRAFT-STOCK"
call("PUT", f"{TASKS}/{oid}/draft", full)
bal_before = one("SELECT quantity FROM afs_part_stock_balance WHERE part_id=2 AND owner_type='PERSONNEL' AND owner_id=5")[0]
env = call("POST", f"{TASKS}/{oid}/completion-submissions", {
    "clientRequestId": "W2TEST-SUB-02", "workOrderVersion": ver(oid), "draftVersion": draft(oid)["data"]["version"]})
check("个人库存不足时提交被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")
check("库存不足未产生提交版本",
      one("SELECT COUNT(*) FROM afs_completion_submission WHERE order_id=%s AND client_request_id='W2TEST-SUB-02'", (oid,))[0] == 0)
check("库存不足未扣减个人库存",
      one("SELECT quantity FROM afs_part_stock_balance WHERE part_id=2 AND owner_type='PERSONNEL' AND owner_id=5")[0] == bal_before)
check("[事务原子性] 库存不足时未残留耗用单据（提交整体回滚）",
      one("SELECT COUNT(*) FROM afs_part_inventory_document WHERE work_order_id=%s", (oid,))[0] == 0,
      "残留单据数=" + str(one("SELECT COUNT(*) FROM afs_part_inventory_document WHERE work_order_id=%s", (oid,))[0]))

dv = draft(oid)["data"]["version"]
full = body_draft(oid, dv, diagnosis="检测：进水阀异常，需更换连接件", serviceResult="更换排水连接件并试水正常",
                  usageType="PARTS", parts=[{"partId": "2", "quantity": 1}],
                  productCode=CODE["ONSITE"], currentStep="REVIEW",
                  customerConfirmation="CONFIRMED", customerConfirmationNote="客户现场确认完成",
                  siteEvidence=EV["site"], nameplateEvidence=EV["nameplate"],
                  communicationEvidence=EV["comm"], confirmationEvidence=EV["confirm"])
full["clientRequestId"] = "W2TEST-DRAFT-FULL"
env = call("PUT", f"{TASKS}/{oid}/draft", full)
check("完工前最终草稿保存成功", ok(env), res(env, 200) if not ok(env) else "")
dv = env["data"]["version"]
sub_body = {"clientRequestId": "W2TEST-SUB-OK", "workOrderVersion": ver(oid), "draftVersion": dv}
env = call("POST", f"{TASKS}/{oid}/completion-submissions", sub_body)
check("现场完工提交成功", ok(env), res(env, 300) if not ok(env) else "")
check("进度显示进入审核中", ok(env) and env["data"]["category"] == "REVIEW" and env["data"]["awaitingReview"] is True,
      res(env, 200) if ok(env) else str(env))
sub = one("SELECT id,version_no,service_result,product_code,process_record,rfid_code,customer_confirmation,"
          "customer_confirmation_note,site_evidence,nameplate_evidence,communication_evidence,"
          "confirmation_evidence,draft_revision,submitter_id,client_request_id,request_hash,"
          "inventory_document_id FROM afs_completion_submission WHERE order_id=%s", (oid,))
check("提交版本落库（v1 且业务字段与草稿一致）",
      bool(sub) and sub[1] == 1 and sub[2] == "更换排水连接件并试水正常" and sub[3] == CODE["ONSITE"]
      and sub[4].startswith("检测") and sub[5] == "" and sub[6] == "CONFIRMED",
      f"versionNo={sub[1]} result={sub[2][:12]} code={sub[3]} conf={sub[6]}" if sub else "无提交记录")
check("提交版本保存四类证据", bool(sub) and all(sub[i] for i in (8, 9, 10, 11)),
      f"site={sub[8][:24]}…" if sub else "无提交记录")
check("提交版本记录草稿修订号", bool(sub) and isinstance(sub[12], int) and sub[12] >= 1,
      f"draft_revision={sub[12]}" if sub else "无提交记录")
print(f"    └ 观察：submitter_id={sub[13] if sub else '-'}（移动端写入移动账号 id；Web 端写入 Gaia 用户 id）")
check("提交版本保存请求号与摘要", bool(sub) and sub[14] == "W2TEST-SUB-OK" and len(sub[15]) == 64,
      str(sub[14]) if sub else "无提交记录")
check("提交版本关联库存单据", bool(sub) and sub[16] is not None,
      f"inventory_document_id={sub[16]}" if sub else "无提交记录")
st = one("SELECT status,revision FROM afs_service_order WHERE id=%s", (oid,))
check("工单状态转为待审核", st[0] == "PENDING_REVIEW", st[0])
check("状态历史记录提交动作",
      one("SELECT COUNT(*) FROM afs_order_status_history WHERE order_id=%s AND reason_code='SUBMIT_COMPLETION'", (oid,))[0] == 1)
check("草稿标记为已提交", one("SELECT submitted FROM afs_service_task_draft WHERE order_id=%s", (oid,))[0] == 1)
_ex = one("SELECT service_active,ended_at FROM afs_service_execution WHERE order_id=%s", (oid,))
check("当前服务已失活结束", _ex[0] == 0 and _ex[1] is not None, str(_ex))
_bal = one("SELECT quantity FROM afs_part_stock_balance WHERE part_id=2 AND owner_type='PERSONNEL' AND owner_id=5")[0]
check("配件库存已扣减", _bal == bal_before - 1, f"{bal_before} -> {_bal}")
led = one("SELECT id,document_type,status,source_type,source_id,target_type,work_order_id "
          "FROM afs_part_inventory_document WHERE work_order_id=%s", (oid,))
check("耗用单据类型与来源正确", led and led[1] == "CONSUMPTION" and led[2] == "COMPLETED" and led[3] == "PERSONNEL" and led[4] == 5,
      str(led))
check("[事务原子性] 耗用单据/明细/流水/历史四表齐备且各 1 条",
      bool(led) and one("SELECT COUNT(*) FROM afs_part_inventory_document WHERE work_order_id=%s", (oid,))[0] == 1
      and one("SELECT COUNT(*) FROM afs_part_inventory_document_line WHERE document_id=%s", (led[0],))[0] == 1
      and one("SELECT COUNT(*) FROM afs_part_stock_ledger WHERE document_id=%s", (led[0],))[0] == 1
      and one("SELECT COUNT(*) FROM afs_part_inventory_history WHERE document_id=%s", (led[0],))[0] == 1,
      f"doc={led[0]}" if led else "无耗用单据")
check("[事务原子性] 提交版本与工单状态同事务落地",
      bool(sub) and bool(led) and sub[16] == led[0]
      and one("SELECT status FROM afs_service_order WHERE id=%s", (oid,))[0] == "PENDING_REVIEW",
      f"inventoryDocumentId={sub[16] if sub else None} docId={led[0] if led else None}")
_lg = one("SELECT quantity_delta,resulting_quantity,movement_type FROM afs_part_stock_ledger WHERE document_id=%s",
          (led[0],)) if led else None
check("耗用流水为负向并记录结果库存", _lg == (-1, bal_before - 1, "CONSUMPTION"), str(_lg))
env2 = call("POST", f"{TASKS}/{oid}/completion-submissions", sub_body)
_c = one("SELECT COUNT(*) FROM afs_completion_submission WHERE order_id=%s", (oid,))[0]
check("同请求号重复提交幂等（不产生第 2 版）", ok(env2) and _c == 1, f"code={env2.get('code')} count={_c}")
env3 = call("POST", f"{TASKS}/{oid}/completion-submissions", {**sub_body, "draftVersion": "other"})
check("同请求号不同内容提交被拒绝", env3.get("code") == 409, f"code={env3.get('code')} {env3.get('errMsg')}")
env4 = call("POST", f"{TASKS}/{oid}/completion-submissions", {
    "clientRequestId": "W2TEST-SUB-AGAIN", "workOrderVersion": ver(oid), "draftVersion": dv})
check("提交后再次提交被拒绝", env4.get("code") == 409, f"code={env4.get('code')} {env4.get('errMsg')}")

print("\n" + "=" * 18, "8. 远程完工提交", "=" * 18)
roid = O["REMOTE"]
dv = draft(roid)["data"]["version"]
body = body_draft(roid, dv, diagnosis="远程指导：滤网清洗与复位", serviceResult="远程指导完成，功能恢复正常",
                  usageType="NONE", currentStep="REVIEW",
                  customerConfirmation="CONFIRMED", customerConfirmationNote="客户远程确认完成",
                  communicationEvidence=EV["comm"])
body["clientRequestId"] = "W2TEST-DRAFT-REMOTE"
env = call("PUT", f"{TASKS}/{roid}/draft", body)
check("远程草稿保存（不强制现场证据）", ok(env), res(env, 200) if not ok(env) else "")
env = call("POST", f"{TASKS}/{roid}/completion-submissions", {
    "clientRequestId": "W2TEST-SUB-REMOTE", "workOrderVersion": ver(roid),
    "draftVersion": env["data"]["version"]})
check("远程完工提交成功", ok(env), res(env, 300) if not ok(env) else "")
rsub = one("SELECT version_no,site_evidence,nameplate_evidence,communication_evidence,inventory_document_id "
           "FROM afs_completion_submission WHERE order_id=%s", (roid,))
check("远程提交不写入现场/铭牌证据且无配件耗用",
      bool(rsub) and rsub[1] == "" and rsub[2] == "" and rsub[4] is None, str(rsub))
check("远程提交保留沟通证据", bool(rsub) and rsub[3].startswith("https://"),
      rsub[3][:40] if rsub else "无提交记录")
check("远程工单进入待审核",
      one("SELECT status FROM afs_service_order WHERE id=%s", (roid,))[0] == "PENDING_REVIEW")

print("\n" + "=" * 18, "9. 进度查询", "=" * 18)
env = call("GET", f"{TASKS}/{O['ONSITE']}/progress")
check("进行完工单进度：待审核并含最新提交",
      ok(env) and env["data"]["awaitingReview"] is True and env["data"]["latestSubmission"]["versionNo"] == 1,
      res(env, 200) if ok(env) else str(env))
env = call("GET", f"{TASKS}/{O['SUPP']}/progress")
check("退回工单进度：needsSupplement 为真",
      ok(env) and env["data"]["needsSupplement"] is True and env["data"]["latestReview"]["decision"] == "REJECT",
      res(env, 200) if ok(env) else str(env))
env = call("GET", f"{TASKS}/9309191007/progress")
check("待回访工单进度：awaitingFollowUp 为真",
      ok(env) and env["data"]["awaitingFollowUp"] is True, res(env, 200) if ok(env) else str(env))
env = call("GET", f"{TASKS}/9309191008/progress")
check("已关闭工单进度：既不待审核也不待补充",
      ok(env) and env["data"]["awaitingReview"] is False and env["data"]["needsSupplement"] is False,
      res(env, 200) if ok(env) else str(env))
check("范围外工单进度被拒绝", call("GET", f"{TASKS}/9309181006/progress").get("code") == 404)

print("\n" + "=" * 18, "10. 审核退回定向补充", "=" * 18)
sid = O["SUPP"]
env = call("GET", f"{TASKS}/{sid}/supplements")
check("退回要求可读", ok(env), res(env, 200) if not ok(env) else "")
if ok(env):
    check("退回项为 4 项定向内容",
          env["data"]["requiredItems"] == ["SITE_EVIDENCE", "NAMEPLATE_EVIDENCE", "CUSTOMER_CONFIRMATION",
                                           "CONFIRMATION_EVIDENCE"],
          str(env["data"]["requiredItems"]))
    check("退回基线为第 1 版", env["data"]["baseSubmission"]["versionNo"] == 1,
          str(env["data"]["baseSubmission"]["versionNo"]))
    check("退回原因可读", bool(env["data"]["reason"]), env["data"]["reason"])
env = call("GET", f"{TASKS}/{O['ONSITE']}/supplements")
check("非退回工单查询退回要求被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")
base_ver = env["data"]["baseSubmission"]["versionNo"] if False else 1
env = call("POST", f"{TASKS}/{sid}/supplements", {
    "clientRequestId": "W2TEST-SUP-STALE", "workOrderVersion": ver(sid), "baseSubmissionVersion": 9,
    "serviceResult": "x", "siteEvidence": EV["site"], "nameplateEvidence": EV["nameplate"],
    "customerConfirmation": "CONFIRMED", "customerConfirmationNote": "客户确认",
    "confirmationEvidence": EV["confirm"], "note": "补充"})
check("退回基线版本不一致被拒绝", env.get("code") == 409, f"code={env.get('code')} {env.get('errMsg')}")
env = call("POST", f"{TASKS}/{sid}/supplements", {
    "clientRequestId": "W2TEST-SUP-PARTIAL", "workOrderVersion": ver(sid), "baseSubmissionVersion": 1,
    "serviceResult": "补充后的服务结果", "siteEvidence": EV["site"], "nameplateEvidence": EV["nameplate"],
    "customerConfirmation": "CONFIRMED", "customerConfirmationNote": "客户确认",
    "confirmationEvidence": [], "note": "只补了部分项"})
check("指定项缺失时补充被拒绝", env.get("code") == 422, f"code={env.get('code')} {env.get('errMsg')}")
sup_body = {"clientRequestId": "W2TEST-SUP-OK", "workOrderVersion": ver(sid), "baseSubmissionVersion": 1,
            "serviceResult": "补充后的服务结果：已更换连接件", "productCode": CODE["SUPP"], "rfidCode": "",
            "siteEvidence": EV["site"], "nameplateEvidence": EV["nameplate"],
            "communicationEvidence": [], "customerConfirmation": "CONFIRMED",
            "customerConfirmationNote": "客户现场确认完成", "confirmationEvidence": EV["confirm"],
            "note": "按审核指定项补充现场与铭牌照片并重新确认"}
env = call("POST", f"{TASKS}/{sid}/supplements", sup_body)
check("定向补充提交成功", ok(env), res(env, 300) if not ok(env) else "")
rows = query("SELECT version_no,service_result,parent_submission_id,supplemented_items,supplement_note,"
             "client_request_id,site_evidence,customer_confirmation FROM afs_completion_submission "
             "WHERE order_id=%s ORDER BY version_no", (sid,))[1]
check("保留不可变历史：现有 2 个提交版本", len(rows) == 2, f"versions={[r[0] for r in rows]}")
if len(rows) == 2:
    check("第 2 版父版本指向第 1 版", rows[1][2] == 9509194001, str(rows[1][2]))
    check("第 2 版记录补充项与说明", set((rows[1][3] or "").split(",")) == set(
        ["SITE_EVIDENCE", "NAMEPLATE_EVIDENCE", "CUSTOMER_CONFIRMATION", "CONFIRMATION_EVIDENCE"]), rows[1][3])
    check("第 2 版保存现场证据", (rows[1][6] or "").startswith("https://"), (rows[1][6] or "")[:40])
    check("第 1 版未被覆盖（不可变）",
          rows[0][1] == "第 1 版服务结果，等待补充资料" and rows[0][6] == "", f"v1={rows[0][1]}")
check("补充后工单回到待审核",
      one("SELECT status FROM afs_service_order WHERE id=%s", (sid,))[0] == "PENDING_REVIEW")
check("状态历史记录补充提交",
      one("SELECT COUNT(*) FROM afs_order_status_history WHERE order_id=%s AND reason_code='RESUBMIT_COMPLETION'", (sid,))[0] == 1)
check("补充后不再是待补资料分类",
      call("GET", f"{TASKS}/{sid}")["data"]["category"] == "REVIEW")
env2 = call("POST", f"{TASKS}/{sid}/supplements", sup_body)
_c2 = one("SELECT COUNT(*) FROM afs_completion_submission WHERE order_id=%s", (sid,))[0]
check("同请求号重复补充幂等（不产生第 3 版）", ok(env2) and _c2 == 2, f"code={env2.get('code')} count={_c2}")

print("\n" + "=" * 18, "11. 范围与鉴权", "=" * 18)
for path, method, payload in (("/check-ins", "POST", {"clientRequestId": "X", "workOrderVersion": "v",
                                                      "locationAuthorized": False, "locationException": "到达"}),
                              ("/draft", "GET", None),
                              ("/progress", "GET", None),
                              ("/supplements", "GET", None)):
    env = call(method, f"{TASKS}/9309181006{path}", payload) if payload else call(method, f"{TASKS}/9309181006{path}")
    check(f"范围外工单 {method} {path} 被拒绝", env.get("code") == 404, f"code={env.get('code')}")
for path, method, payload in (("/check-ins", "POST", {"clientRequestId": "X", "workOrderVersion": "v",
                                                      "locationAuthorized": False, "locationException": "到达"}),
                              ("/draft", "GET", None),
                              ("/progress", "GET", None)):
    env = call(method, f"{TASKS}/{O['EDIT']}{path}", payload, token="forged-token") if payload \
        else call(method, f"{TASKS}/{O['EDIT']}{path}", token="forged-token")
    check(f"失效会话 {path} 被拒绝", env.get("code") == 4001, f"code={env.get('code')}")

print("\n" + "=" * 18, "汇总", "=" * 18)
failed = [r for r in R if not r[1]]
print(f"共 {len(R)} 项，通过 {len(R) - len(failed)}，失败 {len(failed)}")
for n, _, dt in failed:
    print(f"  FAIL {n} — {dt}")
