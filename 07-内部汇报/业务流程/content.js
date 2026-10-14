'use strict';
// Presentation summaries of the local flow documents. This is not a workflow engine.
// Explicit coordinates keep the nine diagrams readable without a runtime graph library.
(() => {
  const n = (id, x, y, title, owner, type = 'step', detail = '', go = '') => ({ id, x, y, title: title.split('|'), owner, type, detail, go });
  const e = (from, to, label = '', options = {}) => ({ from, to, label, ...options });
  const src = name => '../../05-业务流程/' + name + '.md';
  const feesSpec = '../../specs/2026-10-03-服务工单线下收费开发计划.md';
  const returnSpec = '../../specs/2026-10-03-工单两级退回与重新分配.md';
  const servicesSpec = '../../specs/2026-09-26-安装维修指导三类服务流程.md';
  window.FLOW_PAGES = [
    {
      id: 'overview', number: '00', nav: '售后全流程', title: '一件产品，一次服务，一条协同主线',
      subtitle: '从产品关系到服务历史，先看责任交接，再展开阶段分支。',
      source: src('00-售后全流程总览'), boundary: '业务步骤图，不等同于数据库状态；本页不声明全部链路已实现或已验收。',
      notes: ['主线采用消费者可信商品申请的典型场景；其他渠道按各自受理契约办理。商品绑定可复用，登记不是每次申请的必办步骤。', '远程指导需明确处理人，按适用契约进入履约，不强制经过上门分站、预约和签到。', '收费是跨阶段条件专题；七个阶段也不是每张工单都必须依次经过的七道审批。'],
      takeaways: [['可信来源直接建单', '手机号同步或有效唯一码绑定的本人商品，申请后直接进入工单与分站策略；可信来源不等于免费权益。'], ['通过即办结，反馈独立', '审核退回需形成新提交版本；通过后直接办结，抽样回访与消费者自发评价独立办理。']],
      nodes: [
        n('reg',110,180,'注册与绑定','消费者／系统','step','同步、扫码或辅助添加，保存产品关系和资料来源；已有本人可用商品可直接复用。','registration'),
        n('product',330,180,'选择本人产品','消费者','step','复用已有实例与登记信息，按本次服务判断范围和权益。','application'),
        n('apply',550,180,'申请服务|形成工单','消费者／门店／客服','step','消费者可信商品直接建单；门店已有购买记录发起的服务仍按受理契约办理。','application'),
        n('dispatch',770,180,'分站、派人|确认预约','客服／服务站／人员','step','上门链明确负责站、执行人及确认预约；分站与派人是两个动作。','dispatch'),
        n('perform',990,180,'执行服务|提交完工','适用处理人员','step','按安装、维修或指导的适用要求执行，整理证据并保存提交版本。','fulfillment'),
        n('review',1210,180,'完工审核','系统策略／授权客服','step','核对当前提交版本与固定门禁；疑点、失败或观察模式转人工。','review'),
        n('closed',1210,450,'审核通过|工单已办结','后端保存服务历史','handoff','审核通过直接 CLOSED，不再要求服务人员二次交单。','review'),
        n('feedback',990,450,'抽样回访|消费者评价','客服／消费者','handoff','回访任务与消费者自发评价分别办理，不阻塞已经办结的工单。','review'),
        n('qualification',550,450,'适用资格核验','条件支线','step','其他已确认渠道、免费权益或现场检测事项，按相应契约核验；不是所有可信申请的前置受理审批。','qualification'),
        n('exception',770,450,'异常跟进|重新安排','授权人员','exception','拒单、改期、缺件、取消或投诉分别有去向并保留原记录。','exceptions'),
        n('fees',110,450,'费用确认|线下收款','跨阶段条件专题','step','全免费沿原链路；有收费先报价同意再执行，收费单在原人工审核中核对，未收齐不办结。','fees')
      ],
      edges: [e('reg','product'),e('product','apply'),e('apply','dispatch','可信商品'),e('dispatch','perform'),e('perform','review'),e('review','closed','通过'),e('closed','feedback','独立抽样',{conditional:true}),e('apply','qualification','其他适用渠道',{conditional:true}),e('qualification','dispatch','按条件安排',{via:[[665,450],[665,300],[770,300]],start:'right',end:'bottom',labelAt:[795,305]}),e('perform','exception','异常需跟进',{conditional:true,via:[[990,350],[770,350]],start:'bottom',end:'top',labelAt:[880,345]}),e('apply','fees','本单涉及费用时',{conditional:true,via:[[550,260],[440,260],[440,330],[110,330]],start:'bottom',end:'top',labelAt:[265,320]}),e('review','perform','退回重提',{via:[[1210,60],[990,60]],start:'top',end:'top',labelAt:[1100,50]})]
    },
    {
      id:'registration',number:'01',nav:'商品注册与绑定',title:'三种添加方式，汇入同一产品关系',
      subtitle:'验证手机号后优先自动同步；扫码识别或无码辅助添加补充其他产品。',
      source:src('01-商品注册与绑定'),boundary:'目标流程整理；归属、购买事实与免费权益分别判断，不据本页推定全部能力已开放。',
      notes:['普通商品码只能识别型号，不能证明具体实物；辅助创建产品应保留用户自报和待核验标记。','所有方式先查后建，复用可信实例与已有关系；归属冲突只展示脱敏候选，不自动授予排他归属。','同型号另一件无码产品需保留疑似重复关系；实例合并及购买人与使用人规则按对应契约办理。'],
      takeaways:[['先查后建，避免重复', '匹配购买来源、标识和账号已有产品，能复用就补充原实例，保留每份资料的来源。'],['“我的产品”不等于免费通过', '账号关系、实物核实、购买事实和本次权益是不同结果，风险候选需要核对。']],
      nodes:[
        n('login',130,80,'验证手机号|登录','消费者'),n('match',400,80,'匹配可信|购买来源','系统'),n('result',670,80,'匹配是否|有效无冲突','', 'decision'),
        n('sync',940,80,'自动同步产品','系统','handoff'),n('risk',670,280,'脱敏候选|待人工核验','有权限人员','exception'),
        n('scan',400,280,'一码通扫','消费者'),n('code',130,280,'扫码结果|是否可信','', 'decision'),
        n('model',130,480,'识别型号|无码辅助添加','消费者／识别能力','step','普通商品码识别型号；无码通过铭牌、凭证、搜索或补充资料，申报事实保留待核验标记。'),
        n('reuse',400,480,'查找、复用|或补充实例','系统','step','可信购买或具体实物标识先查后建；无码辅助添加按目标规则创建待核验产品。'),
        n('relation',670,480,'保存关系|及资料来源','系统'),n('mine',940,480,'我的产品|保留核实状态','消费者','handoff'),n('next',1190,480,'按需申请服务','阶段 02','handoff','','application')
      ],
      edges:[e('login','match'),e('match','result'),e('result','sync','有效'),e('result','risk','有风险'),e('match','scan','未找到／添加其他'),e('scan','code'),e('code','model','普通码／无码'),e('code','reuse','可信购买／实物码',{via:[[265,280],[265,480]],start:'right',end:'left',labelAt:[285,380]}),e('model','reuse'),e('reuse','relation'),e('relation','mine'),e('mine','next'),e('sync','mine','可信同步'),e('risk','mine','保留核实状态',{via:[[940,280]],start:'right',end:'top',labelAt:[842,265]})]
    },
    {
      id:'application',number:'02',nav:'服务申请与建单',title:'一次需求，形成一条可追踪记录',
      subtitle:'区分消费者可信商品申请与其他受理渠道，不把全部申请都画成先人工审批。',
      source:src('02-服务申请与建单'),boundary:'当前可信消费者申请直接建单；其他渠道与字段范围按相应 Spec，不扩展未确认入口。',
      notes:['门店从授权范围内已有购买记录进入“发起服务”，安装和维修分别校验权限；不默认开放新顾客建档或指导。','产品型号不能替代实例归属核验。重试保留幂等和活动服务冲突校验，不能重复形成工单。','“已提交”不等于免费资格已通过，也不等于已经派单或确认预约。'],
      takeaways:[['可信商品进入工单与分站策略', '手机号同步或有效唯一码绑定的本人商品直接建 CONSUMER / PENDING_DISPATCH；扫码无购买登记也不补建购买记录。'],['冲突有反馈，补资料沿原需求', '缺项返回填写，已有冲突服务提示原记录；权限、归属、启用商品和重复提交由后端校验。']],
      nodes:[n('entry',130,90,'选择申请入口','消费者／门店／客服'),n('product',395,90,'识别客户|选择本次产品','发起人'),n('enough',660,90,'资料足以|发起需求','', 'decision'),n('fill',925,90,'填写服务类型|与必要信息','发起人'),n('check',1190,90,'权限、字段|幂等校验','后端'),n('supplement',395,330,'登记或补充|完成后返回','阶段 01','exception','','registration'),n('valid',1190,330,'本次提交|能否通过','', 'decision'),n('saved',925,330,'保存来源与|服务记录','系统'),n('trusted',660,330,'消费者本人|可信商品','', 'decision'),n('direct',660,520,'直接进入工单|分站派单','阶段 04','handoff','','dispatch'),n('other',395,520,'按渠道契约|受理与核验','适用岗位','handoff','','qualification'),n('conflict',1190,520,'提示已有记录|按权限核对','发起人','exception')],
      edges:[e('entry','product'),e('product','enough'),e('enough','fill','是'),e('enough','supplement','否',{via:[[660,220],[395,220]],start:'bottom',end:'top',labelAt:[530,210]}),e('supplement','product','补充后返回'),e('fill','check'),e('check','valid'),e('valid','saved','通过'),e('valid','conflict','已有冲突'),e('valid','fill','需补充',{via:[[1320,330],[1320,220],[925,220]],start:'right',end:'bottom',labelAt:[1080,210]}),e('saved','trusted'),e('trusted','direct','是'),e('trusted','other','其他渠道',{via:[[660,440],[395,440]],start:'bottom',end:'top',labelAt:[520,430]})]
    },
    {
      id:'qualification',number:'03',nav:'受理与资格核验',title:'能否服务、是否免费，分开核验',
      subtitle:'服务资格是条件判断，不作为所有可信商品申请的前置“服务受理”关卡。',
      source:src('03-受理与服务资格核验'),boundary:'核验扩展包含讨论建议；具体证据、岗位和权限依已确认契约，不因画图新增审批。',
      notes:['可信建单来源不等于保修、免费安装或费用资格已经确认；现场故障保修范围可交履约阶段核对。','无可信接口或资料不足不能自动通过，也不能直接认定未购买；补充资料继续原申请。','不符合免费权益不等于删除档案或自动改为收费，需说明原因并提供适用选择。'],
      takeaways:[['每项结论都有依据', '分别输出服务范围、免费权益和待现场核实事项；保留自动判断或人工核验依据。'],['核验未通过也有明确去向', '补资料、人工核验或适用服务选择各自留痕，不静默改成收费单。']],
      nodes:[n('scope',130,80,'确认本次|服务规则','系统／受理人员'),n('need',395,80,'是否需要|相应权益核验','', 'decision'),n('check',660,80,'核对证据|执行确定规则','系统'),n('result',925,80,'核验结果','', 'decision'),n('pass',1190,80,'按适用条件|后续办理','系统／受理人员','handoff'),n('supplement',660,300,'补充具体缺项','消费者','exception'),n('human',925,300,'人工核验|记录原始依据','授权岗位'),n('decision',925,500,'人工判断','', 'decision'),n('deny',660,500,'说明原因|给出适用选择','受理人员','exception'),n('dispatch',1190,300,'上门分站|派单预约','阶段 04','handoff','','dispatch'),n('remote',1190,500,'明确远程|处理人员','阶段 05','handoff','','fulfillment')],
      edges:[e('scope','need'),e('need','check','是'),e('need','pass','无需相应核验',{via:[[395,10],[1190,10]],start:'top',end:'top',labelAt:[660,20]}),e('check','result'),e('result','pass','符合'),e('result','deny','明确不符合',{via:[[805,80],[805,405],[660,405]],start:'left',end:'top',labelAt:[800,395]}),e('result','human','需人工'),e('result','supplement','缺资料',{via:[[790,80],[790,300]],start:'left',end:'right',labelAt:[792,210]}),e('supplement','check','补后续核验'),e('human','decision'),e('decision','deny','不通过'),e('decision','supplement','补充',{via:[[790,500],[790,390],[660,390]],start:'left',end:'bottom',labelAt:[710,380]}),e('decision','pass','通过',{via:[[1060,500],[1060,200],[1190,200]],start:'right',end:'bottom',labelAt:[1068,380]}),e('pass','dispatch','上门'),e('pass','remote','远程',{via:[[1320,80],[1320,500]],start:'right',end:'right',labelAt:[1284,390]})]
    },
    {
      id:'dispatch',number:'04',nav:'分站派单与预约',title:'先明确负责站，再明确执行人和预约',
      subtitle:'人工或策略辅助分配，都保留人员承接、联系和重新确认的责任。',
      source:src('04-分站派单与预约'),basis:[['两级退回与重新分配',returnSpec]],boundary:'两级退回按已确认 Spec；其他调度条件、精确岗位和区域规则以对应契约为准。',
      notes:['智能分站排除无匹配技能、当天可用且有剩余日容量人员的站；无候选由客服协调。','无承接能力的两级退回只在未开始服务、无完工提交及待办／已完成配件流转等条件下办理。','保留原单号、历史和预约参考；新承接人重新确认预约，退回后进入人工待办。'],
      takeaways:[['分站、派人和预约各有结果', '负责服务站、执行人及双方确认时间分别留存；派单不等于联系成功，期望时间也不等于预约。'],['无法承接，两级退回', '人员退回本站或站长收回重派；本站无能力时先释放人员，再退回客服重新分站。']],
      nodes:[n('candidate',130,90,'查找候选站|核对承接能力','系统／授权客服'),n('station',395,90,'确认负责|服务站','系统策略／授权客服'),n('assign',660,90,'筛选可用人员|派单','系统策略／服务站'),n('contact',925,90,'承接并联系|客户','服务人员'),n('booking',1190,90,'确认联系人|地址与时间','执行人／客户'),n('nostation',130,320,'无匹配服务站|人工协调','授权客服','exception'),n('backstation',660,320,'无人或拒单|退回本站','人员／站长','exception','按两级退回条件办理；原因必留，人员解除后由服务站重新派人。'),n('backcs',395,320,'本站无承接能力|退回客服','服务站','exception','先释放人员，再退回客服重新分站；不让工单在自动分站中反复进入无能力站。'),n('exception',925,320,'改期或断联|记录并跟进','阶段 07','exception','','exceptions'),n('next',1190,320,'带核验待办|进入履约','阶段 05','handoff','','fulfillment')],
      edges:[e('candidate','station','有候选'),e('station','assign'),e('assign','contact','可承接'),e('contact','booking','安排确认'),e('booking','next'),e('candidate','nostation','无候选'),e('nostation','candidate','协调后重选',{via:[[10,320],[10,90]],start:'left',end:'left',labelAt:[55,220]}),e('assign','backstation','无能力／拒单'),e('backstation','assign','本站重派',{via:[[795,320],[795,90]],start:'right',end:'right',labelAt:[797,215]}),e('backstation','backcs','释放人员'),e('backcs','station','重新分站'),e('contact','exception','未能确认'),e('exception','booking','跟进后确认',{via:[[1060,320],[1060,230],[1190,230]],start:'right',end:'bottom',labelAt:[1140,220]})]
    },
    {
      id:'fulfillment',number:'05',nav:'履约与完工提交',title:'按服务类型执行，按当前版本提交',
      subtitle:'上门与远程采用各自要求；配件、费用和完工材料在适用条件下关联。',
      source:src('05-服务履约与完工提交'),basis:[['安装／维修／指导三类服务契约',servicesSpec],['线下收费现行契约',feesSpec+'#offline-fees-delivery']],boundary:'原图远程转上门为讨论方向；当前不支持原单直接转换，应另行申请或联系服务中心。',
      notes:['上门需核对本次产品、适用签到和现场检测；远程处理不要求虚构定位、现场码或上门证据。','费用全免费沿原路径；收费项目执行前取得当前报价的客户同意，增项或加价重新确认。','领料、库存转移、实际耗用与对客费用分别记录；完工提交扣库后审核不重复扣库。'],
      takeaways:[['缺件与再次预约保留原记录', '有缺件或需要再次上门时记录原因与配件需求，协调后续安排；不能把未解决记成已解决。'],['提交完工仍需审核', '材料按服务类型校验，客户服务结果确认与费用同意分别记录；退回后提交新版本。']],
      nodes:[n('mode',130,90,'本次履约方式','', 'decision'),n('onsite',395,90,'到达核对产品|现场检测','服务人员'),n('conditions',660,90,'方案是否|可继续执行','', 'decision'),n('work',925,90,'执行安装、维修|或上门指导','服务人员'),n('parts',1190,90,'缺件或需|再次上门','', 'decision'),n('remote',395,330,'远程沟通|记录处理结果','适用处理人'),n('fees',660,330,'收费先报价|客户同意','条件专题 08','step','全免费无需增加费用操作；收费及增项按当前报价确认后执行。','fees'),n('evidence',925,330,'整理服务结果|耗用与适用证据','执行人'),n('rebook',1190,330,'记录缺件需求|协调再次预约','阶段 04','exception','','dispatch'),n('change',395,520,'需上门时另行申请|或联系服务中心','按现行服务契约','exception','当前远程工单不直接转安装或维修，按已确认入口另行申请或联系服务中心。','application'),n('exception',130,330,'信息不符／不同意|授权协调跟进','阶段 07','exception','','exceptions'),n('submit',925,520,'校验材料|保存完工版本','后端'),n('review',1190,520,'进入完工审核','阶段 06','handoff','','review')],
      edges:[e('mode','onsite','上门'),e('mode','remote','远程',{via:[[265,90],[265,330]],start:'right',end:'left',labelAt:[273,230]}),e('onsite','conditions'),e('conditions','work','可继续／全免费'),e('conditions','fees','涉及收费',{conditional:true}),e('fees','work','确认后执行',{via:[[795,330],[795,230],[925,230]],start:'right',end:'bottom',labelAt:[857,220]}),e('conditions','exception','信息不符／不同意',{via:[[660,220],[130,220]],start:'bottom',end:'top',labelAt:[395,210]}),e('work','parts'),e('parts','rebook','是'),e('parts','evidence','否',{via:[[1060,90],[1060,330]],start:'left',end:'right',labelAt:[1065,225]}),e('remote','evidence','已处理',{via:[[395,440],[795,440],[795,330]],start:'bottom',end:'left',labelAt:[640,430]}),e('remote','change','需上门'),e('evidence','submit','材料齐备'),e('submit','review')]
    },
    {
      id:'review',number:'06',nav:'完工审核与回访',title:'通过即办结，退回则提交新版本',
      subtitle:'人工与自动审核共用固定门禁，回访与消费者评价在办结后独立办理。',
      source:src('06-完工审核与回访关闭'),basis:[['完工智能与 AI 审核','../../specs/2026-10-01-完工智能与AI审核.md'],['收费单现行办结门禁',feesSpec+'#stage-3-receipts-gate']],boundary:'收费单按后续确认契约：人工核对、净实收等于应收后才可办结，不开放后付办结。',
      notes:['策略由总部维护；人工审核由已获授权客服岗办理，服务站配合补资料。','自动执行且固定规则与适用证据全部通过才办结；疑点、抽检、失败或观察模式转人工。','单工单至多一条抽样回访任务；未接通按任务规则记录，不伪造满意度，不改原工单状态。'],
      takeaways:[['所有通过都经过固定门禁', '审核绑定当前提交版本；有收费或费用风险转人工核对，未同意、争议或未收齐均不能通过。'],['回访不是二次交单', '审核通过直接 CLOSED；抽样回访、消费者评价与后续投诉分别留痕，师傅无需再次交单。']],
      nodes:[n('version',130,90,'核对当前版本|与固定门禁','系统'),n('risk',395,90,'有收费或|费用风险','', 'decision'),n('mode',660,90,'总部审核策略','', 'decision'),n('auto',925,90,'固定规则／AI|核对适用证据','系统'),n('closed',1190,90,'审核通过|直接已办结','系统','handoff'),n('human',660,330,'人工审核|收费同时核对','授权客服','step','核对当前报价、客户同意、提交绑定及收款；净实收须等于应收，超收待退也不可通过。'),n('back',395,330,'记录退回原因|补充新版本','阶段 05','exception','','fulfillment'),n('follow',1190,330,'独立抽样回访|消费者自发评价','客服／消费者','handoff'),n('exception',1190,520,'未解决或投诉|关联原服务跟进','阶段 07','exception','','exceptions')],
      edges:[e('version','risk'),e('risk','mode','无'),e('risk','human','有',{via:[[395,220],[660,220]],start:'bottom',end:'top',labelAt:[528,210]}),e('mode','auto','智能／AI'),e('mode','human','人工'),e('auto','closed','自动执行且全通过'),e('auto','human','疑点／失败／观察',{via:[[925,330]],start:'bottom',end:'right',labelAt:[870,310]}),e('human','closed','通过／费用已收齐核对',{via:[[1060,330],[1060,180],[1320,180],[1320,90]],start:'right',end:'right',labelAt:[1190,170]}),e('human','back','退回'),e('back','version','重提新版本',{via:[[130,330]],start:'left',end:'bottom',labelAt:[250,310]}),e('closed','follow','独立办理',{conditional:true}),e('follow','exception','需要跟进')]
    },
    {
      id:'exceptions',number:'07',nav:'异常与再次服务',title:'每种异常，都有责任人和下一步',
      subtitle:'保留原记录与处理历史，区分继续履约、本次取消和新的服务需求。',
      source:src('07-异常取消与再次服务'),basis:[['已确认的两级退回条件',returnSpec]],boundary:'复开是待确认方向，不表达为已开放动作；取消与正常办结分别处理。',
      notes:['异常不能变成任意改状态的入口；授权人员需校验当前阶段、资源、已有安排及允许动作。','取消须按权限检查预约占用、排班、配件和适用费用影响，保留终止原因；不等于履约完成。','原图“允许复开”是条件讨论方向，当前展示为待确认，不默认已办结或已取消工单都可恢复。'],
      takeaways:[['回到合适阶段，保留原单历史', '缺资料／审核退回回原环节；改期、缺件、断联跟进条件；拒单、改派或转站回重新安排。'],['投诉、再次服务和退款各自办理', '新需求另建并关联产品历史；投诉不自动改原终态，取消或投诉也不自动退款。']],
      nodes:[n('record',130,90,'记录异常|阶段与证据','发现方'),n('authorized',395,90,'校验权限|判断允许动作','授权人员'),n('route',660,90,'本次处理去向','', 'decision'),n('supplement',925,90,'补资料或|完工退回重提','阶段 03／05','handoff','','fulfillment'),n('wait',660,310,'改期、缺件、断联|条件具备再继续','负责跟进人员','exception'),n('reassign',395,310,'拒单、改派、转站|重新安排并留痕','阶段 04','handoff','','dispatch'),n('cancel',130,310,'本次终止|核对取消影响','授权岗位','exception'),n('after',925,310,'投诉或再次服务|关联原工单与产品','授权人员'),n('new',1190,310,'独立新需求|新建服务记录','阶段 02','handoff','','application'),n('case',925,520,'投诉独立跟进|保留原终态','授权岗位','handoff'),n('reopen',660,520,'复开原工单|须另行确认规则','待确认方向','exception pending','须明确授权、理由、目标阶段及资源复核；本图不开放原单复开。')],
      edges:[e('record','authorized'),e('authorized','route'),e('route','supplement','补资料／退回'),e('route','wait','需跟进'),e('route','reassign','重安排',{via:[[530,90],[530,310]],start:'left',end:'right',labelAt:[533,220]}),e('route','cancel','终止',{via:[[660,200],[130,200]],start:'bottom',end:'top',labelAt:[330,190]}),e('route','after','投诉／再次服务',{via:[[795,90],[795,310]],start:'right',end:'left',labelAt:[798,220]}),e('after','new','新需求'),e('after','case','投诉'),e('after','reopen','仅为条件讨论',{conditional:true,via:[[925,430],[660,430]],start:'bottom',end:'top',labelAt:[790,420]})]
    },
    {
      id:'fees',number:'08',nav:'费用与线下收款',title:'免费沿原流程，收费先同意再执行',
      subtitle:'跨建单、预约、履约与审核的条件专题；共用同一工单，不是必经的第八阶段。',
      source:src('08-费用确认与线下收款'),basis:[['后续已确认的首期决定',feesSpec+'#13-长任务启动与首版最小决定2026-10-03'],['完整接入与最终边界',feesSpec+'#offline-fees-delivery']],boundary:'采用后续确认规则修正早期示意：未收齐不办结、不支持后付办结；正式收费标准由配置维护。',
      notes:['工单保存本单收费模式与规则版本；开关变化不静默改写旧单。默认免费或本单全免费没有新增报价、确认、收款必办动作。','已知上门／检测费须在发生前取得同意；维修报价按检测结果形成。增项或增加金额先重新同意，再执行新增内容。','客户口头同意由人员记录，关联当前报价版本；消费者只读，不新增线上确认或线上支付。服务结果确认不能替代费用同意。','收费配件严格使用后台零售价；减免、改价、退款及纠错需独立授权，保留原报价和收款事实。实际耗用与费用联动，但收款和审核不重复扣库。'],
      takeaways:[['报价、同意、执行使用同一版本', '拒绝则停止未执行的收费项目，已确认并发生的费用保留；增项或加价需重新同意。'],['收款独立登记，办结有门禁', '未收／部分收款可如实登记并提交完工；收费单必须人工核对，净实收等于应收后才能办结。']],
      nodes:[n('policy',130,90,'新建工单|保存收费政策','系统'),n('charge',395,90,'本单是否|有收费项目','', 'decision'),n('quote',660,90,'形成逐项报价|关联价格依据','服务人员'),n('accept',925,90,'客户同意|当前报价','', 'decision'),n('execute',1190,90,'增项重确认后|执行收费项目','服务人员'),n('free',395,330,'全免费沿原链|无新增费用操作','既有派单／履约／审核','handoff'),n('reject',925,330,'停止未执行项目|异常费用按规则跟进','阶段 07','exception','','exceptions'),n('change',1190,330,'新增项目或|增加金额','', 'decision'),n('final',1190,520,'核对最终明细|关联完工版本','服务人员'),n('receipt',925,520,'登记线下收款|保留实际事实','人员／获权岗位','step','服务完成后记录现金或线下转账，可分次登记，未收／部分收款如实展示；不支持预收或消费者线上支付。'),n('human',660,520,'原审核中人工核对|同意、费用与收款','授权客服','step','净实收等于应收、当前费用已核对且同意有效才能通过；收费／风险不能自动审核办结。'),n('closed',395,520,'条件全部满足|审核通过办结','系统','handoff')],
      edges:[e('policy','charge'),e('charge','free','无／默认免费'),e('charge','quote','有'),e('quote','accept'),e('accept','execute','同意'),e('accept','reject','拒绝'),e('execute','change'),e('change','quote','有：重新报价确认',{via:[[1320,330],[1320,15],[660,15]],start:'right',end:'top',labelAt:[1170,22]}),e('change','final','无'),e('final','receipt','实际收款独立登记'),e('receipt','human','收齐后核对'),e('human','closed','全部满足'),e('human','receipt','未收齐／未核对',{via:[[660,420],[925,420]],start:'top',end:'top',labelAt:[792,410]}),e('free','closed','原流程审核通过')]
    }
  ];
})();
