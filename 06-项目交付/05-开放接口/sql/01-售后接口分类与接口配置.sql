-- 关键字由售后入口按资源提取；平台keyword必须留空，避免覆盖或产生空逗号。
-- 售后开放接口配置；目标 gaia_wh_init_wzy；执行前核对 DATABASE()/@@hostname 并备份本文件涉及行。
-- 不修改业务表、公共模块或其他账号。外部 /api 前缀由部署上下文提供，表内登记 servlet path。
SET NAMES utf8mb4;
START TRANSACTION;
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900001,-2,'售后服务','-1,-2',100,'售后基础数据v1.0',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900010,2026101900001,'商品分类','-1,-2,2026101900001',1,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900011,2026101900001,'商品系列','-1,-2,2026101900001',2,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900012,2026101900001,'配件档案','-1,-2,2026101900001',3,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900013,2026101900001,'商品档案','-1,-2,2026101900001',4,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900014,2026101900001,'代理商管理','-1,-2,2026101900001',5,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900015,2026101900001,'门店管理','-1,-2,2026101900001',6,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900016,2026101900001,'销售区域','-1,-2,2026101900001',7,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900017,2026101900001,'实物档案','-1,-2,2026101900001',8,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api_category(id,parent_id,name,id_path,ordinal,remark,create_user,create_time,category_type) VALUES(2026101900018,2026101900001,'图片','-1,-2,2026101900001',9,'售后开放接口',-2,NOW(),'Local') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900100,'商品分类推送','/openapi/v1.0/afterSales/category/save',1,1,0,2026101900010,'-1,-2,2026101900001,2026101900010',-2,NOW(),'POST','push','Local','JSON','JSON','json','{"items":[{"code":"OPENAPI_DEMO_001","name":"示例"}]}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900100,2026101900100,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900101,'商品分类查询','/openapi/v1.0/afterSales/category/pageList',1,1,0,2026101900010,'-1,-2,2026101900001,2026101900010',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900101,2026101900101,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900102,'商品分类启停','/openapi/v1.0/afterSales/category/status',1,1,0,2026101900010,'-1,-2,2026101900001,2026101900010',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900102,2026101900102,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900103,'商品系列推送','/openapi/v1.0/afterSales/series/save',1,1,0,2026101900011,'-1,-2,2026101900001,2026101900011',-2,NOW(),'POST','push','Local','JSON','JSON','json','{"items":[{"code":"OPENAPI_DEMO_001","name":"示例"}]}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900103,2026101900103,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900104,'商品系列查询','/openapi/v1.0/afterSales/series/pageList',1,1,0,2026101900011,'-1,-2,2026101900001,2026101900011',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900104,2026101900104,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900105,'商品系列启停','/openapi/v1.0/afterSales/series/status',1,1,0,2026101900011,'-1,-2,2026101900001,2026101900011',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900105,2026101900105,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900106,'配件档案推送','/openapi/v1.0/afterSales/part/save',1,1,0,2026101900012,'-1,-2,2026101900001,2026101900012',-2,NOW(),'POST','push','Local','JSON','JSON','json','{"items":[{"code":"OPENAPI_DEMO_001","name":"示例"}]}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900106,2026101900106,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900107,'配件档案查询','/openapi/v1.0/afterSales/part/pageList',1,1,0,2026101900012,'-1,-2,2026101900001,2026101900012',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900107,2026101900107,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900108,'配件档案启停','/openapi/v1.0/afterSales/part/status',1,1,0,2026101900012,'-1,-2,2026101900001,2026101900012',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900108,2026101900108,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900109,'商品档案推送','/openapi/v1.0/afterSales/product/save',1,1,0,2026101900013,'-1,-2,2026101900001,2026101900013',-2,NOW(),'POST','push','Local','JSON','JSON','json','{"items":[{"code":"OPENAPI_DEMO_001","name":"示例"}]}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900109,2026101900109,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900110,'商品档案查询','/openapi/v1.0/afterSales/product/pageList',1,1,0,2026101900013,'-1,-2,2026101900001,2026101900013',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900110,2026101900110,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900111,'商品档案启停','/openapi/v1.0/afterSales/product/status',1,1,0,2026101900013,'-1,-2,2026101900001,2026101900013',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900111,2026101900111,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900112,'代理商管理推送','/openapi/v1.0/afterSales/dealer/save',1,1,0,2026101900014,'-1,-2,2026101900001,2026101900014',-2,NOW(),'POST','push','Local','JSON','JSON','json','{"items":[{"code":"OPENAPI_DEMO_001","name":"示例"}]}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900112,2026101900112,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900113,'代理商管理查询','/openapi/v1.0/afterSales/dealer/pageList',1,1,0,2026101900014,'-1,-2,2026101900001,2026101900014',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900113,2026101900113,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900114,'代理商管理启停','/openapi/v1.0/afterSales/dealer/status',1,1,0,2026101900014,'-1,-2,2026101900001,2026101900014',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900114,2026101900114,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900115,'门店管理推送','/openapi/v1.0/afterSales/store/save',1,1,0,2026101900015,'-1,-2,2026101900001,2026101900015',-2,NOW(),'POST','push','Local','JSON','JSON','json','{"items":[{"code":"OPENAPI_DEMO_001","name":"示例"}]}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900115,2026101900115,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900116,'门店管理查询','/openapi/v1.0/afterSales/store/pageList',1,1,0,2026101900015,'-1,-2,2026101900001,2026101900015',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900116,2026101900116,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900117,'门店管理启停','/openapi/v1.0/afterSales/store/status',1,1,0,2026101900015,'-1,-2,2026101900001,2026101900015',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900117,2026101900117,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900118,'销售区域推送','/openapi/v1.0/afterSales/salesRegion/save',1,1,0,2026101900016,'-1,-2,2026101900001,2026101900016',-2,NOW(),'POST','push','Local','JSON','JSON','json','{"items":[{"code":"OPENAPI_DEMO_001","name":"示例"}]}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900118,2026101900118,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900119,'销售区域查询','/openapi/v1.0/afterSales/salesRegion/pageList',1,1,0,2026101900016,'-1,-2,2026101900001,2026101900016',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900119,2026101900119,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900120,'实物档案推送','/openapi/v1.0/afterSales/productInstance/save',1,1,0,2026101900017,'-1,-2,2026101900001,2026101900017',-2,NOW(),'POST','push','Local','JSON','JSON','json','{"items":[{"code":"OPENAPI_DEMO_001","name":"示例"}]}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900120,2026101900120,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900121,'实物档案查询','/openapi/v1.0/afterSales/productInstance/pageList',1,1,0,2026101900017,'-1,-2,2026101900001,2026101900017',-2,NOW(),'POST','push','Local','JSON','JSON','json','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900121,2026101900121,'',1,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
INSERT INTO sys_open_api(id,name,path,is_enabled,is_edited,auth_method,api_category_id,api_category_id_path,create_user,create_time,http_method,direction,api_type,request_format,response_format,body_type,body_template,header_template,response_template,config,alert_monitor) VALUES(2026101900122,'图片上传','/openapi/v1.0/afterSales/image/upload',1,1,0,2026101900018,'-1,-2,2026101900001,2026101900018',-2,NOW(),'POST','push','Local','JSON','JSON','multipart/form-data','{}','{"Authorization":"Bearer <access_token>"}','{"code":0,"errMsg":"","data":{},"requestId":"UUID"}','{}',0) ON DUPLICATE KEY UPDATE name=VALUES(name),path=VALUES(path),http_method=VALUES(http_method),api_category_id=VALUES(api_category_id),api_category_id_path=VALUES(api_category_id_path);
INSERT INTO sys_open_api_log_config(id,api_id,keyword,is_record_request_data,is_record_response_data,create_user,create_time) VALUES(2026101900122,2026101900122,'',0,1,-2,NOW()) ON DUPLICATE KEY UPDATE keyword=VALUES(keyword),is_record_request_data=VALUES(is_record_request_data),is_record_response_data=1;
COMMIT;

-- 各接口可直接参照的业务请求模板（不含密钥）。
START TRANSACTION;
UPDATE sys_open_api SET body_template='{
  "items": [
    {
      "code": "OA26_CAT",
      "name": "开放接口测试分类",
      "parentCode": "",
      "remark": "OPENAPI-20261019受控样本"
    }
  ]
}',body_type='json',response_format='JSON' WHERE id=2026101900100 AND path='/openapi/v1.0/afterSales/category/save';
UPDATE sys_open_api SET body_template='{"page":1,"pageSize":15}',body_type='json',response_format='JSON' WHERE id=2026101900101 AND path='/openapi/v1.0/afterSales/category/pageList';
UPDATE sys_open_api SET body_template='{"code":"OA26_CAT","enabled":true}',body_type='json',response_format='JSON' WHERE id=2026101900102 AND path='/openapi/v1.0/afterSales/category/status';
UPDATE sys_open_api SET body_template='{
  "items": [
    {
      "code": "OA26_SERIES",
      "name": "开放接口测试系列",
      "sortOrder": 10,
      "remark": "OPENAPI-20261019受控样本"
    }
  ]
}',body_type='json',response_format='JSON' WHERE id=2026101900103 AND path='/openapi/v1.0/afterSales/series/save';
UPDATE sys_open_api SET body_template='{"page":1,"pageSize":15}',body_type='json',response_format='JSON' WHERE id=2026101900104 AND path='/openapi/v1.0/afterSales/series/pageList';
UPDATE sys_open_api SET body_template='{"code":"OA26_SERIES","enabled":true}',body_type='json',response_format='JSON' WHERE id=2026101900105 AND path='/openapi/v1.0/afterSales/series/status';
UPDATE sys_open_api SET body_template='{
  "items": [
    {
      "code": "OA26_PART",
      "name": "开放接口测试配件",
      "brand": "模拟品牌",
      "factory": "模拟工厂",
      "costPrice": 10,
      "retailPrice": 20,
      "model": "OA26_PART_MODEL",
      "remark": "OPENAPI-20261019受控样本"
    }
  ]
}',body_type='json',response_format='JSON' WHERE id=2026101900106 AND path='/openapi/v1.0/afterSales/part/save';
UPDATE sys_open_api SET body_template='{"page":1,"pageSize":15}',body_type='json',response_format='JSON' WHERE id=2026101900107 AND path='/openapi/v1.0/afterSales/part/pageList';
UPDATE sys_open_api SET body_template='{"code":"OA26_PART","enabled":true}',body_type='json',response_format='JSON' WHERE id=2026101900108 AND path='/openapi/v1.0/afterSales/part/status';
UPDATE sys_open_api SET body_template='{
  "items": [
    {
      "code": "OA26_PRODUCT",
      "name": "开放接口测试商品",
      "categoryCode": "OA26_CAT",
      "seriesCode": "OA26_SERIES",
      "model": "OA26_PRODUCT_MODEL",
      "warrantyEnabled": true,
      "warrantyMonths": 12,
      "warrantyType": "FIXED",
      "warrantyScope": "WHOLE_PRODUCT",
      "warrantyStartRule": "PURCHASE_DATE",
      "physicalProduct": true,
      "listed": false,
      "miniappVisible": false,
      "networkSupported": true,
      "installationParts": [
        {
          "partCode": "OA26_PART",
          "quantity": 2
        }
      ],
      "productDescription": "OPENAPI-20261019受控样本"
    }
  ]
}',body_type='json',response_format='JSON' WHERE id=2026101900109 AND path='/openapi/v1.0/afterSales/product/save';
UPDATE sys_open_api SET body_template='{"page":1,"pageSize":15}',body_type='json',response_format='JSON' WHERE id=2026101900110 AND path='/openapi/v1.0/afterSales/product/pageList';
UPDATE sys_open_api SET body_template='{"code":"OA26_PRODUCT","enabled":true}',body_type='json',response_format='JSON' WHERE id=2026101900111 AND path='/openapi/v1.0/afterSales/product/status';
UPDATE sys_open_api SET body_template='{
  "items": [
    {
      "code": "OA26_DEALER1",
      "name": "开放接口一级代理商",
      "agent": "FIRST",
      "parentCode": "",
      "organizationCode": "集团",
      "provinceName": "上海市",
      "cityName": "上海市",
      "districtName": "浦东新区",
      "address": "模拟地址（非实际门店）"
    },
    {
      "code": "OA26_DEALER2",
      "name": "开放接口二级代理商",
      "agent": "SECOND",
      "parentCode": "OA26_DEALER1",
      "organizationCode": "集团",
      "provinceName": "上海市",
      "cityName": "上海市",
      "districtName": "浦东新区"
    }
  ]
}',body_type='json',response_format='JSON' WHERE id=2026101900112 AND path='/openapi/v1.0/afterSales/dealer/save';
UPDATE sys_open_api SET body_template='{"page":1,"pageSize":15}',body_type='json',response_format='JSON' WHERE id=2026101900113 AND path='/openapi/v1.0/afterSales/dealer/pageList';
UPDATE sys_open_api SET body_template='{"code":"OA26_DEALER1","enabled":true}',body_type='json',response_format='JSON' WHERE id=2026101900114 AND path='/openapi/v1.0/afterSales/dealer/status';
UPDATE sys_open_api SET body_template='{
  "items": [
    {
      "code": "OA26_STORE",
      "name": "开放接口测试门店",
      "dealerCode": "OA26_DEALER2",
      "organizationCode": "集团",
      "provinceName": "上海市",
      "cityName": "上海市",
      "districtName": "浦东新区",
      "address": "模拟地址（非实际门店）",
      "profile": {
        "sourceSystem": "OPENAPI-20261019",
        "sourceStoreId": "OA26_STORE",
        "intro": "受控接口测试数据"
      }
    }
  ]
}',body_type='json',response_format='JSON' WHERE id=2026101900115 AND path='/openapi/v1.0/afterSales/store/save';
UPDATE sys_open_api SET body_template='{"page":1,"pageSize":15}',body_type='json',response_format='JSON' WHERE id=2026101900116 AND path='/openapi/v1.0/afterSales/store/pageList';
UPDATE sys_open_api SET body_template='{"code":"OA26_STORE","enabled":true}',body_type='json',response_format='JSON' WHERE id=2026101900117 AND path='/openapi/v1.0/afterSales/store/status';
UPDATE sys_open_api SET body_template='{
  "items": [
    {
      "subjectType": "DEALER",
      "subjectCode": "OA26_DEALER1",
      "scopeLevel": "CITY",
      "areas": [
        {
          "provinceCode": "310000",
          "provinceName": "上海市",
          "cityCode": "310100",
          "cityName": "上海市"
        }
      ]
    },
    {
      "subjectType": "STORE",
      "subjectCode": "OA26_STORE",
      "scopeLevel": "CITY",
      "areas": [
        {
          "provinceCode": "310000",
          "provinceName": "上海市",
          "cityCode": "310100",
          "cityName": "上海市"
        }
      ]
    }
  ]
}',body_type='json',response_format='JSON' WHERE id=2026101900118 AND path='/openapi/v1.0/afterSales/salesRegion/save';
UPDATE sys_open_api SET body_template='{"page":1,"pageSize":15}',body_type='json',response_format='JSON' WHERE id=2026101900119 AND path='/openapi/v1.0/afterSales/salesRegion/pageList';
UPDATE sys_open_api SET body_template='{
  "items": [
    {
      "uniqueCode": "OA26_INSTANCE_001",
      "productCode": "OA26_PRODUCT",
      "factoryCode": "OA26_FACTORY",
      "factoryName": "模拟工厂",
      "warehouseCode": "OA26_WH",
      "warehouseName": "模拟仓库",
      "dealerCode": "OA26_DEALER2",
      "storeCode": "OA26_STORE"
    }
  ]
}',body_type='json',response_format='JSON' WHERE id=2026101900120 AND path='/openapi/v1.0/afterSales/productInstance/save';
UPDATE sys_open_api SET body_template='{"page":1,"pageSize":15}',body_type='json',response_format='JSON' WHERE id=2026101900121 AND path='/openapi/v1.0/afterSales/productInstance/pageList';
UPDATE sys_open_api SET body_template='uploadFile=<binary>',body_type='multipart/form-data',response_format='JSON' WHERE id=2026101900122 AND path='/openapi/v1.0/afterSales/image/upload';
COMMIT;
