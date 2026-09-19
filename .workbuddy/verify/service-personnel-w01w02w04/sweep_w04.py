#!/usr/bin/env python3
"""W04 收尾核查：对现场／远程闭环工单做跨表一致性对账。"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import show

ONSITE, REMOTE, SUPP = "9509191007", "9509191008", "9509191011"

print("=" * 20, "现场闭环 9509191007", "=" * 20)
show(f"SELECT id,order_no,status,service_mode,personnel_id,station_id,revision,"
     f"status_changed_at FROM afs_service_order WHERE id={ONSITE}")
show(f"SELECT personnel_id,station_id,service_active,start_mode,current_step,started_at,ended_at,"
     f"longitude,latitude,location_authorized FROM afs_service_execution WHERE order_id={ONSITE}")
show(f"SELECT order_id,current_step,revision,submitted,usage_type,product_code,customer_confirmation "
     f"FROM afs_service_task_draft WHERE order_id={ONSITE}")
show(f"SELECT id,version_no,service_result,product_code,customer_confirmation,inventory_document_id,"
     f"draft_revision FROM afs_completion_submission WHERE order_id={ONSITE}")
show(f"SELECT s.part_id,s.owner_type,s.owner_id,s.movement_type,s.quantity_delta,s.resulting_quantity "
     f"FROM afs_part_stock_ledger s JOIN afs_part_inventory_document d ON d.id=s.document_id "
     f"WHERE d.work_order_id={ONSITE}")
show(f"SELECT action_code,request_id,actor_id FROM afs_mobile_task_action_audit "
     f"WHERE order_id={ONSITE} ORDER BY id")
show(f"SELECT from_status,to_status,reason_code FROM afs_order_status_history "
     f"WHERE order_id={ONSITE} ORDER BY id")

print("=" * 20, "远程闭环 9509191008", "=" * 20)
show(f"SELECT id,order_no,status,service_mode FROM afs_service_order WHERE id={REMOTE}")
show(f"SELECT start_mode,service_active,longitude,latitude,location_authorized,ended_at "
     f"FROM afs_service_execution WHERE order_id={REMOTE}")
show(f"SELECT version_no,site_evidence,nameplate_evidence,inventory_document_id "
     f"FROM afs_completion_submission WHERE order_id={REMOTE}")

print("=" * 20, "退回补充 9509191011", "=" * 20)
show(f"SELECT id,order_no,status FROM afs_service_order WHERE id={SUPP}")
show(f"SELECT version_no,parent_submission_id,supplemented_items,supplement_note,"
     f"LEFT(site_evidence,40) AS site_ev FROM afs_completion_submission WHERE order_id={SUPP} ORDER BY version_no")
show("SELECT part_id,owner_type,owner_id,quantity FROM afs_part_stock_balance "
     "WHERE owner_type='PERSONNEL' AND owner_id=5 AND part_id=2")

print("=" * 20, "跨轮次残留检查（应为 0）", "=" * 20)
show("""SELECT
  (SELECT COUNT(*) FROM afs_part_inventory_document WHERE work_order_id BETWEEN '9509191000' AND '9509191999'
     AND status <> 'COMPLETED') AS 非完成单据,
  (SELECT COUNT(*) FROM afs_service_execution WHERE order_id BETWEEN 9509191000 AND 9509191999
     AND service_active = 1) AS 仍活动执行,
  (SELECT COUNT(*) FROM afs_service_execution WHERE order_id BETWEEN 9509191000 AND 9509191999
     AND service_active = 1 AND ended_at IS NOT NULL) AS 活动却已结束,
  (SELECT COUNT(*) FROM afs_completion_submission WHERE order_id BETWEEN 9509191000 AND 9509191999
     AND request_hash IS NULL) AS 缺请求摘要""")
