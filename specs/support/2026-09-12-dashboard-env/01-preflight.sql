-- 只读预检；执行迁移前重新运行并核对 README 的停止条件。
SELECT DATABASE() AS target_database, VERSION() AS mysql_version,
       @@default_storage_engine AS default_storage_engine;
SELECT table_name,engine,table_collation
FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name IN
('afs_service_order','afs_purchase_registration','afs_service_station','afs_store','afs_dealer','afs_dealer_organization','sys_user_data_permission','afs_complaint','afs_complaint_event')
ORDER BY table_name;
SELECT table_name,column_name,column_type,is_nullable
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name IN ('afs_service_order','afs_purchase_registration','afs_service_station')
  AND column_name IN ('id','registration_id','station_id','create_time','status','store_id','name')
ORDER BY table_name,ordinal_position;
SELECT id,code,path,enable,is_hide,api_list,update_user,update_time
FROM sys_module WHERE code IN ('afsReport','afsComplaint') ORDER BY code;
SELECT m.code AS module_code,r.id AS role_id,r.code AS role_code,r.name AS role_name
FROM sys_module m JOIN sys_role_module rm ON rm.module_id=m.id JOIN sys_role r ON r.id=rm.role_id
WHERE m.code IN ('afsReport','afsComplaint') ORDER BY m.code,r.id;
SELECT m.code AS module_code,o.id,o.code,o.name,o.action,o.enable,o.api_list
FROM sys_module m LEFT JOIN sys_module_operation o ON o.module_id=m.id
WHERE m.code IN ('afsReport','afsComplaint') ORDER BY m.code,o.id;
