-- 仅用于 gaia_wh_init_wzy 开发联调库；模拟正式业务关系，不得用于生产环境。
-- 执行前已核对当前主键高水位、组织 161 及下列业务编码均未占用。

SET @actor_id = 1662552458226;
SET @org_id = 161;
SET @org_code = '00038';
SET @org_name = '天长';

INSERT INTO afs_dealer(
  id,code,name,type,sales_area,source,agent,parent_id,org_id,org_code,org_name,enabled,
  location_province,location_city,location_district,location_street,address,longitude,latitude,
  legal_representative,legal_representative_id,registered_date,registered_capital,bank_name,
  bank_account_name,bank_account_no,business_license_expires_at,organization_code_expires_at,
  tax_registration_expires_at,revision,create_user,create_time,update_user,update_time
) VALUES
  (10,'DEMO-DLR-HD01','华东区域渠道中心（演示）','CHANNEL','','web','FIRST',NULL,@org_id,@org_code,@org_name,1,
   '上海市','上海市','闵行区','新虹街道','申虹路 100 号（演示地址）','121.327908','31.200335',
   '林岚','',DATE '2016-04-18','人民币 1000 万元','','','',DATE '2036-04-17',NULL,NULL,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (11,'DEMO-DLR-SH01','上海申越建材有限公司（演示）','CHANNEL','','web','SECOND',10,@org_id,@org_code,@org_name,1,
   '上海市','上海市','浦东新区','陆家嘴街道','世纪大道 1000 号（演示地址）','121.544379','31.221517',
   '陈昊','',DATE '2018-06-12','人民币 500 万元','','','',DATE '2038-06-11',NULL,NULL,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (12,'DEMO-DLR-SZ01','苏州澄居商贸有限公司（演示）','CHANNEL','','web','SECOND',10,@org_id,@org_code,@org_name,1,
   '江苏省','苏州市','吴中区','长桥街道','吴中大道 188 号（演示地址）','120.631898','31.264212',
   '沈悦','',DATE '2019-09-20','人民币 300 万元','','','',DATE '2039-09-19',NULL,NULL,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP);

INSERT INTO afs_dealer_organization(dealer_id,organization_id) VALUES
  (10,@org_id),(11,@org_id),(12,@org_id);

INSERT INTO afs_dealer_audit(id,dealer_id,action,actor_id,before_version,after_version,created_at) VALUES
  (6,10,'CREATE',@actor_id,NULL,'c4d6e939f559bf4bfe318135ebe6f69601a59792f36177085d1172e016444220',CURRENT_TIMESTAMP),
  (7,11,'CREATE',@actor_id,NULL,'b9d89b54e0a253e6562e87b5e94518b50df957673145fa639550e68264056e35',CURRENT_TIMESTAMP),
  (8,12,'CREATE',@actor_id,NULL,'5594a84f7fd7e03be4e6eb437999722609b7a447f736d8a4bd51711522c403fd',CURRENT_TIMESTAMP);

INSERT INTO afs_store_type(id,code,name)
VALUES(2,'PHYSICAL_STORE','实体店');

INSERT INTO afs_store(
  id,code,name,dealer_id,org_id,org_code,org_name,store_type_id,active_state,service_type,source,enabled,
  location_province,location_city,location_district,location_street,address,longitude,latitude,
  legal_representative,legal_representative_id,registered_date,registered_capital,bank_name,
  bank_account_name,bank_account_no,business_license_expires_at,organization_code_expires_at,
  tax_registration_expires_at,revision,create_user,create_time,update_user,update_time
) VALUES
  (4,'DEMO-STR-SH01','TOTO 上海浦东体验店（演示）',11,@org_id,@org_code,@org_name,2,'已营业','送安一体','web',1,
   '上海市','上海市','浦东新区','陆家嘴街道','世纪大道 1001 号（演示地址）','121.544520','31.221620',
   '赵晨','',DATE '2020-03-16','人民币 100 万元','','','',DATE '2040-03-15',NULL,NULL,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (5,'DEMO-STR-SH02','TOTO 上海闵行旗舰店（演示）',11,@org_id,@org_code,@org_name,2,'已营业','送安一体','web',1,
   '上海市','上海市','闵行区','新虹街道','申虹路 188 号（演示地址）','121.327650','31.199980',
   '陆瑶','',DATE '2021-05-08','人民币 80 万元','','','',DATE '2041-05-07',NULL,NULL,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (6,'DEMO-STR-SZ01','TOTO 苏州吴中专卖店（演示）',12,@org_id,@org_code,@org_name,2,'已营业','销售与安装','web',1,
   '江苏省','苏州市','吴中区','长桥街道','吴中大道 200 号（演示地址）','120.632120','31.264380',
   '顾言','',DATE '2022-08-22','人民币 60 万元','','','',DATE '2042-08-21',NULL,NULL,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP);

INSERT INTO afs_store_audit(id,store_id,action,actor_id,before_version,after_version,created_at) VALUES
  (5,4,'CREATE',@actor_id,NULL,'7c8a04b7965f4ffaf64525f97db16cee3390de4ecf7df5255387921671579948',CURRENT_TIMESTAMP),
  (6,5,'CREATE',@actor_id,NULL,'d2a7248e9c1d6d3dd56fe37b6dfa91057e0a0f58bab5a5f15da2e9cb125b31ea',CURRENT_TIMESTAMP),
  (7,6,'CREATE',@actor_id,NULL,'08bc611d2d14c473adb180177ad960ad4130b9b827a5bff2db6ca04a361c5468',CURRENT_TIMESTAMP);

INSERT INTO afs_service_area(
  id,code,name,scope_level,province_name,city_name,district_name,street_name,remark,enabled,revision,
  create_user,create_time,update_user,update_time
) VALUES
  (4,'DEMO-AREA-SH-PD','上海市浦东新区服务区域（演示）','DISTRICT','上海市','上海市','浦东新区','',
   '覆盖浦东新区，东区服务站优先。',1,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (5,'DEMO-AREA-SH-MH','上海市闵行区服务区域（演示）','DISTRICT','上海市','上海市','闵行区','',
   '覆盖闵行区，西区服务站优先。',1,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (6,'DEMO-AREA-SZ-WZ','苏州市吴中区服务区域（演示）','DISTRICT','江苏省','苏州市','吴中区','',
   '覆盖吴中区，由苏州服务站优先承接。',1,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP);

INSERT INTO afs_service_area_audit(id,area_id,action,actor_id,before_version,after_version,created_at) VALUES
  (6,4,'CREATE',@actor_id,NULL,'e9bc006d4d1bb01d49344628ddf2bea82acb8041b0e84f65144ebe67ef644751',CURRENT_TIMESTAMP),
  (7,5,'CREATE',@actor_id,NULL,'cce9b0739cd059714fc635c85a739ce57d7ba80f14556b227efd2d74617d1e29',CURRENT_TIMESTAMP),
  (8,6,'CREATE',@actor_id,NULL,'8341c362c6a463ae705fdc17e674692068813ce7128231cd9cafd197a18b46bf',CURRENT_TIMESTAMP);

INSERT INTO afs_service_station(
  id,code,name,org_id,org_code,org_name,manager_name,manager_mobile,hotline,service_items,
  location_province,location_city,location_district,location_street,address,longitude,latitude,
  legal_representative,legal_representative_id,registered_date,registered_capital,bank_name,
  bank_account_name,bank_account_no,business_license_expires_at,organization_code_expires_at,
  tax_registration_expires_at,remark,enabled,revision,create_user,create_time,update_user,update_time
) VALUES
  (6,'DEMO-STN-SH-E','上海东区授权服务站（演示）',@org_id,@org_code,@org_name,'徐宁','13800001001','400-000-1001','INSTALLATION,REPAIR,CLEANING',
   '上海市','上海市','浦东新区','陆家嘴街道','浦东南路 100 号（演示地址）','121.522180','31.228560',
   '徐宁','',DATE '2017-02-10','人民币 200 万元','','','',DATE '2037-02-09',NULL,NULL,
   '负责浦东新区，兼顾闵行区。',1,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (7,'DEMO-STN-SH-W','上海西区授权服务站（演示）',@org_id,@org_code,@org_name,'周铭','13800001002','400-000-1002','INSTALLATION,REPAIR,CLEANING',
   '上海市','上海市','闵行区','新虹街道','申长路 200 号（演示地址）','121.318420','31.193930',
   '周铭','',DATE '2018-11-05','人民币 180 万元','','','',DATE '2038-11-04',NULL,NULL,
   '负责闵行区，兼顾浦东新区。',1,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (8,'DEMO-STN-SZ-WZ','苏州吴中授权服务站（演示）',@org_id,@org_code,@org_name,'赵恺','13800001003','400-000-1003','INSTALLATION,REPAIR,CLEANING',
   '江苏省','苏州市','吴中区','长桥街道','吴中东路 300 号（演示地址）','120.631650','31.263960',
   '赵恺','',DATE '2019-07-19','人民币 150 万元','','','',DATE '2039-07-18',NULL,NULL,
   '负责苏州市吴中区。',1,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP);

INSERT INTO afs_service_area_station(area_id,station_id,priority,create_user,create_time,update_user,update_time) VALUES
  (4,6,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (4,7,2,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (5,7,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (5,6,2,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP),
  (6,8,1,@actor_id,CURRENT_TIMESTAMP,@actor_id,CURRENT_TIMESTAMP);

INSERT INTO afs_service_station_audit(id,station_id,action,actor_id,before_version,after_version,created_at) VALUES
  (7,6,'CREATE',@actor_id,NULL,'32690f1c2a4184de519532cf34a362c8942e1688b5dbb305a219f79324f4e3d0',CURRENT_TIMESTAMP),
  (8,7,'CREATE',@actor_id,NULL,'6b988121a388655c6f89d44ed414b85ce4e7e2f49964b367d0c74253de7588dd',CURRENT_TIMESTAMP),
  (9,8,'CREATE',@actor_id,NULL,'7b687020d11463b33a86af883893943d0cd614dd885918ae46d85e2b91af297e',CURRENT_TIMESTAMP);
