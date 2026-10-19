-- 仅测试环境：按用户确认授予执行时已登记的全部开放接口权限；新增其他接口后可重跑补齐。
-- secret在数据库内随机生成，不把实际值写入脚本、文档或Git；重跑不会重置密钥。
SET NAMES utf8mb4;
START TRANSACTION;
INSERT INTO sys_open_api_account(id,description,app_id,secret,is_enabled,auth_flag,white_ip,white_device,create_user,create_time,type)
VALUES(2026101900900,'售后接口测试用户','afs_openapi_test_20261019',REPLACE(UUID(),'-',''),1,1,'','',-2,NOW(),0)
ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT INTO sys_open_api_auth(id,api_account_id,api_info_id,create_user,create_time)
SELECT CASE WHEN a.id<0 THEN -2026101901000+2*a.id ELSE -2026101901001-2*a.id END,2026101900900,a.id,-2,NOW() FROM sys_open_api a
WHERE NOT EXISTS(SELECT 1 FROM sys_open_api_auth x WHERE x.api_account_id=2026101900900 AND x.api_info_id=a.id);
COMMIT;
