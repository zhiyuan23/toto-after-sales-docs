'use strict';
// Local prototype only: no authentication, SMS, storage or business API.
(() => {
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mask = value => String(value).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  const initial = () => ({userName:'陈女士',phone:'13800000026',region:'示例省 / 示例市 / 示例区',address:'样板路88号1栋101室（虚构）',serviceNotice:true,avatar:'',interests:[],contentPreferences:[],preferencesSaved:false});
  let profile = initial(), draft = {...profile}, changing = false, phoneStep = 'old', oldSent = false, newSentTo = '', phoneDraft = {}, expanded = new Set();
  const interestOptions = [['smart-toilet','智能一体型座便器'],['washlet','智能座便盖'],['toilet','普通座便器'],['faucet-shower','龙头与淋浴'],['bathtub','浴缸'],['bathroom-heater','浴室暖风设备'],['bathroom-space','整体卫浴']];
  const contentOptions = [['usage','使用技巧'],['care','清洁保养'],['new-products','新品介绍'],['offers','优惠活动'],['upgrade','换新与升级'],['brand','品牌资讯']];
  let preferenceDraft = {interests:[],contentPreferences:[]};
  let avatarVersion=0, avatarPending=false, avatarError='';
  const owns = id => ['c-profile','c-preferences','c-purchases'].includes(id);
  const avatarMarkup = value => `<img class="c-avatar" src="${e(value || 'assets/icons/default-avatar.svg')}" alt="${value?'个人头像':'默认头像'}">`;
  const preferenceSummary = () => profile.interests.length || profile.contentPreferences.length ? `关注 ${profile.interests.length} 类产品 · ${profile.contentPreferences.length} 类内容` : profile.preferencesSaved ? '暂未选择偏好' : '选填 · 关注的产品与内容';
  const read = root => Object.fromEntries([...root.querySelectorAll('input,select,textarea')].filter(el => el.name).map(el => [el.name,el.type==='checkbox'?el.checked:el.value]));
  const saveDraft = root => {
    const values=read(root);
    if ('userName' in values) draft={...draft,...values};
    if ('interests' in values || 'contentPreferences' in values) {
      const fields=[...root.querySelectorAll('input,select,textarea')];
      for (const [name,options] of [['interests',interestOptions],['contentPreferences',contentOptions]]) {
        preferenceDraft[name]=options.map(([id])=>id).filter(id=>fields.some(el=>el.name===name && el.value===id && el.checked));
      }
    }
    if ('oldCode' in values || 'newPhone' in values) phoneDraft={...phoneDraft,...values};
  };
  const phoneEditor = () => `<section class="c-phone-editor" aria-label="更换手机号"><div class="c-section-heading"><h3>${phoneStep==='old'?'1 / 2 · 验证原手机号':'2 / 2 · 验证新手机号'}</h3><button type="button" class="c-text-button" data-account="cancel-phone">取消更换</button></div>${phoneStep==='old'?`<p class="c-hint">先验证当前号码 ${e(mask(profile.phone))}，保障您的账户安全。</p><form id="c-phone-form" data-account-form="phone"><label class="field"><span>原手机号验证码</span><input name="oldCode" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="请输入 6 位验证码" value="${e(phoneDraft.oldCode || '')}" required></label><button type="button" class="c-text-button" data-account="send-old">${oldSent?'重新获取演示验证码':'获取演示验证码'}</button>${oldSent?'<p class="c-hint" role="status">本次演示验证码：123456，未发送短信。</p>':''}<button class="secondary" type="submit">验证并继续</button><button type="button" class="c-text-button" data-go="c-code-help">原号码无法接收，联系协助 ›</button></form>`:`<form id="c-phone-form" data-account-form="phone"><label class="field"><span>新手机号</span><input name="newPhone" type="tel" inputmode="numeric" maxlength="11" pattern="1[0-9]{10}" placeholder="请输入新手机号" value="${e(phoneDraft.newPhone || '')}" required></label><label class="field"><span>新手机号验证码</span><input name="newCode" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="请输入 6 位验证码" value="${e(phoneDraft.newCode || '')}" required></label><button type="button" class="c-text-button" data-account="send-new">${newSentTo?'重新获取演示验证码':'获取演示验证码'}</button>${newSentTo?`<p class="c-hint" role="status">${e(mask(newSentTo))} 的演示验证码：654321，未发送短信。</p>`:''}<button class="secondary" type="submit">确认更换手机号</button></form>`}</section>`;
  const avatarEditor = () => `<section class="c-avatar-editor" aria-label="个人头像"><button type="button" class="c-avatar-row" data-account="choose-avatar" aria-label="更换头像"><span>头像</span><span class="c-avatar-value">${avatarMarkup(draft.avatar)}<span class="c-avatar-arrow" aria-hidden="true">›</span></span></button><input type="file" id="c-avatar-file" accept="image/jpeg,image/png,image/webp" aria-label="选择头像图片" hidden>${avatarPending?'<p class="c-hint" role="status">正在读取头像…</p>':avatarError?`<p class="field-error" role="alert">${e(avatarError)}</p>`:''}</section>`;
  const preferenceGroup = (name,title,options) => `<fieldset class="c-preference-group"><legend>${title} <span>选填 · 可多选</span></legend><div class="c-preference-options">${options.map(([id,label])=>`<label class="c-preference-option"><input type="checkbox" name="${name}" value="${id}"${preferenceDraft[name].includes(id)?' checked':''}><span><span class="c-preference-check" aria-hidden="true">✓</span>${label}</span></label>`).join('')}</div></fieldset>`;
  const preferenceBody = () => `<p class="c-preferences-intro">选择感兴趣的产品和内容，也可以留空。</p><form id="c-preferences-form" data-account-form="preferences">${preferenceGroup('interests','关注的产品',interestOptions)}${preferenceGroup('contentPreferences','希望了解的内容',contentOptions)}<div class="c-preference-tools"><button type="button" class="c-text-button" data-account="clear-preferences">清空选择</button></div></form><p class="c-info-note">偏好仅用于了解您的兴趣，不会开启营销通知，也不会更改服务进度提醒。可随时修改或清空。</p>`;
  function changeAvatar(input, api) {
    if (input.id!=='c-avatar-file') return false;
    const file=input.files?.[0];
    if (!file) return true;
    saveDraft(api.root);
    input.value='';
    const version=++avatarVersion;
    const refresh=()=>{saveDraft(api.root);api.render();};
    const fail=message=>{if(version!==avatarVersion)return;avatarPending=false;avatarError=message;refresh();};
    avatarError='';avatarPending=false;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {fail('请选择 JPG、PNG 或 WebP 图片。');return true;}
    if (!file.size || file.size>5*1024*1024) {fail('图片为空或超过 5 MB，请重新选择。');return true;}
    avatarPending=true;api.render();
    const reader=new FileReader();
    reader.onerror=()=>fail('图片读取失败，请重新选择。');
    reader.onload=()=>{
      if(version!==avatarVersion)return;
      const preview=new Image();
      preview.onerror=()=>fail('无法识别这张图片，请选择其他图片。');
      preview.onload=()=>{
        if(version!==avatarVersion)return;
        draft.avatar=reader.result;avatarPending=false;refresh();
      };
      preview.src=reader.result;
    };
    reader.readAsDataURL(file);
    return true;
  }
  const profileBody = () => `<div class="c-account-phone"><div><span>当前绑定手机号</span><strong>${e(mask(profile.phone))}</strong></div><button type="button" class="c-text-button" data-account="change-phone" aria-expanded="${changing}">更换手机号 ›</button></div>${changing?phoneEditor():''}${avatarEditor()}<form id="c-profile-form" class="c-form c-profile-form" data-account-form="profile"><label class="field"><span>姓名 <em>必填</em></span><input name="userName" maxlength="30" value="${e(draft.userName)}" placeholder="请输入姓名" required></label><fieldset class="c-address-fields"><legend>常用地址 <span>选填</span></legend><label class="field"><span>所在地区</span><select name="region"><option value="">请选择地区</option><option value="示例省 / 示例市 / 示例区"${draft.region?' selected':''}>示例省 / 示例市 / 示例区</option></select></label><label class="field"><span>详细地址</span><input name="address" maxlength="200" value="${e(draft.address)}" placeholder="街道、门牌号等"></label></fieldset><label class="c-notice-preference"><span><strong>服务进度提醒</strong><small>希望收到服务安排与进度通知</small></span><input type="checkbox" role="switch" name="serviceNotice"${draft.serviceNotice?' checked':''} aria-label="服务进度提醒"></label><p class="c-hint">是否接收微信通知，以您每次的订阅授权为准。</p></form><button class="c-menu-row c-preference-entry" data-go="c-preferences"><span><strong>兴趣偏好</strong><small>${e(preferenceSummary())}</small></span><span aria-hidden="true">›</span></button><p class="c-info-note">修改常用资料不会更改已提交的购买信息和服务申请。</p>`;
  function records(ctx) {
    const groups=new Map();
    for (const product of ctx.hasProducts===false?[]:ctx.products || []) {
      const info=product.registration || {}, key=info.purchaseRecordId || product.id;
      if (!groups.has(key)) groups.set(key,{id:key,date:info.purchaseDate || '',store:info.storeName || '',existing:info.method==='existing-record',products:[]});
      groups.get(key).products.push(product);
    }
    return [...groups.values()].sort((a,b)=>b.date.localeCompare(a.date));
  }
  const empty = () => '<div class="c-account-empty"><span class="c-empty-mark" data-icon="service" aria-hidden="true"></span><h2>还没有购买记录</h2><p>登记您的 TOTO 产品，<br>把购买信息和后续服务留在一起。</p><button class="primary" data-go="c-register">登记产品</button><button class="c-text-button" data-go="c-code-help">已在门店登记，找不到记录？ ›</button></div>';
  const purchaseBody = ctx => {
    const list=records(ctx);
    if (!list.length) return empty();
    return `<p class="c-list-summary">共 ${list.length} 条记录 · ${list.reduce((sum,r)=>sum+r.products.length,0)} 件产品</p><div class="c-purchase-list">${list.map(record=>`<article class="c-purchase-card"><header><div><span>购买日期</span><h3>${e(record.date || '尚未填写')}</h3></div><span class="c-tag">${record.existing?'购买记录':'自行填写'}</span></header><p class="c-purchase-store">${e(record.store || '购买门店未提供')}</p>${record.products.map(p=>`<button class="c-record-product" data-product="${e(p.id)}" data-go="c-product"><img src="${e(p.image)}" alt="${e(p.name)}"><span><strong>${e(p.name)}</strong><small>${e(p.model)}</small></span><span class="c-record-quantity">1 件<span aria-hidden="true"> ›</span></span></button>`).join('')}<button class="c-record-expand" data-account="record" data-record-id="${e(record.id)}" aria-expanded="${expanded.has(record.id)}" aria-controls="purchase-${e(record.id)}"><span>安装码与记录信息</span><span aria-hidden="true">${expanded.has(record.id)?'收起 −':'查看 +'}</span></button>${expanded.has(record.id)?`<div id="purchase-${e(record.id)}" class="c-record-details"><p>${record.existing?'来源：已有购买登记（示例）':'来源：消费者自行填写，购买情况尚未核实'}</p>${record.products.map(p=>`<div><strong>${e(p.name)} · ${e(p.room)}</strong>${p.installationCodeLinked===true && p.installationCode?`<span class="c-record-code">${e(p.installationCode)}</span><button class="c-text-button" data-action="演示复制：${e(p.installationCode)}。未写入系统剪贴板。">复制安装码</button>`:'<span class="c-record-code c-secondary-text">暂无关联安装码</span>'}</div>`).join('')}<p>安装码供门店或客服查询记录；服务安排与权益需另行确认。</p></div>`:''}</article>`).join('')}</div><p class="c-hint">仅展示本人或已授权的记录。自行填写的购买信息不代表已经核验。</p><button class="c-menu-row" data-go="c-code-help"><span>记录有疑问？联系门店或客服</span><span aria-hidden="true">›</span></button>`;
  };
  function handle(el, api) {
    const action=el.dataset.account;
    if (!action) return false;
    saveDraft(api.root);
    if (action==='choose-avatar') {api.root.querySelector('#c-avatar-file')?.click();}
    else if (action==='clear-preferences') {preferenceDraft={interests:[],contentPreferences:[]};api.render();}
    else if (action==='change-phone' || action==='cancel-phone') {
      changing=action==='change-phone'; phoneStep='old';oldSent=false;newSentTo='';phoneDraft={};api.render();
    } else if (action==='send-old') {oldSent=true;api.render();}
    else if (action==='send-new') {
      const number=String(phoneDraft.newPhone || '').trim();
      if (!/^1[0-9]{10}$/.test(number) || number===profile.phone) {api.showToast('请填写有效且不同于当前号码的新手机号。');return true;}
      newSentTo=number;phoneDraft.newCode='';api.render();
    } else if (action==='record') {
      const id=el.dataset.recordId;
      if (!records(api.context).some(record=>record.id===id)) return true;
      expanded.has(id)?expanded.delete(id):expanded.add(id);api.render();
    }
    return true;
  }
  function submit(form, api) {
    if (!form.matches('form[data-account-form]')) return false;
    if (!form.checkValidity()) return true;
    saveDraft(api.root);
    if (form.id==='c-preferences-form') {
      profile={...profile,interests:[...preferenceDraft.interests],contentPreferences:[...preferenceDraft.contentPreferences],preferencesSaved:true};
      api.render();api.showToast('兴趣偏好已保存到本次演示。');
    } else if (form.id==='c-profile-form') {
      if (avatarPending) {api.showToast('头像正在读取，请稍后保存。');return true;}
      if (!String(draft.userName).trim()) {api.showToast('请填写姓名，不能只输入空格。');return true;}
      if (Boolean(draft.region)!==Boolean(String(draft.address).trim())) {api.showToast('请同时填写地区和详细地址，或将常用地址全部留空。');return true;}
      profile={...profile,userName:String(draft.userName).trim(),region:draft.region,address:String(draft.address).trim(),serviceNotice:draft.serviceNotice,avatar:draft.avatar};
      draft={...profile};api.render();api.showToast('个人信息已保存到本次演示。');
    } else if (form.id==='c-phone-form' && changing) {
      if (phoneStep==='old') {
        if (!oldSent || phoneDraft.oldCode!=='123456') {api.showToast('请获取演示验证码，并输入正确的原手机号验证码。');return true;}
        phoneStep='new';phoneDraft={};api.render();
      } else {
        if (!newSentTo || phoneDraft.newPhone!==newSentTo || phoneDraft.newCode!=='654321') {api.showToast('请为当前新号码获取演示验证码，并填写正确的验证码。');return true;}
        profile.phone=newSentTo;draft.phone=newSentTo;changing=false;phoneStep='old';oldSent=false;newSentTo='';phoneDraft={};api.render();api.showToast('手机号已在本次演示中更换，未变更真实账户。');
      }
    }
    return true;
  }
  window.TOTO_ACCOUNT={owns,saveDraft,handle,submit,changeAvatar,avatarMarkup,empty,records,profile:()=>({...profile,interests:[...profile.interests],contentPreferences:[...profile.contentPreferences]}),reset:()=>{++avatarVersion;avatarPending=false;avatarError='';preferenceDraft={interests:[],contentPreferences:[]};profile=initial();draft={...profile};changing=false;phoneStep='old';oldSent=false;newSentTo='';phoneDraft={};expanded.clear();}};
  const screens=window.TOTO_SCREENS.consumer.screens;
  screens.splice(screens.findIndex(s=>s.id==='c-mine')+1,0,
    {id:'c-profile',title:'个人信息',entry:'C13 · 个人信息、地址及偏好',parent:'c-mine',goal:'手机号优先展示；头像为可点击资料行，姓名与地址恢复上下式标签和输入框。资料同页保存，兴趣偏好独立编辑。',note:'CAPP-010 设计草案。正式小程序使用微信原生头像选择及上传能力；本原型仅用本地选图演示，页面不展示格式、选填或默认头像说明。头像只在浏览器内读取与预览，保存后同步“我的”；不上传服务器，刷新或重置清除。选图失败保留原头像，可重新选择。原号与新号分步验证仅为交互建议，演示码分别为 123456、654321；未接短信或真实账号。通知开关只记录意愿，不代表微信订阅授权。普通返回保留未保存草稿，保存后更新“我的”；不改写产品登记或服务单。',body:profileBody,footer:'<button class="primary" type="submit" form="c-profile-form">保存个人信息</button>'},
    {id:'c-preferences',title:'兴趣偏好',entry:'C13 · 个人信息下的选填偏好',parent:'c-profile',goal:'自主选择关注品类和内容，全部可留空、取消或清空；独立保存，不打断资料编辑。',note:'用户确认的原型扩展，品类为展示候选，尚未映射正式商品分类。偏好默认未填写，保存空选择与未填写分开记录；不从购买记录自动勾选，不开启营销通知或修改服务提醒。普通返回保留草稿；真实会员画像、营销分群和推送未接入。',body:preferenceBody,footer:'<button class="primary" type="submit" form="c-preferences-form">保存兴趣偏好</button>'},
    {id:'c-purchases',title:'购买记录',entry:'C11 · 本人或已授权购买记录',parent:'c-mine',goal:'按购买记录汇总日期、门店和商品数量，直接查看产品，按需展开已有安装码。',note:'CAPP-012 设计草案。两件既有示例产品属于同一显式购买单；不按日期或姓名猜测合单。自行登记单独展示来源，门店缺失不补造，不生成或自动关联安装码。数量按本次登记的产品实例计；示例不证明真实授权、购买核验或服务权益。复制仅演示反馈。首次使用查看空态。',body:purchaseBody}
  );
})();
