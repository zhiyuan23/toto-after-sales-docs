-- 仅用于 gaia_wh_init_wzy / mysql84 测试库；执行前按 code 核对唯一 ID，并备份原 name、icon。
-- 展示分组由售后前端投影，不新增 Gaia 目录、不移动稳定父级、不修改角色及操作绑定。
-- sys_user_list、operation_log 等主系统共享菜单保持原名；账号管理／系统日志由子系统本地投影与翻译展示。
UPDATE sys_module SET name='第三方服务配置',icon='lucide:plug-zap' WHERE code='afsExternalServices' AND id=2026101300007801;
UPDATE sys_module SET name='开放接口管理',icon='lucide:braces' WHERE code='afsOpenApi' AND id=2026101902002;
UPDATE sys_module SET name='开放接口日志',icon='lucide:file-code-2' WHERE code='afsOpenApiMonitor' AND id=2026101902003;
