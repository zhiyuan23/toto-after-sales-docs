-- 迁移后只读检查；预期新表各 0 行，外键 2、请求号唯一约束 2、投诉状态 CHECK 1。
SELECT table_name,engine,table_collation FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name IN ('afs_complaint','afs_complaint_event');
SELECT table_name,constraint_name,constraint_type FROM information_schema.table_constraints
WHERE constraint_schema=DATABASE() AND table_name IN ('afs_complaint','afs_complaint_event')
ORDER BY table_name,constraint_type,constraint_name;
SELECT table_name,index_name,GROUP_CONCAT(column_name ORDER BY seq_in_index) AS indexed_columns
FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name IN ('afs_complaint','afs_complaint_event')
GROUP BY table_name,index_name ORDER BY table_name,index_name;
SELECT 'afs_complaint' AS table_name,COUNT(*) AS records FROM afs_complaint
UNION ALL SELECT 'afs_complaint_event',COUNT(*) FROM afs_complaint_event;
SELECT id,code,path,enable,api_list FROM sys_module WHERE code IN ('afsReport','afsComplaint') ORDER BY code;
SELECT m.code,COUNT(DISTINCT rm.role_id) AS role_count
FROM sys_module m LEFT JOIN sys_role_module rm ON rm.module_id=m.id
WHERE m.code IN ('afsReport','afsComplaint') GROUP BY m.code;
