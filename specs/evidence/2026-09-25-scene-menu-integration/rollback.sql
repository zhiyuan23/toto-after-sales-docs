-- Verified test database gaia_wh_init_wzy only.
START TRANSACTION;
UPDATE sys_module SET is_hide=0 WHERE id=2026090800000067 AND code='afsDownloadScene' AND DATABASE()='gaia_wh_init_wzy';
INSERT INTO sys_role_module (id,role_id,module_id,create_time,create_user,update_user,update_time) VALUES (2026092200100124,72,2026090800000067,'2026-09-21T22:23:43',-2,-2,'2026-09-21T22:23:43');
INSERT INTO sys_role_module (id,role_id,module_id,create_time,create_user,update_user,update_time) VALUES (2026092200100155,73,2026090800000067,'2026-09-21T22:23:54',-2,-2,'2026-09-21T22:23:54');
INSERT INTO sys_role_module (id,role_id,module_id,create_time,create_user,update_user,update_time) VALUES (2026092200100184,74,2026090800000067,'2026-09-21T22:24',-2,-2,'2026-09-21T22:24');
INSERT INTO sys_role_module (id,role_id,module_id,create_time,create_user,update_user,update_time) VALUES (2026092200100219,75,2026090800000067,'2026-09-21T22:24:07',-2,-2,'2026-09-21T22:24:07');
INSERT INTO sys_role_module (id,role_id,module_id,create_time,create_user,update_user,update_time) VALUES (2026092200100231,76,2026090800000067,'2026-09-21T22:24:14',-2,-2,'2026-09-21T22:24:14');
INSERT INTO sys_role_module (id,role_id,module_id,create_time,create_user,update_user,update_time) VALUES (2026092200100243,77,2026090800000067,'2026-09-21T22:24:17',-2,-2,'2026-09-21T22:24:17');
INSERT INTO sys_role_operation (id,role_id,operation_id,create_time,create_user,update_user,update_time) VALUES (2026092200300206,72,31661937640854,'2026-09-21T22:23:52',-2,-2,'2026-09-21T22:23:52');
INSERT INTO sys_role_operation (id,role_id,operation_id,create_time,create_user,update_user,update_time) VALUES (2026092200300235,73,31661937640854,'2026-09-21T22:23:58',-2,-2,'2026-09-21T22:23:58');
INSERT INTO sys_role_operation (id,role_id,operation_id,create_time,create_user,update_user,update_time) VALUES (2026092200300261,74,31661937640854,'2026-09-21T22:24:04',-2,-2,'2026-09-21T22:24:04');
INSERT INTO sys_role_operation (id,role_id,operation_id,create_time,create_user,update_user,update_time) VALUES (2026092200300310,75,31661937640854,'2026-09-21T22:24:12',-2,-2,'2026-09-21T22:24:12');
INSERT INTO sys_role_operation (id,role_id,operation_id,create_time,create_user,update_user,update_time) VALUES (2026092200300321,76,31661937640854,'2026-09-21T22:24:15',-2,-2,'2026-09-21T22:24:15');
INSERT INTO sys_role_operation (id,role_id,operation_id,create_time,create_user,update_user,update_time) VALUES (2026092200300332,77,31661937640854,'2026-09-21T22:24:18',-2,-2,'2026-09-21T22:24:18');
COMMIT;
