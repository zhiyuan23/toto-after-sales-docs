'use strict';
// Local prototype only: no real WeChat authorization, storage or business API.
(() => {
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mask = value => String(value).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  const productImageAttrs = product => `class="c-product-image" data-image-background="${product?.imageBackgroundType === 'scene' ? 'scene' : 'solid'}"`;
  const initial = () => ({userName:'陈女士',phone:'13800000026',region:'示例省 / 示例市 / 示例区',address:'样板路88号1栋101室（虚构）',serviceNotice:true,avatar:'',interests:[],contentPreferences:[],preferencesSaved:false});
  let profile = initial(), draft = {...profile}, phoneAuthorization = '';
  const interestOptions = [['smart-toilet','智能一体型座便器'],['washlet','智能座便盖'],['toilet','普通座便器'],['faucet-shower','龙头与淋浴'],['bathtub','浴缸'],['bathroom-heater','浴室暖风设备'],['bathroom-space','整体卫浴']];
  const contentOptions = [['usage','使用技巧'],['care','清洁保养'],['new-products','新品介绍'],['offers','优惠活动'],['upgrade','换新与升级'],['brand','品牌资讯']];
  let preferenceDraft = {interests:[],contentPreferences:[]};
  let avatarVersion=0, avatarPending=false, avatarError='';
  const owns = id => ['c-profile','c-preferences','c-purchases'].includes(id);
  const avatarMarkup = value => `<img class="c-avatar" src="${e(value || 'assets/icons/default-avatar.svg')}" alt="${value?'个人头像':'默认头像'}">`;
  const preferenceSummary = () => profile.interests.length || profile.contentPreferences.length ? `关注 ${profile.interests.length} 类产品 · ${profile.contentPreferences.length} 类内容` : profile.preferencesSaved ? '暂未选择偏好' : '关注的产品与内容';
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
  };
  const authorizationOverlay = () => {
    if (!phoneAuthorization) return '';
    const profileChange=phoneAuthorization==='profile';
    return `<button class="c-account-backdrop" data-account="dismiss-phone-auth" tabindex="-1" aria-label="关闭微信手机号授权"></button><section class="c-wechat-dialog" role="dialog" aria-modal="true" aria-labelledby="wechat-phone-title" aria-describedby="wechat-phone-description"><span class="c-wechat-mark" aria-hidden="true">微信</span><h2 id="wechat-phone-title">${profileChange?'更换绑定手机号':'授权手机号'}</h2><p id="wechat-phone-description">${profileChange?'使用微信绑定的手机号更新账户资料。':'用于查找已接入的购买记录与产品。'}</p><div class="c-wechat-phone"><span>微信绑定号码</span><strong>${e(mask(profileChange?'13900000000':profile.phone))}</strong></div><div class="c-wechat-actions"><button type="button" data-account="dismiss-phone-auth">取消</button><button type="button" data-account="confirm-phone-auth">允许</button></div></section>`;
  };
  const avatarEditor = () => `<div class="c-avatar-editor" aria-label="个人头像"><button type="button" class="c-avatar-row" data-account="choose-avatar" aria-label="更换头像"><span>头像</span><span class="c-avatar-value">${avatarMarkup(draft.avatar)}<span class="c-avatar-arrow" aria-hidden="true">›</span></span></button><input type="file" id="c-avatar-file" accept="image/jpeg,image/png,image/webp" aria-label="选择头像图片" hidden>${avatarPending?'<p class="c-hint" role="status">正在读取头像…</p>':avatarError?`<p class="field-error" role="alert">${e(avatarError)}</p>`:''}</div>`;
  const preferenceGroup = (name,title,options) => `<fieldset class="c-preference-group"><legend>${title} <span>可多选</span></legend><div class="c-preference-options">${options.map(([id,label])=>`<label class="c-preference-option"><input type="checkbox" name="${name}" value="${id}"${preferenceDraft[name].includes(id)?' checked':''}><span><span class="c-preference-check" aria-hidden="true">✓</span>${label}</span></label>`).join('')}</div></fieldset>`;
  const preferenceBody = () => `<p class="c-preferences-intro">选择感兴趣的产品和内容，也可以留空。</p><form id="c-preferences-form" data-account-form="preferences">${preferenceGroup('interests','关注的产品',interestOptions)}${preferenceGroup('contentPreferences','希望了解的内容',contentOptions)}<div class="c-preference-tools"><button type="button" class="c-text-button" data-account="clear-preferences">清空选择</button></div></form>`;
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
        draft.avatar=reader.result;profile.avatar=reader.result;avatarPending=false;refresh();api.showToast('头像已更新到本次演示。');
      };
      preview.src=reader.result;
    };
    reader.readAsDataURL(file);
    return true;
  }
  const profileBody = () => `<div class="c-account-phone"><div><span>当前绑定手机号</span><strong>${e(mask(profile.phone))}</strong></div><button type="button" class="c-text-button" data-account="change-phone">更换手机号 ›</button></div><section id="c-profile-form" class="c-profile-form" aria-label="个人资料"><div class="c-profile-card c-profile-details">${avatarEditor()}<label class="c-profile-field-row"><span>姓名</span><input name="userName" maxlength="30" value="${e(draft.userName)}" placeholder="未填写"></label><label class="c-profile-field-row"><span>所在地区</span><select name="region"><option value="">未填写</option><option value="示例省 / 示例市 / 示例区"${draft.region?' selected':''}>示例省 / 示例市 / 示例区</option></select></label><label class="c-profile-field-row"><span>详细地址</span><input name="address" maxlength="200" value="${e(draft.address)}" placeholder="未填写"></label></div></section><button class="c-menu-row c-preference-entry" data-go="c-preferences"><span><strong>兴趣偏好</strong><small>${e(preferenceSummary())}</small></span><span aria-hidden="true">›</span></button>`;
  function updateProfileField(input, api) {
    const labels={userName:'姓名',region:'所在地区',address:'详细地址'};
    if (!Object.hasOwn(labels,input.name)) return false;
    const value=String(input.value || '').trim();
    draft={...draft,[input.name]:value};
    profile={...profile,[input.name]:value};
    api.showToast(`${labels[input.name]}已更新。`);
    return true;
  }
  function records(ctx) {
    const groups=new Map();
    for (const product of ctx.hasProducts===false?[]:ctx.products || []) {
      const info=product.registration || {}, key=info.purchaseRecordId || product.id;
      if (!info.purchaseRecordId && !info.purchaseDate) continue;
      if (!groups.has(key)) groups.set(key,{id:key,date:info.purchaseDate || '',store:info.storeName || '',source:info.method==='existing-record'?'手机号同步':info.method==='scan-credential'?'凭证码扫码':info.method==='scan-unique'?'实物码扫码':'用户申报',products:[]});
      groups.get(key).products.push(product);
    }
    return [...groups.values()].sort((a,b)=>b.date.localeCompare(a.date));
  }
  const empty = () => '<div class="c-account-empty"><span class="c-empty-mark" data-icon="service" aria-hidden="true"></span><h2>还没有购买记录</h2><p>授权微信手机号后，可同步已接入的购买产品。</p><button class="primary" data-phone-sync data-sync-target="purchases">授权并同步购买记录</button><button class="c-text-button" data-go="c-register">扫一扫添加其他产品 ›</button></div>';
  const purchaseBody = ctx => {
    const list=records(ctx);
    if (!list.length) return empty();
    return `<p class="c-list-summary">共 ${list.length} 条记录 · ${list.reduce((sum,r)=>sum+r.products.length,0)} 件产品</p><div class="c-purchase-list">${list.map(record=>`<article class="c-purchase-card"><header><div><span>购买日期</span><h3>${e(record.date || '尚未提供')}</h3><p class="c-purchase-store">${e(record.store || '购买门店未提供')}</p></div><span class="c-tag">${e(record.source)}</span></header><div class="c-purchase-products">${record.products.map(p=>`<button class="c-record-product" data-product="${e(p.id)}" data-go="c-product"><img ${productImageAttrs(p)} src="${e(p.image)}" alt="${e(p.name)}"><span><strong>${e(p.name)}</strong><small>${e(p.model)}</small></span><span class="c-record-quantity">1 件<span aria-hidden="true"> ›</span></span></button>`).join('')}</div></article>`).join('')}</div><button class="c-menu-row c-purchase-refresh" data-phone-sync data-sync-target="purchases"><span>同步购买记录</span><span aria-hidden="true">↻</span></button>`;
  };
  function handle(el, api) {
    const action=el.dataset.account;
    if (!action) return false;
    saveDraft(api.root);
    if (action==='choose-avatar') {api.root.querySelector('#c-avatar-file')?.click();}
    else if (action==='clear-preferences') {preferenceDraft={interests:[],contentPreferences:[]};api.render();}
    else if (action==='change-phone') {phoneAuthorization='profile';api.renderOverlay();}
    else if (action==='dismiss-phone-auth') {phoneAuthorization='';api.renderOverlay();}
    else if (action==='confirm-phone-auth') {
      const purpose=phoneAuthorization;phoneAuthorization='';
      if (purpose==='profile') {
        profile.phone='13900000000';draft.phone=profile.phone;api.render();api.showToast('手机号已通过微信授权更新。');
      } else if (purpose==='sync') api.authorizePhone();
      api.renderOverlay();
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
    }
    return true;
  }
  window.TOTO_ACCOUNT={owns,saveDraft,handle,submit,changeAvatar,updateProfileField,avatarMarkup,empty,records,overlay:authorizationOverlay,dismiss:()=>{if(!phoneAuthorization)return false;phoneAuthorization='';return true;},clearOverlay:()=>{phoneAuthorization='';},requestPhoneAuthorization:api=>{phoneAuthorization='sync';api.renderOverlay();},profile:()=>({...profile,interests:[...profile.interests],contentPreferences:[...profile.contentPreferences]}),reset:()=>{++avatarVersion;avatarPending=false;avatarError='';preferenceDraft={interests:[],contentPreferences:[]};profile=initial();draft={...profile};phoneAuthorization='';}};
  const screens=window.TOTO_SCREENS.consumer.screens;
  screens.splice(screens.findIndex(s=>s.id==='c-mine')+1,0,
    {id:'c-profile',title:'个人信息',entry:'C13 · 个人信息、地址及偏好',parent:'c-mine',goal:'手机号优先展示；头像、姓名和地址使用小程序常见的资料列表，每项修改后独立更新，兴趣偏好单独编辑。',note:'CAPP-010 设计草案。姓名、地区和地址均可留空，输入框失焦或选择变化后单项更新，不设置页面级保存。手机号通过微信原生授权能力获取。正式小程序使用微信原生头像选择及上传能力；本原型仅做本地演示，不访问真实微信数据。',body:profileBody,footer:''},
    {id:'c-preferences',title:'兴趣偏好',entry:'C13 · 个人信息下的兴趣偏好',parent:'c-profile',goal:'自主选择关注品类和内容，全部可留空、取消或清空；独立保存，不打断资料编辑。',note:'用户确认的原型扩展，品类为展示候选，尚未映射正式商品分类。偏好默认未填写，保存空选择与未填写分开记录；不从购买记录自动勾选，不开启营销通知或修改服务提醒。普通返回保留草稿；真实会员画像、营销分群和推送未接入。',body:preferenceBody,footer:'<button class="primary" type="submit" form="c-preferences-form">保存兴趣偏好</button>'},
    {id:'c-purchases',title:'购买记录',entry:'C11 · 自动同步与其他来源',parent:'c-mine',goal:'按购买事实汇总记录，卡片只保留日期、门店、来源和产品，同步操作在当前页直接刷新。',note:'CAPP-012 设计草案。购买记录不再设来源详情展开层；点击产品进入产品资料，同步按钮直接请求刷新，首次使用时先调起微信手机号授权。',body:purchaseBody}
  );
})();
