-- 2026-09-25 已确认四视角菜单重排；仅适用于已核对的单租户测试库。
-- 保留模块 ID、注册父级、路径、启停和所有角色/操作授权；执行前备份并核对目标库。
START TRANSACTION;
UPDATE sys_module SET name='回访管理', is_hide=0 WHERE code='afsFollowUp' AND path='afterSales/customerService/followUp' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='服务结算', is_hide=1 WHERE code='afsSettlement' AND path='afterSales/customerService/settlement' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='顾客购买记录', is_hide=0 WHERE code='afsDealerCustomer' AND path='afterSales/customer/dealerCustomer' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='安装码查询', is_hide=0 WHERE code='afsInstallationCode' AND path='afterSales/antiDiversion/installationCode' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='会员档案', is_hide=1 WHERE code='afsMember' AND path='afterSales/memberOperation/member' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='消息推送', is_hide=1 WHERE code='afsMemberPush' AND path='afterSales/memberOperation/push' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='评价标签配置', is_hide=0 WHERE code='afsServiceSurvey' AND path='afterSales/memberOperation/serviceSurvey' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='产品问卷', is_hide=1 WHERE code='afsProductSurvey' AND path='afterSales/memberOperation/productSurvey' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='数据任务', is_hide=1 WHERE code='afsDataJob' AND path='afterSales/dataCenter/job' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='导入导出任务', is_hide=0 WHERE code='afsDownloadTask' AND path='afterSales/downloadCenter/task' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='导入导出模板', is_hide=0 WHERE code='afsDownloadTemplate' AND path='afterSales/downloadCenter/template' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='导入导出场景配置', is_hide=0 WHERE code='afsDownloadScene' AND path='afterSales/downloadCenter/scene' AND DATABASE()='gaia_wh_init_wzy';
UPDATE sys_module SET name='人员分配策略' WHERE code='afsPersonnelAssignmentPolicy' AND path='afterSales/serviceResource/personnelAssignmentPolicy' AND name='' AND DATABASE()='gaia_wh_init_wzy';
COMMIT;
