-- 仅回退 seed.sql 创建的 DEMO-* 业务数据；执行前应确认这些记录未被其他业务引用。

DELETE FROM afs_service_station_audit
WHERE station_id IN (SELECT id FROM afs_service_station WHERE code IN ('DEMO-STN-SH-E','DEMO-STN-SH-W','DEMO-STN-SZ-WZ'));
DELETE FROM afs_service_area_station
WHERE station_id IN (SELECT id FROM afs_service_station WHERE code IN ('DEMO-STN-SH-E','DEMO-STN-SH-W','DEMO-STN-SZ-WZ'));
DELETE FROM afs_service_station WHERE code IN ('DEMO-STN-SH-E','DEMO-STN-SH-W','DEMO-STN-SZ-WZ');

DELETE FROM afs_service_area_audit
WHERE area_id IN (SELECT id FROM afs_service_area WHERE code IN ('DEMO-AREA-SH-PD','DEMO-AREA-SH-MH','DEMO-AREA-SZ-WZ'));
DELETE FROM afs_service_area WHERE code IN ('DEMO-AREA-SH-PD','DEMO-AREA-SH-MH','DEMO-AREA-SZ-WZ');

DELETE FROM afs_store_audit
WHERE store_id IN (SELECT id FROM afs_store WHERE code IN ('DEMO-STR-SH01','DEMO-STR-SH02','DEMO-STR-SZ01'));
DELETE FROM afs_store WHERE code IN ('DEMO-STR-SH01','DEMO-STR-SH02','DEMO-STR-SZ01');
DELETE FROM afs_store_type
WHERE code='PHYSICAL_STORE' AND NOT EXISTS(SELECT 1 FROM afs_store WHERE store_type_id=afs_store_type.id);

DELETE FROM afs_dealer_organization
WHERE dealer_id IN (SELECT id FROM afs_dealer WHERE code IN ('DEMO-DLR-HD01','DEMO-DLR-SH01','DEMO-DLR-SZ01'));
DELETE FROM afs_dealer_audit
WHERE dealer_id IN (SELECT id FROM afs_dealer WHERE code IN ('DEMO-DLR-HD01','DEMO-DLR-SH01','DEMO-DLR-SZ01'));
DELETE FROM afs_dealer WHERE code IN ('DEMO-DLR-SH01','DEMO-DLR-SZ01');
DELETE FROM afs_dealer WHERE code='DEMO-DLR-HD01';
