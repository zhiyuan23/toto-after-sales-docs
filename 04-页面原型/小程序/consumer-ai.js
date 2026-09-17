'use strict';
// Local prototype only: fixed knowledge simulates reviewed knowledge and existing service flows.
(() => {
  const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const mask = value => String(value || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  const productImageAttrs = product => `class="c-product-image" data-image-background="${product?.imageBackgroundType === 'scene' ? 'scene' : 'solid'}"`;
  const fresh = () => ({stage:'asking',productId:'',issue:'',answer:null,summary:null,summaryCopied:false});
  const knowledge = {
    safe:{id:'KB-CES8G820GCN-SAFE-02',title:'智能坐便器异常风险安全处置',version:'第 2 版',publishedAt:'2026-09-10'},
    wash:{id:'KB-CES8G820GCN-WASH-07',title:'智能坐便器喷嘴不伸出安全检查',version:'第 3 版',publishedAt:'2026-09-10'},
    power:{id:'KB-CES8G820GCN-POWER-04',title:'智能坐便器冲洗无响应基础检查',version:'第 2 版',publishedAt:'2026-09-10'},
  };
  let state=fresh(), questionDraft='';
  const owns = id => ['c-ai-assistant','c-ai-handoff'].includes(id);
  const selectedProduct = ctx => {
    const products=ctx.products || [];
    if (ctx.hasProducts===false || !products.length) return null;
    return products.find(product=>product.id===state.productId) || products[0];
  };
  const productCard = product => product ? `<article class="c-ai-product"><img ${productImageAttrs(product)} src="${e(product.image)}" alt="${e(product.name)}"><div><span>正在咨询的产品</span><strong>${e(product.name)}</strong><small>${e(product.model)} · ${e(product.room || '使用位置未填写')}</small></div></article>` : '';
  const productChooser = ctx => (ctx.products || []).length > 1 ? `<div class="c-ai-product-switch" aria-label="选择需要咨询的产品">${ctx.products.map(product=>`<button data-ai="product" data-value="${e(product.id)}" aria-pressed="${product.id===selectedProduct(ctx)?.id}">${e(product.name)}</button>`).join('')}</div>` : '';
  const knowledgeFor = (issue,product) => {
    const text=String(issue || '').trim();
    if (product?.model!=='CES8G820GCN') return {
      kind:'no-match',title:'暂未找到适用的处理指引',lead:'为了避免给出不准确的建议，我不会套用其他型号的维修知识。可以直接联系人工客服，或先整理问题并带入维修申请。',steps:[],source:null};
    if (/漏水|渗水|异常发热|焦味|冒烟/.test(text)) return {
      kind:'safety',title:'请先停止使用并隔离风险',lead:'这类现象不建议继续自行排查。完成安全处置后，请直接联系人工客服确认下一步。',
      steps:['关闭产品电源；有明显漏水时同时关闭进水阀','不要拆卸机身、电源或进水部件','保留现象照片，等待客服或服务人员确认'],source:knowledge.safe};
    if (/喷嘴|洗净|伸出|出水/.test(text)) return {
      kind:'guide',title:'先做 3 项不拆机检查',lead:'结合您的产品型号，这类现象通常可以先从供电、供水和喷嘴清洁状态排查。',
      steps:['确认电源指示正常，断电 30 秒后再重新接通','确认进水阀已打开，家中其他用水点水压正常','按使用指引运行喷嘴清洁，不要强行拉动喷嘴'],source:knowledge.wash};
    if (/冲洗|冲水|无反应|不启动|按键/.test(text)) return {
      kind:'guide',title:'先排除电源与操作锁定',lead:'当冲洗或按键暂时无响应时，可以先完成一轮安全复位。',
      steps:['确认插座、电源指示和遥控器电量正常','断电 30 秒后重启，等待自检完成再操作','记录面板提示或指示灯状态，若仍无反应则继续服务'],source:knowledge.power};
    return {kind:'no-match',title:'暂未找到完全匹配的指引',lead:'为了避免猜测，我先保留您的原始描述。您可以补充具体现象、直接联系人工客服，或带入维修申请。',steps:[],source:null};
  };
  const ask = (issue,ctx) => {
    const value=String(issue || '').trim(),product=selectedProduct(ctx);
    if (!value || !product) return false;
    state.issue=value;questionDraft=value;state.answer=knowledgeFor(value,product);state.stage='answered';state.summary=null;state.summaryCopied=false;return true;
  };
  const buildSummary = ctx => {
    const product=selectedProduct(ctx),answer=state.answer || knowledgeFor(state.issue,product);
    state.summary={productId:product?.id || '',productName:product?.name || '未知产品',model:product?.model || '',issue:state.issue,
      request:answer.kind==='safety'?'希望尽快联系人工确认安全风险并安排后续服务':'希望继续联系人工或申请维修服务',
      tried:answer.steps.length?answer.steps.join('；'):'未执行自助操作',observation:answer.kind==='safety'?'需尽快由人工确认安全风险':answer.kind==='no-match'?'没有适用当前品番的已发布指引':'按建议操作后仍未解决',
      knowledgeId:answer.source?.id || '',knowledgeTitle:answer.source?.title || ''};
    return state.summary;
  };
  const summaryText = summary => [
    `产品：${summary.productName}${summary.model?`（${summary.model}）`:''}`,
    `用户问题：${summary.issue}`,
    `希望获得的帮助：${summary.request}`,
    `已建议检查：${summary.tried}`,
    `当前结论：${summary.observation}`,
    summary.knowledgeId?`参考知识：${summary.knowledgeTitle || summary.knowledgeId}（${summary.knowledgeId}）`:''
  ].filter(Boolean).join('\n');
  const summaryCard = summary => summary ? `<section class="c-ai-summary"><div class="c-ai-section-title"><span>AI 已整理</span><strong>可修改后继续</strong></div><dl><div><dt>产品</dt><dd>${e(summary.productName)}<small>${e(summary.model)}</small></dd></div><div class="is-editable"><dt><label for="c-ai-summary-issue">用户问题</label></dt><dd><textarea id="c-ai-summary-issue" name="summaryIssue" maxlength="500">${e(summary.issue)}</textarea></dd></div><div class="is-editable"><dt><label for="c-ai-summary-request">希望获得的帮助</label></dt><dd><textarea id="c-ai-summary-request" name="summaryRequest" maxlength="300">${e(summary.request)}</textarea></dd></div><div><dt>已建议检查</dt><dd>${e(summary.tried)}</dd></div><div><dt>当前结论</dt><dd>${e(summary.observation)}</dd></div>${summary.knowledgeId?`<div><dt>知识依据</dt><dd>${e(summary.knowledgeTitle || summary.knowledgeId)}<small>${e(summary.knowledgeId)}</small></dd></div>`:''}</dl></section>` : '';
  const noProductView = () => `<header class="c-ai-heading"><span class="c-ai-logo" aria-hidden="true">AI</span><div><p>智能售后助手</p><h2>先找到需要帮助的产品</h2></div></header><section class="c-ai-no-product"><h3>还没有可咨询的产品</h3><p>同步购买记录或手动添加产品后，助手才能按准确品番检索适用知识。您也可以直接联系人工客服。</p><button class="primary" data-phone-sync data-sync-target="products">微信授权并同步产品</button><button class="secondary" data-go="c-register">手动添加产品</button><button class="c-text-button" data-ai="contact-human">直接联系人工客服 ›</button></section>`;
  const questionView = ctx => {
    const product=selectedProduct(ctx);
    const prompts=product?.model==='CES8G820GCN' ? '<div class="c-ai-prompts" aria-label="当前产品的常见问题"><button data-ai="quick" data-value="喷嘴无法伸出或出水">喷嘴无法伸出</button><button data-ai="quick" data-value="冲洗功能按下后无反应">冲洗功能无反应</button><button data-ai="quick" data-value="产品底部出现漏水">产品出现漏水</button></div>' : '<p class="c-ai-knowledge-empty">当前产品暂无已发布的自助指引。您仍可描述问题，助手会整理为维修申请内容。</p>';
    return `<header class="c-ai-heading"><span class="c-ai-logo" aria-hidden="true">AI</span><div><p>智能售后助手</p><h2>请说说遇到的问题</h2></div></header>${productCard(product)}${productChooser(ctx)}<div class="c-ai-message is-assistant"><span>AI</span><p>我会先检索 <strong>${e(product?.model || '当前产品')}</strong> 已发布的服务知识。没有适用内容时不会生成维修建议。</p></div>${prompts}<form id="c-ai-question-form" class="c-ai-question"><label for="c-ai-question">描述问题</label><textarea id="c-ai-question" name="question" maxlength="500" placeholder="例如：冲洗功能偶尔无法启动">${e(questionDraft)}</textarea><p>请勿输入证件号、银行卡等敏感信息。</p></form><button class="c-ai-direct-contact" data-ai="contact-human"><span>不使用智能建议</span><strong>直接联系人工客服</strong><i aria-hidden="true">›</i></button>`;
  };
  const answerView = ctx => {
    const product=selectedProduct(ctx),answer=state.answer;
    const steps=answer.steps.length?`<ol>${answer.steps.map(step=>`<li>${e(step)}</li>`).join('')}</ol>`:'';
    const source=answer.source?`<small class="c-ai-source"><strong>知识依据</strong>${e(answer.source.title)} · ${e(answer.source.version)} · ${e(answer.source.publishedAt)}<span>${e(answer.source.id)}</span></small>`:'';
    return `${productCard(product)}<div class="c-ai-thread"><div class="c-ai-message is-user"><p>${e(state.issue)}</p></div><div class="c-ai-message is-assistant${answer.kind==='safety'?' is-safety':answer.kind==='no-match'?' is-empty':''}"><span>AI</span><div><strong>${e(answer.title)}</strong><p>${e(answer.lead)}</p>${steps}${source}</div></div></div><button class="c-ai-direct-contact" data-ai="contact-human"><span>${['safety','no-match'].includes(answer.kind)?'这类问题建议人工确认':'也可以跳过后续步骤'}</span><strong>直接联系人工客服</strong><i aria-hidden="true">›</i></button><p class="c-ai-boundary">只展示适用当前品番且已发布的知识。建议不代表保修、费用或上门资格已确认。</p>`;
  };
  const resolvedView = ctx => `${productCard(selectedProduct(ctx))}<section class="c-ai-finished"><span aria-hidden="true">✓</span><h2>本次问题已解决</h2><p>对话已结束，没有创建服务单，也没有转接人工客服。</p><button class="c-text-button" data-ai="restart">咨询其他问题 ›</button></section>`;
  const assistantBody = ctx => state.stage==='no-product' ? noProductView() : state.stage==='resolved' ? resolvedView(ctx) : state.stage==='answered' ? answerView(ctx) : questionView(ctx);
  const assistantFooter = () => {
    if (state.stage==='no-product') return '';
    if (state.stage==='resolved') return '<button class="primary" data-go="c-home">回到首页</button>';
    if (state.stage==='answered') return ['safety','no-match'].includes(state.answer?.kind) ? '<button class="secondary" data-ai="contact-human">联系人工客服</button><button class="primary" data-ai="unresolved">整理信息，继续处理</button>' : '<button class="secondary" data-ai="resolved">已经解决</button><button class="primary" data-ai="unresolved">还没解决</button>';
    return '<button class="primary" type="submit" form="c-ai-question-form">获取处理建议</button>';
  };
  const handoffBody = ctx => {
    if (!state.summary) return '<section class="c-ai-finished"><h2>还没有可以接续的对话</h2><p>请先告诉 AI 助手遇到的问题。</p></section>';
    const profile=ctx.profile || {};
    return `<header class="c-page-heading"><p class="c-kicker">一轮建议后仍未解决</p><h2>核对并继续服务</h2><p>助手已整理本次问题。请先修改不准确的内容，再选择维修申请或人工客服。</p></header>${summaryCard(state.summary)}<section class="c-ai-contact"><span>常用联系资料</span><strong>${e(profile.userName || 'TOTO 用户')} · ${e(mask(profile.phone))}</strong><p>${e([profile.region,profile.address].filter(Boolean).join(' ') || '尚未填写常用地址')}</p><button class="c-text-button" data-go="c-profile">修改常用资料 ›</button></section><p class="c-ai-boundary">维修申请仍需您核对联系人、地址和期望时间后提交。联系人工会先复制摘要，再进入电话客服／微信在线客服选择页；不会显示虚假的“已转人工”。</p>`;
  };
  const handoffFooter = () => {
    if (!state.summary) return '<button class="primary" data-go="c-ai-assistant">返回 AI 助手</button>';
    return '<button class="secondary" data-ai="copy-summary">复制摘要并联系客服</button><button class="primary" data-ai="continue-request">带入维修申请</button>';
  };
  const statusView = (kind,ctx) => {
    const product=selectedProduct(ctx);
    if (kind==='loading') return `${productCard(product)}<section class="c-ai-status" aria-live="polite"><span class="c-ai-status-spinner" aria-hidden="true"></span><h2>正在查询适用知识</h2><p>只会检索当前产品品番可用的已发布内容，请稍候。</p><button class="c-text-button" data-ai="contact-human">等待较久？直接联系人工客服 ›</button></section>`;
    return `${productCard(product)}<section class="c-ai-status is-error"><span aria-hidden="true">!</span><h2>智能服务暂时不可用</h2><p>您已填写的内容仍保留。可以重试，或直接申请维修、联系人工客服。</p><button class="secondary" data-retry>重新查询</button><button class="primary" data-ai="contact-human">联系人工客服</button></section>`;
  };
  function saveDraft(root) {
    const fields=[...root.querySelectorAll('input,select,textarea')];
    const question=fields.find(input=>input.name==='question');
    if (question) questionDraft=question.value;
    const issue=fields.find(input=>input.name==='summaryIssue'),request=fields.find(input=>input.name==='summaryRequest');
    if (state.summary && issue) state.summary.issue=String(issue.value || '').trim() || state.summary.issue;
    if (state.summary && request) state.summary.request=String(request.value || '').trim() || state.summary.request;
  }
  const contactHuman = api => {
    saveDraft(api.root);
    if (state.issue && selectedProduct(api.context) && !state.summary) buildSummary(api.context);
    const text=state.summary?summaryText(state.summary):'';
    state.summaryCopied=Boolean(text);
    api.openCustomerService({source:'assistant',summaryText:text});
  };
  function handle(el,api) {
    const action=el.dataset.ai;
    if (!action) return false;
    if (action==='start') {
      state=fresh();state.productId=api.context.hasProducts===false?'':api.context.product?.id || '';state.stage=api.context.hasProducts===false?'no-product':'asking';questionDraft='';api.showScreen('c-ai-assistant');
    } else if (action==='product') {
      if (!(api.context.products || []).some(product=>product.id===el.dataset.value)) return true;
      state={...fresh(),productId:el.dataset.value};questionDraft='';api.selectProduct(el.dataset.value);api.render();
    } else if (action==='quick') {
      ask(el.dataset.value,api.context);api.render();
    } else if (action==='resolved') {
      state.stage='resolved';api.render();
    } else if (action==='unresolved') {
      buildSummary(api.context);state.stage='handoff';api.showScreen('c-ai-handoff');
    } else if (action==='restart') {
      const productId=state.productId;state=fresh();state.productId=productId;questionDraft='';api.render();
    } else if (action==='copy-summary' || action==='contact-human') {
      contactHuman(api);
    } else if (action==='continue-request') {
      saveDraft(api.root);
      const result=api.prepareRequest(state.summary);
      if (result.existing) {api.showScreen('c-service');api.showToast('这件产品已有进行中的服务，请先查看进度或联系客服。');}
      else {state.stage='prepared';api.showScreen('c-repair');api.showToast('问题摘要已带入，请核对后继续申请。');}
    }
    return true;
  }
  function submit(form,api) {
    if (form.id!=='c-ai-question-form') return false;
    saveDraft(api.root);
    if (!ask(questionDraft,api.context)) {api.showToast(selectedProduct(api.context)?'请先描述遇到的问题。':'请先同步或添加需要帮助的产品。');return true;}
    api.render();return true;
  }
  const screens=window.TOTO_SCREENS.consumer.screens;
  const floating = screenId => ['c-home','c-welcome'].includes(screenId) ? '<button class="c-ai-fab" data-ai="start" aria-label="打开智能售后助手"><span aria-hidden="true">AI</span></button>' : '';
  const index=screens.findIndex(screen=>screen.id==='c-home')+1;
  screens.splice(index,0,
    {id:'c-ai-assistant',title:'AI 售后助手',entry:'C18 · 产品知识一轮智能问答',parent:'c-home',goal:'默认带入首页当前产品，只在命中适用品番的已发布知识时给出一轮安全建议；没有产品时引导同步／添加，也始终提供人工客服入口。',note:'原型固定数据映射到现有 A23 服务知识库字段。正式实现需要消费者安全查询接口、失败降级和审计；人工客服进入 C09 渠道页，不伪造会话转接。右侧“加载中／加载失败”可检查 AI 专属降级状态。',body:assistantBody,footer:assistantFooter},
    {id:'c-ai-handoff',title:'继续服务',entry:'C18 · AI 摘要与现有服务流程接续',parent:'c-ai-assistant',goal:'允许用户修改 AI 整理的关键内容，再带入维修申请，或复制摘要并直接进入电话／微信客服选择。',note:'消费者建单接口尚未实现，因此本页不直接创建工单。微信在线客服在正式小程序使用 button open-type=contact；电话需后台提供有效号码后才可调用 wx.makePhoneCall。',body:handoffBody,footer:handoffFooter}
  );
  window.TOTO_AI_ASSISTANT={owns,floating,statusView,saveDraft,handle,submit,ask,summaryText,snapshot:()=>JSON.parse(JSON.stringify(state)),reset:()=>{state=fresh();questionDraft='';}};
})();
