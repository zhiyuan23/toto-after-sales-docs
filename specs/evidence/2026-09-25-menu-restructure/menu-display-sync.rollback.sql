-- Exact pre-change snapshot for gaia_wh_init_wzy; IDs and authorization preserved.
START TRANSACTION;
UPDATE sys_module SET name='回访管理',is_hide=1 WHERE id='2026090800000020' AND code='afsFollowUp' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='服务结算',is_hide=0 WHERE id='2026090800000023' AND code='afsSettlement' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='顾客购买记录',is_hide=1 WHERE id='2026090800000027' AND code='afsDealerCustomer' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='安装码管理',is_hide=0 WHERE id='2026090800000051' AND code='afsInstallationCode' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='会员档案',is_hide=0 WHERE id='2026090800000054' AND code='afsMember' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='消息推送',is_hide=0 WHERE id='2026090800000056' AND code='afsMemberPush' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='服务评价',is_hide=0 WHERE id='2026090800000057' AND code='afsServiceSurvey' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='产品问卷',is_hide=0 WHERE id='2026090800000058' AND code='afsProductSurvey' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='数据任务',is_hide=0 WHERE id='2026090800000060' AND code='afsDataJob' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='任务中心',is_hide=0 WHERE id='2026090800000065' AND code='afsDownloadTask' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='模板管理',is_hide=0 WHERE id='2026090800000066' AND code='afsDownloadTemplate' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='场景配置',is_hide=0 WHERE id='2026090800000067' AND code='afsDownloadScene' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='',is_hide=0 WHERE id='2026091800000901' AND code='afsPersonnelAssignmentPolicy' AND DATABASE()='gaia_wh_init_wzy';
COMMIT;
