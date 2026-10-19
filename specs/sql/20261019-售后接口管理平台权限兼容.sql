-- 先核对并备份原api_list；仅补原有功能对应的精确API，不改菜单或角色关系。
UPDATE sys_module SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'GET$/api/sysOpenApi/list') WHERE code='sys_open_api_list' AND LOCATE('GET$/api/sysOpenApi/list',COALESCE(api_list,''))=0;
UPDATE sys_module SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'GET$/api/sysOpenApi/detail') WHERE code='sys_open_api_list' AND LOCATE('GET$/api/sysOpenApi/detail',COALESCE(api_list,''))=0;
UPDATE sys_module SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'GET$/api/sysOpenApiInvokeLog/list') WHERE code='sys_open_api_invoke_log_list' AND LOCATE('GET$/api/sysOpenApiInvokeLog/list',COALESCE(api_list,''))=0;
UPDATE sys_module_operation SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'PUT$/api/sysOpenApi/edit') WHERE module_id=30107 AND code='edit' AND LOCATE('PUT$/api/sysOpenApi/edit',COALESCE(api_list,''))=0;
UPDATE sys_module_operation SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'GET$/api/sysOpenApi/enable') WHERE module_id=30107 AND code IN ('enable','disable') AND LOCATE('GET$/api/sysOpenApi/enable',COALESCE(api_list,''))=0;
UPDATE sys_module_operation SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'GET$/api/sysOpenApiLogConfig/detail') WHERE module_id=30107 AND code='config' AND LOCATE('GET$/api/sysOpenApiLogConfig/detail',COALESCE(api_list,''))=0;
UPDATE sys_module_operation SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'PUT$/api/sysOpenApiLogConfig/edit') WHERE module_id=30107 AND code='config' AND LOCATE('PUT$/api/sysOpenApiLogConfig/edit',COALESCE(api_list,''))=0;
UPDATE sys_module_operation SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'GET$/api/sysOpenApiInvokeLog/detail') WHERE module_id=30116 AND code IN ('input','output') AND LOCATE('GET$/api/sysOpenApiInvokeLog/detail',COALESCE(api_list,''))=0;
UPDATE sys_module_operation SET api_list=CONCAT_WS(',',NULLIF(api_list,''),'GET$/api/sysOpenApi/list') WHERE module_id=30117 AND code='auth' AND LOCATE('GET$/api/sysOpenApi/list',COALESCE(api_list,''))=0;
UPDATE sys_module SET api_list=REPLACE(api_list,',GET$/api/sysModuleOperation/getCurrentUserOperationList','') WHERE code IN ('afsOpenApi','afsOpenApiMonitor');
