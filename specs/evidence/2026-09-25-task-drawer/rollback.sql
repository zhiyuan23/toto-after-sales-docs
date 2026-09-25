-- Exact pre-change snapshot for gaia_wh_init_wzy; IDs and authorization preserved.
START TRANSACTION;
UPDATE sys_module SET name='导入导出任务',is_hide=0 WHERE id='2026090800000065' AND code='afsDownloadTask' AND DATABASE()='gaia_wh_init_wzy';
COMMIT;
