-- Confirmed test database only; preserves all module and operation grants.
START TRANSACTION;
UPDATE sys_module SET is_hide=1 WHERE id='2026090800000065' AND code='afsDownloadTask' AND path='afterSales/downloadCenter/task' AND DATABASE()='gaia_wh_init_wzy';
COMMIT;
