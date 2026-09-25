-- Applies only to the reviewed test database and exact binding IDs.
START TRANSACTION;
UPDATE sys_module SET is_hide=1 WHERE id=2026090800000067 AND code='afsDownloadScene' AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_module WHERE id=2026092200100124 AND role_id=72 AND module_id=2026090800000067 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_module WHERE id=2026092200100155 AND role_id=73 AND module_id=2026090800000067 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_module WHERE id=2026092200100184 AND role_id=74 AND module_id=2026090800000067 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_module WHERE id=2026092200100219 AND role_id=75 AND module_id=2026090800000067 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_module WHERE id=2026092200100231 AND role_id=76 AND module_id=2026090800000067 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_module WHERE id=2026092200100243 AND role_id=77 AND module_id=2026090800000067 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_operation WHERE id=2026092200300206 AND role_id=72 AND operation_id=31661937640854 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_operation WHERE id=2026092200300235 AND role_id=73 AND operation_id=31661937640854 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_operation WHERE id=2026092200300261 AND role_id=74 AND operation_id=31661937640854 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_operation WHERE id=2026092200300310 AND role_id=75 AND operation_id=31661937640854 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_operation WHERE id=2026092200300321 AND role_id=76 AND operation_id=31661937640854 AND DATABASE()='gaia_wh_init_wzy';
DELETE FROM sys_role_operation WHERE id=2026092200300332 AND role_id=77 AND operation_id=31661937640854 AND DATABASE()='gaia_wh_init_wzy';
COMMIT;
