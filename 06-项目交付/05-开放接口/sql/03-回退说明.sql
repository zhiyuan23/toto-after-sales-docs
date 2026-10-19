-- 先停用专用测试账号和本批接口，保留调用日志、业务数据与随机密钥。
-- 不删除业务表、不清理其他账号授权。部署回退按发布备份恢复应用。
START TRANSACTION;
UPDATE sys_open_api_account SET is_enabled=0,update_time=NOW(),update_user=-2 WHERE id=2026101900900 AND app_id='afs_openapi_test_20261019';
UPDATE sys_open_api SET is_enabled=0,update_time=NOW(),update_user=-2 WHERE id BETWEEN 2026101900100 AND 2026101900122 AND path LIKE '/openapi/v1.0/afterSales/%';
COMMIT;
