-- 仅在售后关键字提取新版部署完成后执行。先核对目标测试库与备份原配置。
-- 不修改历史日志，不影响其他模块；平台keyword留空以保留售后已生成的业务标识。
SELECT DATABASE();
START TRANSACTION;
UPDATE sys_open_api_log_config c
JOIN sys_open_api a ON a.id=c.api_id
SET c.keyword=''
WHERE a.id BETWEEN 2026101900100 AND 2026101900122
  AND a.path LIKE '/openapi/v1.0/afterSales/%';
COMMIT;
SELECT a.path,c.keyword FROM sys_open_api_log_config c
JOIN sys_open_api a ON a.id=c.api_id
WHERE a.id BETWEEN 2026101900100 AND 2026101900122
  AND a.path LIKE '/openapi/v1.0/afterSales/%';
-- 回退：先恢复旧售后制品，再将以上限定范围keyword恢复为code,uniqueCode,subjectCode。
