-- 仅撤销本次确认原先不存在的 6 项读取 API；保留后续追加的其他 API。
-- 如追加项在实际执行前已经存在，不得撤销该项。先复核真实执行备份。
-- 不删除投诉表、不修改角色/操作授权。
START TRANSACTION;
SELECT id,code,api_list FROM sys_module WHERE code IN ('afsReport','afsComplaint') FOR UPDATE;
UPDATE sys_module SET api_list=NULLIF(TRIM(BOTH ',' FROM REPLACE(CONCAT(',',COALESCE(api_list,''),','),',GET$/api/afterSales/reports/permissions,',',')),''),update_user=-1,update_time=CURRENT_TIMESTAMP WHERE id=2026090800000059 AND code='afsReport' AND path='afterSales/dataCenter/report' AND FIND_IN_SET('GET$/api/afterSales/reports/permissions',api_list)>0;
UPDATE sys_module SET api_list=NULLIF(TRIM(BOTH ',' FROM REPLACE(CONCAT(',',COALESCE(api_list,''),','),',GET$/api/afterSales/reports/work-orders,',',')),''),update_user=-1,update_time=CURRENT_TIMESTAMP WHERE id=2026090800000059 AND code='afsReport' AND path='afterSales/dataCenter/report' AND FIND_IN_SET('GET$/api/afterSales/reports/work-orders',api_list)>0;
UPDATE sys_module SET api_list=NULLIF(TRIM(BOTH ',' FROM REPLACE(CONCAT(',',COALESCE(api_list,''),','),',GET$/api/afterSales/complaints,',',')),''),update_user=-1,update_time=CURRENT_TIMESTAMP WHERE id=2026090800000022 AND code='afsComplaint' AND path='afterSales/customerService/complaint' AND FIND_IN_SET('GET$/api/afterSales/complaints',api_list)>0;
UPDATE sys_module SET api_list=NULLIF(TRIM(BOTH ',' FROM REPLACE(CONCAT(',',COALESCE(api_list,''),','),',GET$/api/afterSales/complaints/permissions,',',')),''),update_user=-1,update_time=CURRENT_TIMESTAMP WHERE id=2026090800000022 AND code='afsComplaint' AND path='afterSales/customerService/complaint' AND FIND_IN_SET('GET$/api/afterSales/complaints/permissions',api_list)>0;
UPDATE sys_module SET api_list=NULLIF(TRIM(BOTH ',' FROM REPLACE(CONCAT(',',COALESCE(api_list,''),','),',GET$/api/afterSales/complaints/*,',',')),''),update_user=-1,update_time=CURRENT_TIMESTAMP WHERE id=2026090800000022 AND code='afsComplaint' AND path='afterSales/customerService/complaint' AND FIND_IN_SET('GET$/api/afterSales/complaints/*',api_list)>0;
UPDATE sys_module SET api_list=NULLIF(TRIM(BOTH ',' FROM REPLACE(CONCAT(',',COALESCE(api_list,''),','),',GET$/api/afterSales/complaints/*/history,',',')),''),update_user=-1,update_time=CURRENT_TIMESTAMP WHERE id=2026090800000022 AND code='afsComplaint' AND path='afterSales/customerService/complaint' AND FIND_IN_SET('GET$/api/afterSales/complaints/*/history',api_list)>0;
SELECT id,code,api_list FROM sys_module WHERE code IN ('afsReport','afsComplaint') ORDER BY code;
COMMIT;
