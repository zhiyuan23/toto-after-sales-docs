#!/usr/bin/env python3
"""W2/W4 dedicated write-verification fixture (gaia_wh_init_wzy, authorized).

Creates W2TEST-20260919-* orders for personnel 5 / station 5 only, plus a
personal part balance for consumption testing. Never touches existing fixtures.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import conn

PERSONNEL, STATION = 5, 5
CUST, REG = 9309180001, 9309180101
NAME_CT = "v1.HZakYp3JdE43i63scrUWWRjgyjH73jz8miiG8nsaHGV0fpGAL3oDDEpWTba4"
MOBILE_CT = "v1.PD85dCVOigvFmDEQRekdZXy9RDuOqIrTMJCzApA20WtmAwWfBf_c"
MOBILE_DIGEST = "c4a5e0aef1612288b09db1f6bcba2dbdf1ee5b5c03b5210f381bc4c523e34a1e"
ADDR_CT = ("v1.p9jFo-X3H8ImjSnhVvvn9h0WXlRNg8XE1sRLt7Wgd6KvEj5Bax8lQbM8yAgeZl97E-SvWkI3faoHdbCa81fEMx"
           "-0MV2F")

# order id, order_no suffix, order_type, service_mode, purpose
ORDERS = [
    (9509191001, "EDIT",       "INSTALLATION", "ONSITE", "W02 白名单修改与联系记录"),
    (9509191002, "APPOINT",    "REPAIR",       "ONSITE", "W02 确认预约"),
    (9509191003, "MISSING",    "REPAIR",       "ONSITE", "W02 标记缺件"),
    (9509191004, "UNREACH",    "REPAIR",       "ONSITE", "W02 标记断联"),
    (9509191005, "CANCEL",     "REPAIR",       "ONSITE", "W02 取消任务"),
    (9509191006, "RESCHED",    "REPAIR",       "ONSITE", "W02 改约并失活当前服务"),
    (9509191007, "ONSITE-FLOW", "INSTALLATION", "ONSITE", "W04 现场履约完整闭环"),
    (9509191008, "REMOTE-FLOW", "GUIDANCE",     "REMOTE", "W04 远程履约完整闭环"),
    (9509191009, "DRAFT-A",    "REPAIR",       "ONSITE", "W04 草稿隔离 A"),
    (9509191010, "DRAFT-B",    "REPAIR",       "ONSITE", "W04 草稿隔离 B"),
    (9509191011, "SUPPLEMENT", "INSTALLATION", "ONSITE", "W04 审核退回定向补充"),
]

ORDER_COLUMNS = """id,order_no,order_type,source,customer_id,registration_id,
  contact_name_ciphertext,contact_name_masked,contact_mobile_digest,contact_mobile_ciphertext,
  contact_mobile_masked,province_name,city_name,district_name,street_name,address_ciphertext,
  address_masked,expected_date,expected_date_to,expected_time_window,station_id,status,remark,
  client_request_id,revision,create_user,create_time,update_user,update_time,
  intake_channel,service_mode,problem_description,
  personnel_id,personnel_code,personnel_name,personnel_mobile,
  station_assignment_mode,station_assignment_rule,personnel_assignment_mode,personnel_assignment_status,
  dispatch_mode,dispatch_reason,status_changed_at"""


def order_row(oid, suffix, otype, mode, purpose, expected_offset=0):
    return (
        oid, f"W2TEST-20260919-{suffix}", otype, "API", CUST, REG,
        NAME_CT, "G***", MOBILE_DIGEST, MOBILE_CT, "139****9018",
        "上海市", "上海市", "浦东新区", "W2TEST测试街道", ADDR_CT, "上海市浦东新****",
        "CURRENT_DATE + INTERVAL %d DAY" % expected_offset, None, "09:00-11:00",
        STATION, "PENDING_COMPLETION", f"W2TEST-20260919 {purpose}",
        f"W2TEST-20260919-ORDER-{suffix}", 1, -1, None, -1, None,
        "API", mode, f"W2TEST-20260919 {purpose}",
        PERSONNEL, "W2TEST-SP", "孙志远", "",
        "MANUAL", "W2TEST-20260919 已派站", "MANUAL", "SUCCESS",
        "MANUAL", "W2TEST-20260919 已正式派人", None)


def sql_of(value):
    if value is None:
        return "NULL"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, str) and (value.startswith("CURRENT_DATE") or value.startswith("CURRENT_TIMESTAMP")):
        return value
    return "'" + value.replace("'", "''") + "'"


RANGE = "BETWEEN 9509191000 AND 9509191999"
# 工单号列是 varchar，字符串区间比较即可覆盖本夹具全部工单
WRANGE = "BETWEEN '9509191000' AND '9509191999'"


def build():
    stmts = []
    # 库存耗用链路（会通过 uk_..._request 唯一键产生跨轮次冲突，必须清干净）
    stmts.append(f"DELETE FROM afs_part_stock_ledger WHERE document_id IN "
                 f"(SELECT id FROM afs_part_inventory_document WHERE work_order_id {WRANGE})")
    stmts.append(f"DELETE FROM afs_part_inventory_history WHERE document_id IN "
                 f"(SELECT id FROM afs_part_inventory_document WHERE work_order_id {WRANGE})")
    stmts.append(f"DELETE FROM afs_part_inventory_document_line WHERE document_id IN "
                 f"(SELECT id FROM afs_part_inventory_document WHERE work_order_id {WRANGE})")
    stmts.append(f"DELETE FROM afs_part_inventory_document WHERE work_order_id {WRANGE}")
    # 其余可能被移动端写入的从表
    stmts.append(f"DELETE FROM afs_order_assignment_history WHERE order_id {RANGE}")
    stmts.append(f"DELETE FROM afs_service_order_material WHERE order_id {RANGE}")
    stmts.append(f"DELETE FROM afs_complaint WHERE order_id {RANGE}")
    stmts.append(f"DELETE FROM afs_auto_dispatch_job WHERE order_id {RANGE}")
    stmts.append(f"DELETE FROM afs_auto_dispatch_trace WHERE order_id {RANGE}")
    stmts.append(f"DELETE FROM afs_personnel_assignment_job WHERE order_id {RANGE}")
    stmts.append(f"DELETE FROM afs_personnel_assignment_trace WHERE order_id {RANGE}")
    stmts.append("DELETE FROM afs_purchase_verification_history WHERE registration_id = 9309180101")
    stmts.append("DELETE FROM afs_consumer_product_relation WHERE instance_id BETWEEN 9509190300 AND 9509190399")
    stmts.append("DELETE FROM afs_fault_part_relation WHERE part_id = 2")
    stmts.append("DELETE FROM afs_order_communication WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_mobile_task_action_audit WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_completion_review WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_completion_submission WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_service_task_draft_part WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_service_task_draft WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_service_execution WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_order_status_history WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_order_exception_event WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_service_order_item WHERE order_id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_service_order WHERE id BETWEEN 9509191000 AND 9509191999")
    stmts.append("DELETE FROM afs_product_instance WHERE id BETWEEN 9509190300 AND 9509190399")
    stmts.append("DELETE FROM afs_purchase_item WHERE id BETWEEN 9509190200 AND 9509190299")

    for idx, (oid, suffix, otype, mode, purpose) in enumerate(ORDERS, start=1):
        stmts.append(
            "INSERT INTO afs_purchase_item(id,registration_id,product_id,product_code,product_name,quantity,"
            "create_user,create_time) VALUES (%d,%d,4,'W2TEST-20260919-P%02d','W2TEST 测试产品 %s',1,-1,"
            "CURRENT_TIMESTAMP)" % (9509190200 + idx, REG, idx, suffix))
        stmts.append(
            "INSERT INTO afs_product_instance(id,purchase_item_id,instance_no,installation_code,status,revision,"
            "create_user,create_time,update_user,update_time) VALUES (%d,%d,'W2TEST-20260919-I%02d',"
            "'W2TEST-20260919-C%02d','APPOINTED',1,-1,CURRENT_TIMESTAMP,-1,CURRENT_TIMESTAMP)"
            % (9509190300 + idx, 9509190200 + idx, idx, idx))
        row = order_row(oid, suffix, otype, mode, purpose)
        values = []
        for i, col in enumerate(ORDER_COLUMNS.split(",")):
            col = col.strip()
            v = row[i]
            if v is None and col in ("create_time", "update_time", "status_changed_at"):
                values.append("CURRENT_TIMESTAMP")
            elif v is None and col in ("expected_date", "expected_date_to"):
                values.append("CURRENT_DATE")
            else:
                values.append(sql_of(v))
        stmts.append(f"INSERT INTO afs_service_order({ORDER_COLUMNS}) VALUES ({','.join(values)})")
        stmts.append(
            "INSERT INTO afs_service_order_item(order_id,instance_id,create_user,create_time) VALUES "
            f"({oid},{9509190300 + idx},-1,CURRENT_TIMESTAMP)")
        stmts.append(
            "INSERT INTO afs_order_status_history(id,order_id,from_status,to_status,reason_code,remark,"
            f"operator_id,source,created_at) VALUES ({9509192000 + idx},{oid},'PENDING_ASSIGNMENT',"
            f"'PENDING_COMPLETION','W2TEST','W2TEST-20260919 {purpose}',-1,'SYSTEM',CURRENT_TIMESTAMP)")

    # 退回补充：第 1 版提交 + 定向退回
    stmts.append(
        "INSERT INTO afs_completion_submission(id,order_id,version_no,service_result,product_code,"
        "photo_references,signature_reference,parts_summary,process_record,rfid_code,customer_confirmation,"
        "customer_confirmation_note,site_evidence,nameplate_evidence,communication_evidence,"
        "confirmation_evidence,draft_revision,submitter_id,submitted_at) VALUES "
        "(9509194001,9509191011,1,'第 1 版服务结果，等待补充资料','W2TEST-20260919-C11','[]','',"
        "'未使用配件','上门检测完成，等待补充现场证据','','CONFIRMED','客户现场确认完成','','','','',1,5,"
        "DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 2 HOUR))")
    stmts.append(
        "INSERT INTO afs_completion_review(id,order_id,submission_id,decision,reason,required_items,"
        "reviewer_id,reviewed_at) VALUES (9509195001,9509191011,9509194001,'REJECT',"
        "'W2TEST-20260919 请补充现场照片、铭牌照片与客户确认','SITE_EVIDENCE,NAMEPLATE_EVIDENCE,"
        "CUSTOMER_CONFIRMATION,CONFIRMATION_EVIDENCE',-1,DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 HOUR))")
    stmts.append(
        "UPDATE afs_completion_submission SET customer_confirmation='CONFIRMED',"
        "customer_confirmation_note='客户现场确认完成',site_evidence='',nameplate_evidence='',"
        "communication_evidence='',confirmation_evidence='' WHERE id=9509194001")

    # 配件耗用：为人员 5 建立个人库存
    stmts.append(
        "DELETE FROM afs_part_stock_balance WHERE owner_type='PERSONNEL' AND owner_id=%d AND part_id=2" % PERSONNEL)
    stmts.append(
        "INSERT INTO afs_part_stock_balance(part_id,owner_type,owner_id,quantity,revision,update_user,update_time)"
        " VALUES (2,'PERSONNEL',%d,5,1,-1,CURRENT_TIMESTAMP)" % PERSONNEL)
    return stmts


if __name__ == "__main__":
    only_cleanup = "--cleanup" in sys.argv
    stmts = [s for s in build() if (not only_cleanup) or (not s.startswith("INSERT"))]
    c = conn()
    try:
        with c.cursor() as cur:
            for s in stmts:
                cur.execute(s)
        c.commit()
        print(f"executed {len(stmts)} statements ({'cleanup' if only_cleanup else 'seed'})")
    finally:
        c.close()
