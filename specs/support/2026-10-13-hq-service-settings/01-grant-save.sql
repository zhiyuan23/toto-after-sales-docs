-- 仅补齐已授总部视角和服务设置菜单的角色保存权限；先按 Spec 核对目标库并备份。
START TRANSACTION;
SET @toto_settings_old_concat=@@SESSION.group_concat_max_len;
SET SESSION group_concat_max_len=65535;
CREATE TEMPORARY TABLE toto_settings_missing AS
SELECT DISTINCT r.id role_id,o.id operation_id
FROM sys_role r
JOIN sys_role_module view_role ON view_role.role_id=r.id
JOIN sys_module view_module ON view_module.id=view_role.module_id AND view_module.enable=1 AND view_module.code='afsWorkspaceHeadquarters'
JOIN sys_role_module menu_role ON menu_role.role_id=r.id
JOIN sys_module menu ON menu.id=menu_role.module_id AND menu.enable=1 AND menu.code='afsConsumerSupportConfig'
JOIN sys_module_operation o ON o.module_id=menu.id AND o.enable=1
WHERE o.code IN ('saveConsumerSupport','saveStationPolicy','savePersonnelPolicy','saveCompletionAudit','saveFeePolicy','slaManage')
AND NOT EXISTS(SELECT 1 FROM sys_role_operation ro WHERE ro.role_id=r.id AND ro.operation_id=o.id);
INSERT INTO sys_role_operation(id,role_id,operation_id,create_user,create_time,update_user,update_time)
SELECT (SELECT COALESCE(MAX(id),0) FROM sys_role_operation)+ROW_NUMBER() OVER(ORDER BY role_id,operation_id),role_id,operation_id,-2,NOW(),-2,NOW()
FROM toto_settings_missing;
UPDATE sys_role r JOIN (SELECT DISTINCT role_id FROM toto_settings_missing) changed ON changed.role_id=r.id
SET r.module_operation_ids=CONCAT_WS(',',
 (SELECT GROUP_CONCAT(DISTINCT CONCAT(rm.module_id,'_M') ORDER BY rm.module_id SEPARATOR ',') FROM sys_role_module rm WHERE rm.role_id=r.id),
 (SELECT GROUP_CONCAT(DISTINCT CONCAT(ro.operation_id,'_B') ORDER BY ro.operation_id SEPARATOR ',') FROM sys_role_operation ro WHERE ro.role_id=r.id)),
 r.update_user=-2,r.update_time=NOW();
DROP TEMPORARY TABLE toto_settings_missing;
SET SESSION group_concat_max_len=@toto_settings_old_concat;
-- 执行器在 COMMIT 前回读差异、缓存及业务配置摘要；独立执行时也须先核验。
COMMIT;
